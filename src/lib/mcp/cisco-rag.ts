/**
 * Cisco Data RAG client (genai-ext-rag / context_inference).
 *
 * Wraps the REST endpoint at chat-ai.cisco.com/genai-ext-rag/api/v2.0/context_inference
 * which returns grounded markdown answers from Cisco's curated RAG indexes.
 *
 * Configured via env (see .env.example):
 *   CISCO_RAG_URL=https://chat-ai.cisco.com/genai-ext-rag/api/v2.0/context_inference
 *   CISCO_RAG_APP_ID=<your registered RAG app id>
 *   CISCO_RAG_USER_ID=<user identifier surfaced in audit logs>
 *   CISCO_RAG_TIMEOUT_MS=30000        (optional, default 30s)
 *
 * Auth (OAuth2 client_credentials → id.cisco.com):
 *   Reuses CIRCUIT_CLIENT_ID / CIRCUIT_CLIENT_SECRET / CIRCUIT_TOKEN_URL by default
 *   (same Okta tenant). If your tenant requires a dedicated app for the RAG scope,
 *   set CISCO_RAG_CLIENT_ID / CISCO_RAG_CLIENT_SECRET and they take precedence.
 *
 * Response shape mirrors Cisco Docs AI closely enough that `parseDocsAnswer`
 * works on the `answer` field unchanged — same `**Title**: body` bullets and
 * `**Reference Document Links:**\n1. [Title](url)` block.
 */

export interface CiscoRagAnswer {
  answer: string;
  sources: string[];
  isAnswerUnknown?: boolean;
}

export interface CiscoRagAskOptions {
  /** Override the per-tenant App ID for this single call. */
  appId?: string;
  /** Override the user identifier for this single call. */
  userId?: string;
  /** Per-call timeout override (ms). */
  timeoutMs?: number;
  /** Skip the cache read and re-fetch from upstream, overwriting the cached entry. */
  forceRefresh?: boolean;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — license-tier data is stable
const CACHE_DIR = ".cache";
const CACHE_FILE = `${CACHE_DIR}/cisco-rag.json`;

interface CacheEntry {
  value: CiscoRagAnswer;
  expiresAt: number;
}
const ragCache = new Map<string, CacheEntry>();

let fsLoaded = false;
function loadCacheFromDisk(): void {
  if (fsLoaded) return;
  fsLoaded = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("node:fs") as typeof import("node:fs");
    if (!fs.existsSync(CACHE_FILE)) return;
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    const now = Date.now();
    let loaded = 0;
    for (const [k, entry] of Object.entries(parsed)) {
      if (entry?.value?.answer && typeof entry.expiresAt === "number" && entry.expiresAt > now) {
        ragCache.set(k, entry);
        loaded++;
      }
    }
    if (loaded > 0) {
      // eslint-disable-next-line no-console
      console.log(`[cisco-rag] rehydrated ${loaded} cached answer(s) from ${CACHE_FILE}`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[cisco-rag] could not load disk cache:`, (err as Error).message);
  }
}

let saveScheduled = false;
function saveCacheToDisk(): void {
  if (saveScheduled) return;
  saveScheduled = true;
  setTimeout(() => {
    saveScheduled = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require("node:fs") as typeof import("node:fs");
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      const out: Record<string, CacheEntry> = {};
      const now = Date.now();
      for (const [k, entry] of ragCache.entries()) {
        if (entry.expiresAt > now) out[k] = entry;
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(out), "utf8");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[cisco-rag] could not persist cache:`, (err as Error).message);
    }
  }, 250).unref?.();
}

export function clearCiscoRagCache(): void {
  ragCache.clear();
  saveCacheToDisk();
}

export function ciscoRagCacheSize(): number {
  return ragCache.size;
}

function cacheKey(query: string, appId: string, userId: string): string {
  return `${appId}::${userId}::${query.toLowerCase().trim()}`;
}

export function ciscoRagConfigured(): boolean {
  // Auth credentials are required (either dedicated RAG creds or Circuit fallback)
  // plus URL + App ID + User ID.
  const hasUrl = Boolean(process.env.CISCO_RAG_URL);
  const hasApp = Boolean(process.env.CISCO_RAG_APP_ID);
  const hasUser = Boolean(process.env.CISCO_RAG_USER_ID);
  const hasAuth = Boolean(
    process.env.CISCO_RAG_CLIENT_ID && process.env.CISCO_RAG_CLIENT_SECRET
  ) || Boolean(
    process.env.CIRCUIT_CLIENT_ID && process.env.CIRCUIT_CLIENT_SECRET
  );
  const hasTokenUrl = Boolean(process.env.CISCO_RAG_TOKEN_URL || process.env.CIRCUIT_TOKEN_URL);
  return hasUrl && hasApp && hasUser && hasAuth && hasTokenUrl;
}

