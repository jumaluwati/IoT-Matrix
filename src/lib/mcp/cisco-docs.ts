/**
 * Cisco Docs AI client.
 *
 * Wraps the REST endpoint at https://docs-ai.cloudapps.cisco.com/api/v1/docs/ask
 * which returns grounded answers from Cisco product documentation, with sources
 * and a confidence score.
 *
 * Configured via env (see .env.example):
 *   CISCO_DOCS_API_URL=https://docs-ai.cloudapps.cisco.com/api/v1/docs/ask
 *   CISCO_DOCS_API_KEY=<X-API-Key from your Cisco Docs account>
 *   CISCO_DOCS_TIMEOUT_MS=15000   (optional, default 15s)
 */

export interface CiscoDocsAnswer {
  answer: string;
  sources: string[];
  confidence?: number;
}

export interface CiscoDocsAskOptions {
  /** Narrow the search to a specific Cisco product (e.g. "Cisco Catalyst IR8300"). */
  product?: string;
  /** Optional caller identifier — surfaces in audit logs on Cisco's side. */
  userId?: string;
  /** Per-call timeout override (ms). */
  timeoutMs?: number;
  /** Skip the cache read and re-fetch from upstream, overwriting the cached entry. */
  forceRefresh?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — Cisco doc answers don't change hourly
// Disk-backed cache file. Survives dev-server restarts so the app's knowledge
// base grows over time — each new question answered upstream is remembered
// for at least DEFAULT_CACHE_TTL_MS, and on rehydrate we keep only the
// non-expired entries. Path is relative to the Node process cwd (repo root).
const CACHE_DIR = ".cache";
const CACHE_FILE = `${CACHE_DIR}/cisco-docs.json`;

// In-memory cache shared across all server-side calls. Persists for the life
// of the Node process — a request that resolved once is cheap forever after.
// Restart the dev server to clear in-memory; delete .cache/cisco-docs.json
// to clear the disk copy too. (Production would back this with a real KV.)
interface CacheEntry {
  value: CiscoDocsAnswer;
  expiresAt: number;
}
const docsCache = new Map<string, CacheEntry>();

// Lazy fs imports so we don't pay the cost in edge runtimes that won't use them.
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
        docsCache.set(k, entry);
        loaded++;
      }
    }
    if (loaded > 0) {
      // eslint-disable-next-line no-console
      console.log(`[cisco-docs] rehydrated ${loaded} cached answer(s) from ${CACHE_FILE}`);
    }
  } catch (err) {
    // Disk cache is best-effort — corruption or missing dir should never block requests.
    // eslint-disable-next-line no-console
    console.warn(`[cisco-docs] could not load disk cache:`, (err as Error).message);
  }
}

