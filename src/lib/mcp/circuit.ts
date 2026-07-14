/**
 * Cisco Circuit client.
 *
 * - circuitChat()       — OAuth2 client_credentials → access token → POST to the
 *                         Cisco AI Gateway chat completions endpoint.
 * - circuitRagQuery()   — Cisco internal search / RAG. Awaiting access approval;
 *                         currently returns [] so callers degrade gracefully.
 *
 * Auth pattern:
 *   POST {CIRCUIT_TOKEN_URL}                    (Basic auth: client_id:client_secret)
 *     grant_type=client_credentials[&scope=...]
 *   → { access_token, expires_in }
 *
 * Chat pattern (verified working against chat-ai.cisco.com):
 *   POST {CIRCUIT_BASE_URL}/{model}/chat/completions
 *     api-key: {access_token}                    ← the OAuth token, NOT the app key
 *     Content-Type: application/json
 *     Accept: application/json
 *   body.user: JSON.stringify({ appkey: CIRCUIT_APP_KEY })
 *                                                ← app key travels in the body
 *
 * Note: No Authorization header. No api-version query param. The gateway routes
 * to Azure OpenAI under the hood but exposes a simpler interface.
 */

export interface CircuitChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CircuitChatRequest {
  messages: CircuitChatMessage[];
  model?: string;
  temperature?: number;
  responseFormat?: "text" | "json";
  maxTokens?: number;
}

export interface CircuitChatResponse {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface CircuitRagHit {
  text: string;
  source: string;
  score: number;
  url?: string;
}

// ---------- Internal access-token cache ----------
type TokenCacheEntry = { token: string; expiresAt: number };
let tokenCache: TokenCacheEntry | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.CIRCUIT_CLIENT_ID;
  const clientSecret = process.env.CIRCUIT_CLIENT_SECRET;
  const tokenUrl = process.env.CIRCUIT_TOKEN_URL;
  if (!clientId || !clientSecret || !tokenUrl) {
    throw new Error(
      "Cisco Circuit not configured — set CIRCUIT_CLIENT_ID, CIRCUIT_CLIENT_SECRET and CIRCUIT_TOKEN_URL in .env.local."
    );
  }

  // Reuse cached token if still valid (60s safety margin before expiry).
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.token;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const params = new URLSearchParams({ grant_type: "client_credentials" });
  if (process.env.CIRCUIT_SCOPE) params.set("scope", process.env.CIRCUIT_SCOPE);
  // Okta custom auth servers / some Cisco gateways require an explicit audience claim.
  if (process.env.CIRCUIT_AUDIENCE) params.set("audience", process.env.CIRCUIT_AUDIENCE);

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${basic}`
    },
    body: params.toString()
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Circuit token request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new Error("Circuit token response missing access_token.");
  }

  tokenCache = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600) * 1000
  };
  return json.access_token;
}

export async function circuitChat(req: CircuitChatRequest): Promise<CircuitChatResponse> {
  const baseUrl = process.env.CIRCUIT_BASE_URL;
  const model = req.model ?? process.env.CIRCUIT_MODEL;
  if (!baseUrl || !model) {
    throw new Error(
      "Cisco Circuit not configured — set CIRCUIT_BASE_URL and CIRCUIT_MODEL in .env.local."
    );
  }

  const token = await getAccessToken();
  const appKey = process.env.CIRCUIT_APP_KEY;
  const url = `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(model)}/chat/completions`;

  const body: Record<string, unknown> = {
    messages: req.messages,
    temperature: req.temperature ?? 0.2,
    max_tokens: req.maxTokens ?? 2048,
    // The app key MUST travel in the body as a JSON-stringified object — this is
    // how the gateway attributes usage and routes to the right deployment.
    user: appKey ? JSON.stringify({ appkey: appKey }) : undefined
  };
  if (req.responseFormat === "json") {
    body.response_format = { type: "json_object" };
  }

  // The Cisco AI Gateway expects the OAuth access token in the api-key header.
  // It does NOT use a separate Authorization: Bearer header.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "api-key": token
  };

  // Hard timeout so a hanging gateway never blocks the request thread.
  // Default is 180s because smaller Circuit models (gpt-5-nano, gpt-4o-mini)
  // need 90-150s to emit a full Battlecard JSON with the current schema +
  // grounding context + post-processing rules. 90s was hitting the limit on
  // every cold call and dropping the page to the Quick Read fallback.
  // Measured: tiny prompts ~2s, 3k-token prose 22-45s, full Battlecard prompt
  // 60-150s depending on model. Override with CIRCUIT_TIMEOUT_MS in .env.local
  // if your model is faster (or to bump even higher for slow models).
  const controller = new AbortController();
  const envT = Number(process.env.CIRCUIT_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(envT) && envT > 0 ? envT : 180_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  const startedAt = Date.now();
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      // eslint-disable-next-line no-console
      console.warn(
        `[circuit] aborted after ${timeoutMs}ms (CIRCUIT_TIMEOUT_MS). Model=${model}.`
      );
      throw new Error(`Circuit chat timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
  const elapsedMs = Date.now() - startedAt;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.warn(`[circuit] chat failed (${res.status}) after ${elapsedMs}ms: ${text.slice(0, 200)}`);
    throw new Error(`Circuit chat failed (${res.status}): ${text.slice(0, 500)}`);
  }
  if (elapsedMs > 30_000) {
    // eslint-disable-next-line no-console
    console.warn(`[circuit] slow response: ${elapsedMs}ms for model=${model}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  return {
    content: json.choices?.[0]?.message?.content ?? "",
    model: json.model ?? model,
    usage: json.usage
      ? {
          promptTokens: json.usage.prompt_tokens ?? 0,
          completionTokens: json.usage.completion_tokens ?? 0,
          totalTokens: json.usage.total_tokens ?? 0
        }
      : undefined
  };
}

/**
 * Cisco internal search / RAG.
 * Pending access approval — returns an empty array so the orchestrator can
 * still synthesize from model knowledge alone. When approved, wire it here
 * using the same getAccessToken() above.
 */
export async function circuitRagQuery(
  _query: string,
  _opts?: { topK?: number; filter?: Record<string, string> }
): Promise<CircuitRagHit[]> {
  return [];
}

export function circuitConfigured(): boolean {
  return Boolean(
    process.env.CIRCUIT_CLIENT_ID &&
      process.env.CIRCUIT_CLIENT_SECRET &&
      process.env.CIRCUIT_TOKEN_URL &&
      process.env.CIRCUIT_BASE_URL &&
      process.env.CIRCUIT_MODEL
  );
}