// ---------- Internal access-token cache ----------
type TokenCacheEntry = { token: string; expiresAt: number };
let tokenCache: TokenCacheEntry | null = null;

async function getAccessToken(): Promise<string> {
  // Prefer dedicated RAG credentials; fall back to Circuit's (same Okta tenant).
  const clientId = process.env.CISCO_RAG_CLIENT_ID || process.env.CIRCUIT_CLIENT_ID;
  const clientSecret = process.env.CISCO_RAG_CLIENT_SECRET || process.env.CIRCUIT_CLIENT_SECRET;
  const tokenUrl = process.env.CISCO_RAG_TOKEN_URL || process.env.CIRCUIT_TOKEN_URL;
  if (!clientId || !clientSecret || !tokenUrl) {
    throw new Error(
      "Cisco RAG auth not configured — set CISCO_RAG_CLIENT_ID/SECRET (or reuse CIRCUIT_CLIENT_ID/SECRET) and CISCO_RAG_TOKEN_URL (or CIRCUIT_TOKEN_URL) in .env.local."
    );
  }

  // Reuse cached token if still valid (60s safety margin before expiry).
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.token;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const params = new URLSearchParams({ grant_type: "client_credentials" });
  const scope = process.env.CISCO_RAG_SCOPE || process.env.CIRCUIT_SCOPE;
  if (scope) params.set("scope", scope);
  const audience = process.env.CISCO_RAG_AUDIENCE || process.env.CIRCUIT_AUDIENCE;
  if (audience) params.set("audience", audience);

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
    throw new Error(`Cisco RAG token request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new Error("Cisco RAG token response missing access_token.");
  }

  tokenCache = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600) * 1000
  };
  return json.access_token;
}

export async function askCiscoRag(
  query: string,
  opts: CiscoRagAskOptions = {}
): Promise<CiscoRagAnswer> {
  const url = process.env.CISCO_RAG_URL;
  const appId = opts.appId ?? process.env.CISCO_RAG_APP_ID;
  const userId = opts.userId ?? process.env.CISCO_RAG_USER_ID;
  if (!url || !appId || !userId) {
    throw new Error("CISCO_RAG_URL, CISCO_RAG_APP_ID, and CISCO_RAG_USER_ID must be set in .env.local");
  }

  loadCacheFromDisk();
  const key = cacheKey(query, appId, userId);
  if (!opts.forceRefresh) {
    const cached = ragCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      saveCacheToDisk();
      return cached.value;
    }
  }

  const controller = new AbortController();
  const envTimeout = Number(process.env.CISCO_RAG_TIMEOUT_MS);
  const timeoutMs =
    opts.timeoutMs || (Number.isFinite(envTimeout) && envTimeout > 0 ? envTimeout : DEFAULT_TIMEOUT_MS);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = await getAccessToken();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        UserID: userId,
        Query: query,
        AppId: appId,
        chatConversationID: "",
        chatRequestID: "",
        chatSessionID: "",
        Streaming: false
      }),
      signal: controller.signal,
      cache: "no-store"
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Cisco RAG returned ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      data?: string;
      reference_urls?: string[];
      is_answer_unknown?: boolean;
      return_code?: number;
      return_message?: string;
    };

    if (typeof json.return_code === "number" && json.return_code !== 0) {
      throw new Error(`Cisco RAG returned error code ${json.return_code}: ${json.return_message ?? "(no message)"}`);
    }

    const value: CiscoRagAnswer = {
      answer: typeof json.data === "string" ? json.data : "",
      sources: Array.isArray(json.reference_urls)
        ? json.reference_urls.filter((s): s is string => typeof s === "string")
        : [],
      isAnswerUnknown: Boolean(json.is_answer_unknown)
    };

    // Only cache substantive answers — don't memoize empty responses or known-unknowns.
    if (value.answer && !value.isAnswerUnknown) {
      ragCache.set(key, { value, expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS });
      saveCacheToDisk();
    }
    return value;
  } finally {
    clearTimeout(timer);
  }
}

// ---- Licensing-tier parser ----
// Parser implementation lives in cisco-rag-parser.ts so it can be safely
// imported from client components (this file uses `node:fs` and can't be
// bundled into the client). Re-exported here so existing callers keep working.
export type { LicenseTier, ParsedLicenseTiers, ParsedReference } from "./cisco-rag-parser";
export { parseLicenseTiers, parseReferenceLinks } from "./cisco-rag-parser";