let saveScheduled = false;
function saveCacheToDisk(): void {
  if (saveScheduled) return;
  saveScheduled = true;
  // Debounce writes so a burst of new answers only triggers one fsync.
  setTimeout(() => {
    saveScheduled = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require("node:fs") as typeof import("node:fs");
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      const out: Record<string, CacheEntry> = {};
      const now = Date.now();
      for (const [k, entry] of docsCache.entries()) {
        if (entry.expiresAt > now) out[k] = entry;
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(out), "utf8");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[cisco-docs] could not persist cache:`, (err as Error).message);
    }
  }, 250).unref?.();
}

export function clearCiscoDocsCache(): void {
  docsCache.clear();
  saveCacheToDisk();
}

export function ciscoDocsCacheSize(): number {
  return docsCache.size;
}

function cacheKey(question: string, product?: string): string {
  return `${question.toLowerCase().trim()}::${(product ?? "").toLowerCase().trim()}`;
}

export function ciscoDocsConfigured(): boolean {
  return Boolean(process.env.CISCO_DOCS_API_URL && process.env.CISCO_DOCS_API_KEY);
}

export async function askCiscoDocs(
  question: string,
  opts: CiscoDocsAskOptions = {}
): Promise<CiscoDocsAnswer> {
  const url = process.env.CISCO_DOCS_API_URL;
  const apiKey = process.env.CISCO_DOCS_API_KEY;
  if (!url || !apiKey) {
    throw new Error("CISCO_DOCS_API_URL and CISCO_DOCS_API_KEY must be set in .env.local");
  }

  // Cache lookup — second+ visits for the same product/question are instant.
  loadCacheFromDisk();
  const key = cacheKey(question, opts.product);
  if (!opts.forceRefresh) {
    const cached = docsCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      // Debounced save guarantees that any in-memory entries from before disk
      // persistence existed still get flushed to disk on the next hit.
      saveCacheToDisk();
      return cached.value;
    }
  }

  // Cisco Docs sometimes 409s with a "matched multiple Cisco products" body
  // and a bulleted list of more-specific names to retry with. We do one
  // automatic retry with the first non-"Modules" suggestion (the bare series
  // is almost always what we want; "X Modules" pages are accessory parts).
  // Each retry's resolved-product key is also cached so we don't re-hit the
  // 409 next time. See: askOnce + parseDisambiguation below.
  const value = await askOnce(url, apiKey, question, opts);
  if (value.answer) {
    docsCache.set(key, { value, expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS });
    saveCacheToDisk();
  }
  return value;
}

async function askOnce(
  url: string,
  apiKey: string,
  question: string,
  opts: CiscoDocsAskOptions,
  attempt = 0
): Promise<CiscoDocsAnswer> {
  const controller = new AbortController();
  // Bug guard: Number(undefined) is NaN, and (NaN ?? x) does NOT fall through.
  // Use a chained `||` so NaN/0 fall back cleanly to the default.
  const envTimeout = Number(process.env.CISCO_DOCS_TIMEOUT_MS);
  const timeoutMs =
    opts.timeoutMs || (Number.isFinite(envTimeout) && envTimeout > 0 ? envTimeout : DEFAULT_TIMEOUT_MS);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify({
        question,
        ...(opts.product ? { product: opts.product } : {}),
        ...(opts.userId ? { userId: opts.userId } : {})
      }),
      signal: controller.signal,
      cache: "no-store"
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // 409 = ambiguous product. Retry once with a more-specific suggestion
      // from the error body. After 1 retry we give up (some products legit
      // don't exist in their corpus).
      if (res.status === 409 && attempt === 0) {
        const better = parseDisambiguation(text, opts.product);
        if (better && better !== opts.product) {
          // eslint-disable-next-line no-console
          console.log(
            `[cisco-docs] 409 ambiguous "${opts.product ?? "<no product>"}" → retrying with "${better}"`
          );
          clearTimeout(timer);
          return askOnce(url, apiKey, question, { ...opts, product: better }, attempt + 1);
        }
      }
      throw new Error(`Cisco Docs returned ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as Partial<CiscoDocsAnswer>;
    return {
      answer: typeof json.answer === "string" ? json.answer : "",
      sources: Array.isArray(json.sources) ? json.sources.filter((s): s is string => typeof s === "string") : [],
      confidence: typeof json.confidence === "number" ? json.confidence : undefined
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parse the 409 "matched multiple Cisco products" body for the best
 * disambiguated product name to retry with.
 *
 * The body looks like:
 *   {"detail":"Your search for 'Catalyst IE3300' matched multiple Cisco products.\n\n
 *     • Cisco Catalyst IE3300 Rugged Series\n
 *     • Cisco Catalyst IE3300 Rugged Series Modules\n\n
 *     Please call again with the specific product name..."}
 *
 * Heuristic: prefer the bare series name over "X Modules" / "X Accessories"
 * since end users typically want capabilities of the platform, not the spare-parts
 * SKU catalog. Falls back to the first bullet if no preference applies.
 */
function parseDisambiguation(body: string, original?: string): string | null {
  if (!body) return null;
  // The body may be a JSON envelope or raw text; extract bullets from either.
  const candidates: string[] = [];
  const bulletRe = /[•\-*]\s+([^\n"\\]+?)(?=\\n|\n|"|$)/g;
  let m: RegExpExecArray | null;
  while ((m = bulletRe.exec(body)) !== null) {
    const name = m[1].trim().replace(/\s+/g, " ");
    if (name && name.length < 120) candidates.push(name);
  }
  if (candidates.length === 0) return null;
  // Drop the original query if it appears (we already know it's ambiguous).
  const filtered = candidates.filter(
    (c) => !original || c.toLowerCase() !== original.toLowerCase()
  );
  const pool = filtered.length > 0 ? filtered : candidates;
  // Prefer non-Modules / non-Accessories entries.
  const preferred = pool.find((c) => !/modules?|accessor|spare|cable/i.test(c));
  return preferred ?? pool[0];
}

// ---- Legacy stub-compatible exports preserved for orchestrator imports ----
export interface CiscoDocsHit {
  title: string;
  url: string;
  snippet: string;
  productSlug?: string;
}

export interface CiscoDatasheet {
  productSlug: string;
  title: string;
  publishedISO: string;
  url: string;
  highlights: string[];
}

/**
 * Best-effort adapter so the orchestrator can pull Cisco Docs context into a
 * Circuit prompt. Returns the answer as the first hit's snippet and each source
 * label as a separate hit so downstream code can list references.
 */
export async function searchCiscoDocs(
  query: string,
  opts?: { productFilter?: string[] }
): Promise<CiscoDocsHit[]> {
  if (!ciscoDocsConfigured()) return [];
  try {
    const a = await askCiscoDocs(query, { product: opts?.productFilter?.[0] });
    if (!a.answer && a.sources.length === 0) return [];
    return [
      {
        title: "Cisco Docs answer",
        url: "",
        snippet: a.answer.slice(0, 400),
        productSlug: opts?.productFilter?.[0]
      },
      ...a.sources.map((s) => ({
        title: s,
        url: "",
        snippet: "",
        productSlug: opts?.productFilter?.[0]
      }))
    ];
  } catch {
    return [];
  }
}

export async function getDatasheet(_productSlug: string): Promise<CiscoDatasheet | null> {
  // Not exposed by the Docs AI REST endpoint; would require a separate Cisco Docs
  // catalog query. Returning null keeps existing callers happy.
  return null;
}

// ---- Markdown answer parsing for the distilled cards UI ----

export interface DocsHighlight {
  title: string;
  body: string;
}

export interface DocsReference {
  index: number;
  title: string;
  url: string;
}

export interface ParsedDocsAnswer {
  intro?: string;
  highlights: DocsHighlight[];
  outro?: string;
  references: DocsReference[];
}

/**
 * Cisco Docs returns markdown structured as:
 *   <intro paragraph>
 *   - **Title**: body
 *   - **Title**: body
 *   <outro paragraph with inline [n](url) citations>
 *   **Reference Document Links:**
 *   1. [Title](url)
 *   2. [Title](url)
 *
 * Split that into structured chunks so the page can render proper cards
 * instead of a wall of markdown text.
 */
export function parseDocsAnswer(raw: string): ParsedDocsAnswer {
  if (!raw) return { highlights: [], references: [] };

  // 1. Pull off the References block first so it doesn't get folded into the outro.
  let body = raw;
  const references: DocsReference[] = [];
  const refHeaderMatch = body.match(/\*\*Reference Document Links:?\*\*|Reference Document Links:/i);
  if (refHeaderMatch && typeof refHeaderMatch.index === "number") {
    const refSection = body.slice(refHeaderMatch.index + refHeaderMatch[0].length);
    body = body.slice(0, refHeaderMatch.index).trimEnd();
    const refRe = /(\d+)\.\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = refRe.exec(refSection)) !== null) {
      pushUniqueRef(references, m[2].trim(), m[3].trim());
    }
  }

  // 2. Walk the body line-by-line to extract intro → bullets → outro.
  //    We deliberately accept a wide variety of bullet formats — Cisco Docs
  //    sometimes returns `- **Title**: body`, sometimes `1. **Title** — body`,
  //    sometimes just `- text` with no title at all. Each shape needs to land
  //    as a card so the section is never empty.
  const lines = body.split(/\r?\n/);
  const introLines: string[] = [];
  const outroLines: string[] = [];
  const highlights: DocsHighlight[] = [];
  let phase: "intro" | "bullets" | "outro" = "intro";

  // Matches `- foo`, `* foo`, `• foo`, or `1. foo` (with arbitrary leading space).
  const bulletStartRe = /^\s*(?:[-*•]|\d+[.)])\s+(.+)$/;

  for (const rawLine of lines) {
    const line = rawLine;
    const bulletMatch = line.match(bulletStartRe);
    if (bulletMatch) {
      phase = "bullets";
      const card = parseBulletContent(bulletMatch[1].trim());
      if (card) highlights.push(card);
      continue;
    }

    // Indented continuation of the last bullet (no leading dash).
    if (phase === "bullets" && line.match(/^\s{2,}\S/) && highlights.length > 0) {
      const cont = stripInlineCitations(line.trim());
      if (cont) highlights[highlights.length - 1].body =
        (highlights[highlights.length - 1].body + " " + cont).trim();
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    if (phase === "intro") introLines.push(trimmed);
    else {
      phase = "outro";
      outroLines.push(trimmed);
    }
  }

  // Cisco Docs frequently closes the answer with an inline
  // "Reference: [Title](url), [Title](url)" clause on top of (or instead of)
  // the formal "Reference Document Links:" block. Pull those named links into
  // `references` (deduped by URL/title) and strip the dangling label so the
  // outro renders as clean prose instead of raw markdown.
  const introText = harvestInlineLinks(introLines.join(" ").trim(), references);
  const outroText = harvestInlineLinks(outroLines.join(" ").trim(), references);

  return {
    intro: stripInlineCitations(introText) || undefined,
    highlights,
    outro: stripInlineCitations(outroText) || undefined,
    references
  };
}

/**
 * Best-effort title/body extraction for a single bullet's content. Returns null
 * only when the line is genuinely empty after cleanup.
 *
 * Supports:
 *   **Title**: body
 *   **Title** — body / – body / - body / . body
 *   **Title** body            (bold followed by prose, no separator)
 *   **Title**                 (bold only, no body)
 *   Title: body               (Title-Case word(s) followed by a colon)
 *   plain prose               (first short sentence becomes title)
 */
function parseBulletContent(content: string): DocsHighlight | null {
  const cleaned = content.trim();
  if (!cleaned) return null;

  // **Title**: body  /  **Title** — body  /  **Title**. body
  let m = cleaned.match(/^\*\*([^*]+)\*\*\s*[:.\-—–]\s*(.+)$/);
  if (m) {
    return { title: m[1].trim(), body: stripInlineCitations(m[2].trim()) };
  }

  // **Title** body  (no separator at all)
  m = cleaned.match(/^\*\*([^*]+)\*\*\s+(.+)$/);
  if (m) {
    return { title: m[1].trim(), body: stripInlineCitations(m[2].trim()) };
  }

  // **Title**  (bold only)
  m = cleaned.match(/^\*\*([^*]+)\*\*\s*$/);
  if (m) {
    return { title: m[1].trim(), body: "" };
  }

  // Title: body  (no bold; title-case prefix up to ~60 chars before a colon)
  m = cleaned.match(/^([A-Z][\w &/()'\-+]{2,60}):\s+(.+)$/);
  if (m) {
    return { title: m[1].trim(), body: stripInlineCitations(m[2].trim()) };
  }

  // Plain prose — no clean title is extractable, so render the card body-only.
  // (The card UI handles empty titles by hiding the heading.)
  const stripped = stripInlineCitations(cleaned);
  if (!stripped) return null;
  return { title: "", body: stripped };
}

/**
 * Normalize a reference title for dedup: lowercase, drop a trailing
 * "- Cisco"/"| Cisco" site suffix and trailing punctuation. Lets us recognize
 * "… Data Sheet" and "… Data Sheet - Cisco" as the same source.
 */
function normalizeRefTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*[-–—|·]\s*cisco\s*$/i, "")
    .replace(/[\s.]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Push a reference, skipping duplicates (matched by URL or normalized title)
 * and bare numeric citation markers. Keeps `index` sequential.
 */
function pushUniqueRef(refs: DocsReference[], title: string, url: string): void {
  const cleanTitle = title.trim();
  const cleanUrl = url.trim();
  if (!cleanTitle && !cleanUrl) return;
  if (!cleanUrl && /^\d+$/.test(cleanTitle)) return;
  const normTitle = normalizeRefTitle(cleanTitle);
  const dupe = refs.some((r) => {
    if (cleanUrl && r.url && r.url.toLowerCase() === cleanUrl.toLowerCase()) return true;
    if (normTitle && normalizeRefTitle(r.title) === normTitle) return true;
    return false;
  });
  if (dupe) return;
  refs.push({ index: refs.length + 1, title: cleanTitle || cleanUrl, url: cleanUrl });
}

/**
 * Pull inline named markdown links (`[Title](https://…)`) out of a paragraph,
 * fold them into `refs`, and return the prose with the links — plus any
 * now-dangling "Reference:"/"Sources:" label — removed. Only touches the text
 * when at least one link was extracted, so plain prose ending in the word
 * "sources" is left untouched.
 */
function harvestInlineLinks(text: string, refs: DocsReference[]): string {
  if (!text) return text;
  const linkRe = /\[([^\]]+)\]\s*\((https?:\/\/[^)\s]+)\)/g;
  let removed = 0;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(text)) !== null) {
    pushUniqueRef(refs, m[1].trim(), m[2].trim());
    removed++;
  }
  if (removed === 0) return text;
  return text
    .replace(linkRe, "")
    .replace(/[\s;,]*\b(?:references?|sources?|see\s+also)\b\s*:?\s*[,;.\u2022\s]*$/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;])/g, "$1")
    .trim();
}

// Remove trailing markdown citations like " [1]", " [2](url)", " [1], [2]" from text.
// Also collapses any leftover named markdown link to its title text so a card
// body never renders raw `[Title](url)` markup.
function stripInlineCitations(text: string): string {
  return text
    // Inline numbered links: [1](url) or [1] (url)
    .replace(/\[\d+\]\s*\((?:https?:\/\/[^)]+)\)/g, "")
    // Any remaining named markdown link → keep just the title text.
    .replace(/\[([^\]]+)\]\s*\((?:https?:\/\/[^)\s]+)\)/g, "$1")
    // Bare numbered refs: [1]
    .replace(/\[\d+\]/g, "")
    // Tidy double spaces and dangling commas from the substitution.
    .replace(/\s+,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

