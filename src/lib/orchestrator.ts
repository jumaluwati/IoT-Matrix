import type { Battlecard, ProductCategory } from "@/lib/types";
import { getBattlecard } from "@/data/battlecards";
import { getCompetitorProduct } from "@/data/competitors";
import { CISCO_IIOT, defaultCiscoForCategory } from "@/data/cisco-iiot";
import { searchCiscoDocs } from "./mcp/cisco-docs";
import { searchCiscoDefects } from "./mcp/cdets";
import { searchWebexSpaces } from "./mcp/webex";
import { fetchCompetitorContext } from "./mcp/public-web";
import { circuitChat, circuitConfigured } from "./mcp/circuit";

const FORCE_MOCK = (process.env.USE_MOCK_BATTLECARDS ?? "true") === "true";

// Short-lived negative cache for Circuit failures. If Circuit times out or 401s,
// don’t wait for it again on the next 60s of requests — just fall through to
// NoBattlecardYet so the page renders instantly. Cleared by clearOrchestratorCircuitCooldown()
// when the env or VPN changes.
let circuitCooldownUntil = 0;
const CIRCUIT_COOLDOWN_MS = 60 * 1000;
export function clearOrchestratorCircuitCooldown() {
  circuitCooldownUntil = 0;
}

/**
 * Status reported back from `generateBattlecardStatus()`. Lets the page render
 * an honest fallback message ("Circuit timed out, retrying shortly") instead
 * of a misleading "wire up Circuit" message when Circuit is already wired and
 * just slow.
 */
export type BattlecardSynthesisStatus =
  | "authored" // hand-authored card returned
  | "synthesized" // Circuit returned a usable card
  | "force-mock" // USE_MOCK_BATTLECARDS=true → never tried Circuit
  | "circuit-not-configured" // Circuit creds missing
  | "circuit-cooldown" // recent Circuit failure, cooling off
  | "circuit-failed"; // tried Circuit just now, it errored or timed out

let lastSynthesisError: { competitorSlug: string; productSlug: string; message: string; at: number } | null = null;

/** Read the orchestrator's view of the world for a given pair without making a network call. */
export function circuitCooldownActive(): boolean {
  return Date.now() < circuitCooldownUntil;
}
export function lastCircuitError(): { message: string; ageSec: number } | null {
  if (!lastSynthesisError) return null;
  return {
    message: lastSynthesisError.message,
    ageSec: Math.round((Date.now() - lastSynthesisError.at) / 1000)
  };
}

/** True if a background synthesis for this pair is currently running. */
export function isSynthesisInFlight(competitorSlug: string, productSlug: string): boolean {
  return inflightSyntheses.has(`${competitorSlug}/${productSlug}`);
}

/**
 * Age of the cached card in milliseconds, or null if no card is cached.
 * Used by the page to render "Last synthesized N hours ago" + a "Refresh now"
 * button when the card exists but is stale.
 */
export function cachedBattlecardAgeMs(competitorSlug: string, productSlug: string): number | null {
  const entry = battlecardCache.get(`${competitorSlug}/${productSlug}`);
  if (!entry?.createdAt) return null;
  return Date.now() - entry.createdAt;
}

/**
 * Snapshot of every synthesized battlecard currently in the disk-backed
 * cache. Used by the portfolio detail page to populate "When to lead with
 * this" with both authored AND synthesized recommendations, so SKUs that
 * only appear as Circuit picks (e.g. IE3500 chosen for Schneider TCSESB)
 * still show up in their portfolio cross-reference list.
 *
 * Returns a shallow array — caller treats it as read-only.
 */
export function listSynthesizedBattlecards(): {
  competitorSlug: string;
  productSlug: string;
  card: Battlecard;
  createdAt: number;
}[] {
  loadBattlecardCacheFromDisk();
  const out: { competitorSlug: string; productSlug: string; card: Battlecard; createdAt: number }[] = [];
  for (const [key, entry] of battlecardCache.entries()) {
    const [competitorSlug, productSlug] = key.split("/", 2);
    if (!competitorSlug || !productSlug) continue;
    out.push({
      competitorSlug,
      productSlug,
      card: entry.value,
      createdAt: entry.createdAt ?? entry.expiresAt - BATTLECARD_CACHE_TTL_MS
    });
  }
  return out;
}

// Positive cache for successful Circuit-synthesized battlecards — expensive to
// generate, so we hold them in memory for a week. Authored mocks bypass this.
// Also persisted to .cache/battlecards.json so synthesized cards survive dev
// restarts and the app's knowledge base grows over time.
//
// TTL strategy: cards are kept for 7 days. After 24h they become "stale" — the
// page serves the cached card INSTANTLY (no waiting) and kicks off a silent
// background refresh, so the next visit picks up fresh data. This is the
// classic stale-while-revalidate pattern. Demos and customer calls never
// block on Circuit; refreshes happen invisibly.
interface BattlecardCacheEntry { value: Battlecard; createdAt: number; expiresAt: number }
const battlecardCache = new Map<string, BattlecardCacheEntry>();
const BATTLECARD_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BATTLECARD_STALE_AFTER_MS = 24 * 60 * 60 * 1000;   // 24 hours
const BATTLECARD_CACHE_DIR = ".cache";
const BATTLECARD_CACHE_FILE = `${BATTLECARD_CACHE_DIR}/battlecards.json`;

// Track which keys have an in-flight background synthesis so we don't spawn
// duplicate Circuit calls when the same page is hit by 5 concurrent visitors.
const inflightSyntheses = new Set<string>();

export const BATTLECARD_STALE_AFTER_HOURS = BATTLECARD_STALE_AFTER_MS / (60 * 60 * 1000);
export const BATTLECARD_CACHE_TTL_HOURS = BATTLECARD_CACHE_TTL_MS / (60 * 60 * 1000);

let battlecardFsLoaded = false;
function loadBattlecardCacheFromDisk(): void {
  if (battlecardFsLoaded) return;
  battlecardFsLoaded = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("node:fs") as typeof import("node:fs");
    if (!fs.existsSync(BATTLECARD_CACHE_FILE)) return;
    const raw = fs.readFileSync(BATTLECARD_CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, BattlecardCacheEntry>;
    const now = Date.now();
    let loaded = 0;
    for (const [k, entry] of Object.entries(parsed)) {
      if (entry?.value && typeof entry.expiresAt === "number" && entry.expiresAt > now) {
        // Backfill createdAt for pre-stale-while-revalidate entries that don't
        // have it. Without this every old cache entry would look ancient and
        // immediately trigger a background refresh.
        if (typeof entry.createdAt !== "number") {
          entry.createdAt = Math.max(now - BATTLECARD_STALE_AFTER_MS + 60_000, entry.expiresAt - BATTLECARD_CACHE_TTL_MS);
        }
        battlecardCache.set(k, entry);
        loaded++;
      }
    }
    if (loaded > 0) {
      // eslint-disable-next-line no-console
      console.log(`[orchestrator] rehydrated ${loaded} synthesized battlecard(s) from ${BATTLECARD_CACHE_FILE}`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[orchestrator] could not load battlecard disk cache:`, (err as Error).message);
  }
}

let battlecardSaveScheduled = false;
function saveBattlecardCacheToDisk(): void {
  if (battlecardSaveScheduled) return;
  battlecardSaveScheduled = true;
  setTimeout(() => {
    battlecardSaveScheduled = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require("node:fs") as typeof import("node:fs");
      fs.mkdirSync(BATTLECARD_CACHE_DIR, { recursive: true });
      const out: Record<string, BattlecardCacheEntry> = {};
      const now = Date.now();
      for (const [k, entry] of battlecardCache.entries()) {
        if (entry.expiresAt > now) out[k] = entry;
      }
      fs.writeFileSync(BATTLECARD_CACHE_FILE, JSON.stringify(out), "utf8");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[orchestrator] could not persist battlecard cache:`, (err as Error).message);
    }
  }, 250).unref?.();
}

const CISCO_PRODUCT_SLUGS = [
  "ie3100", "ie3300", "ie3400", "ie3400h", "ie3500", "ie9300", "ie9320",
  "ir1101", "ir1800", "ir8300",
  "iw9167", "iw9165",
  "cyber-vision", "secure-firewall-3100", "iot-ops-dashboard", "catalyst-center"
] as const;

/**
 * Main entry point. Given (competitor, product), return a Battlecard.
 *
 * NON-BLOCKING by default. The page never waits 90+s for Circuit during a
 * demo or customer call. Flow:
 *
 *   - Authored mock exists → return instantly.
 *   - Cached card exists AND fresh (<24h) → return instantly.
 *   - Cached card exists but stale (>24h, <7d) → return CACHED card instantly,
 *     spawn background refresh. Next visit picks up fresh data.
 *   - No cached card → return null instantly, spawn background synthesis.
 *     Page renders Quick Compare with a "synthesizing" banner; user refreshes
 *     in ~2 min to see the full card.
 *
 * For the prewarm script (or any caller that WANTS to wait), pass
 * `{ blocking: true }` — falls back to the synchronous synthesis path.
 */
export interface GenerateBattlecardOptions {
  /** When true, wait for Circuit synthesis instead of fire-and-forget. */
  blocking?: boolean;
  /** When true, ignore the cache and force a fresh synthesis (still respects `blocking`). */
  force?: boolean;
}

export async function generateBattlecard(
  competitorSlug: string,
  productSlug: string,
  opts: GenerateBattlecardOptions = {}
): Promise<Battlecard | null> {
  const mock = getBattlecard(competitorSlug, productSlug);
  if (mock) return mock;
  if (FORCE_MOCK) return null;
  if (!circuitConfigured()) return null;

  const cacheKey = `${competitorSlug}/${productSlug}`;
  loadBattlecardCacheFromDisk();
  const cached = battlecardCache.get(cacheKey);
  const now = Date.now();

  // FRESH cache hit (<24h old, ignore `force`). Return instantly.
  if (!opts.force && cached && cached.expiresAt > now) {
    const ageMs = now - (cached.createdAt ?? cached.expiresAt - BATTLECARD_CACHE_TTL_MS);
    if (ageMs < BATTLECARD_STALE_AFTER_MS) {
      return cached.value;
    }
    // STALE cache hit (24h-7d old). Return the cached card NOW + refresh in
    // background so the next visit sees fresh data. User never blocks.
    if (!opts.blocking) {
      kickoffBackgroundSynthesis(competitorSlug, productSlug);
      return cached.value;
    }
    // Fall through to blocking path for prewarm.
  }

  // Negative cooldown — skip if Circuit just failed.
  if (now < circuitCooldownUntil) return cached?.value ?? null;

  // No cache (or force=true). Either fire-and-forget for the user, OR run
  // synchronously for the prewarm script.
  if (!opts.blocking) {
    kickoffBackgroundSynthesis(competitorSlug, productSlug);
    return cached?.value ?? null;
  }

  return synthesizeBattlecard(competitorSlug, productSlug);
}

/**
 * Spawn a background Circuit synthesis without awaiting. Deduped by cache key
 * so 5 concurrent visitors to the same compare page only trigger ONE Circuit
 * call. Errors are logged but never thrown to the caller — this is a true
 * fire-and-forget.
 *
 * Called from `generateBattlecard()` on a cache miss or stale hit. Also
 * exposed for the future "Refresh now" button.
 */
export function kickoffBackgroundSynthesis(competitorSlug: string, productSlug: string): void {
  const cacheKey = `${competitorSlug}/${productSlug}`;
  if (inflightSyntheses.has(cacheKey)) return;
  if (!circuitConfigured()) return;
  if (Date.now() < circuitCooldownUntil) return;
  inflightSyntheses.add(cacheKey);
  // eslint-disable-next-line no-console
  console.log(`[orchestrator] kicked off background synthesis: ${cacheKey}`);
  // The .catch + .finally is intentional — we want to ENSURE the inflight
  // marker is cleared even on failure, but we don't want to throw past the
  // void boundary because nothing is awaiting this promise.
  synthesizeBattlecard(competitorSlug, productSlug)
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(`[orchestrator] background synthesis failed for ${cacheKey}:`, (err as Error).message);
    })
    .finally(() => {
      inflightSyntheses.delete(cacheKey);
    });
}

/** Internal: actually run Circuit and cache the result. Throws on failure. */
async function synthesizeBattlecard(
  competitorSlug: string,
  productSlug: string
): Promise<Battlecard | null> {
  const cacheKey = `${competitorSlug}/${productSlug}`;

  // Look up the competitor product so we can pass its category to Circuit AND
  // enforce category-matching after Circuit returns. Without this, Circuit
  // sometimes recommends an IE-series switch for a competitor wireless AP
  // simply because switches are the largest portion of the Cisco IIoT catalog
  // we expose to it.
  const competitorProduct = getCompetitorProduct(competitorSlug, productSlug);
  const competitorCategory: ProductCategory | undefined = competitorProduct?.category;
  const competitorProductName = competitorProduct?.name ?? productSlug;
  const eligibleCiscoSlugs = competitorCategory
    ? Object.values(CISCO_IIOT)
        .filter((p) => p.category === competitorCategory)
        .map((p) => p.slug)
    : CISCO_PRODUCT_SLUGS.slice();

  // 1. Best-effort grounding in parallel. All MCPs swallow errors.
  const [docs, defects, webex, publicWeb] = await Promise.all([
    searchCiscoDocs(`${competitorSlug} ${productSlug} compete IIoT`).catch(() => []),
    Promise.resolve([] as Awaited<ReturnType<typeof searchCiscoDefects>>),
    searchWebexSpaces(`${competitorSlug} ${productSlug}`, { days: 90 }).catch(() => []),
    fetchCompetitorContext(competitorSlug, productSlug).catch(() => [])
  ]);

  // 2. Synthesis prompt — strict schema, valid Cisco SKUs only, JSON-only output.
  const systemPrompt = [
    "You are a Cisco Industrial IoT compete analyst supporting a Cisco sales engineer in a live customer call.",
    "Generate a Battlecard JSON object. Reply with valid JSON only — no markdown, no prose around it.",
    "",
    "Schema (TypeScript):",
    "Battlecard {",
    "  competitorSlug: string;",
    "  competitorProductSlug: string;",
    "  competitorProductName: string;",
    "  ciscoRecommendation: { primarySlug: string; bundleSlugs: string[]; summary: string };",
    "  useCases: Array<'Substation Automation'|'Manufacturing / Factory'|'Transportation / Roadways'|'Mining / Heavy Industry'|'Oil & Gas / Utilities'|'Smart City'|'Military / Defense'>;",
    "  pillars: Array<{ title: string; icon: 'shield'|'eye'|'cpu'|'leaf'|'globe'|'lock'|'wrench'|'spark'|'wifi'|'layers'|'compass'|'clock'; body: string; proof?: string }>;",
    "  specs: Array<{ label: string; competitor: string; cisco: string; winner: 'cisco'|'competitor'|'tie' }>;",
    "  knownIssues: Array<{ id: string; severity: 'Critical'|'High'|'Medium'|'Low'; title: string; source: string; url?: string }>;",
    "  references: Array<{ industry: string; region: string; summary: string }>;",
    "  talkTrack: { opener: string; discovery: string[]; proofPoints: string[]; closer: string };",
    "  tcoNote?: string;",
    "  lastUpdatedISO: string;  // ISO 8601",
    "  sources: Array<{ label: string; url?: string; system: 'Circuit'|'Cisco Docs'|'CDETS'|'Webex'|'Public Web' }>;",
    "}",
    "",
    "Rules:",
    `- ciscoRecommendation.primarySlug MUST be one of: ${eligibleCiscoSlugs.join(", ")}.`,
    competitorCategory
      ? `- The competitor product is a ${competitorCategory.toUpperCase()}. The Cisco primary recommendation MUST match this category. Do NOT recommend a switch when the competitor product is a wireless AP, firewall, or management appliance.`
      : "- If the competitor product is a wireless AP, recommend an IW-series AP. If it is a firewall, recommend secure-firewall-3100. Never cross product categories.",
    `- bundleSlugs MUST be from this full catalog: ${CISCO_PRODUCT_SLUGS.join(", ")}.`,
    "- Produce 3 to 4 pillars, 5 to 7 spec rows, 1 to 3 knownIssues, 1 to 3 references.",
    "- For EVERY spec row, fill in BOTH `competitor` and `cisco` with concrete factual values (port counts, throughput numbers, supported protocols, certifications). Do NOT copy the competitor product name into the competitor column. If you do not know a real value, omit the row entirely \u2014 a missing row is better than a fabricated one.",
    "- talkTrack.discovery: 3 to 5 questions. talkTrack.proofPoints: 3 to 5 lines.",
    "- Be specific to Industrial IoT (manufacturing, utilities, transportation, mining, oil & gas, substation, smart city).",
    "- Always include at least one source under system='Circuit' with label 'Cisco Circuit AI (general)' so the UI can flag this card as model-synthesized.",
    "- DO NOT INVENT URLS. For sources, only include `url` if you are CERTAIN the URL exists and is current. When uncertain, omit the `url` field entirely \u2014 a label-only source is fine. Hallucinated 404 links are worse than no link.",
    "- Be honest: if the competitor wins a spec row, set winner='competitor'. Use 'tie' only when truly equivalent."
  ].join("\n");

  const userPrompt = JSON.stringify(
    {
      competitorSlug,
      productSlug,
      competitorProductName,
      competitorCategory,
      eligibleCiscoRecommendations: eligibleCiscoSlugs,
      // Drop empty grounding payloads so we don't waste prompt tokens on
      // empty arrays — the MCP stubs return [] today and Circuit doesn't need
      // to be told there's nothing.
      grounding: trimGrounding({ ciscoDocs: docs, ciscoDefects: defects, webexWinWires: webex, publicWeb }),
      todayISO: new Date().toISOString()
    },
    null,
    0
  );

  let completion;
  const synthStartedAt = Date.now();
  // eslint-disable-next-line no-console
  console.log(
    `[orchestrator] synthesizing battlecard ${competitorSlug}/${productSlug} via Circuit…`
  );
  try {
    completion = await circuitChat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      responseFormat: "json",
      temperature: 0.3,
      // 2200 is a sweet spot — enough for the full Battlecard schema with
      // 3-4 pillars, 5-7 specs, etc., but small enough that gpt-5-nano /
      // gpt-4o-mini can finish in 90-150s instead of timing out at 90s.
      // Bump back to 3000+ if a future Circuit model is meaningfully faster.
      maxTokens: 2200
    });
  } catch (err) {
    const elapsedMs = Date.now() - synthStartedAt;
    const msg = (err as Error).message;
    // eslint-disable-next-line no-console
    console.error(
      `[orchestrator] Circuit call failed for ${competitorSlug}/${productSlug} after ${elapsedMs}ms:`,
      msg
    );
    lastSynthesisError = {
      competitorSlug,
      productSlug,
      message: msg.includes("timed out") ? `Circuit timed out after ${Math.round(elapsedMs / 1000)}s` : msg,
      at: Date.now()
    };
    // Trip the cooldown so we don't re-wait the full timeout on the next visit.
    circuitCooldownUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    return null;
  }
  // eslint-disable-next-line no-console
  console.log(
    `[orchestrator] Circuit synthesized ${competitorSlug}/${productSlug} in ${Date.now() - synthStartedAt}ms`
  );

  let parsed: Partial<Battlecard>;
  try {
    parsed = JSON.parse(completion.content);
  } catch {
    console.error(
      "[orchestrator] Circuit returned invalid JSON. First 200 chars:",
      completion.content.slice(0, 200)
    );
    return null;
  }

  // Lightweight shape guard. Fill missing fields with safe defaults rather than throwing.
  // Also apply post-processing: category-match override for the Cisco recommendation,
  // junk-spec filtering, and URL sanitization on sources. See helpers at the bottom.
  const rawPrimarySlug = parsed.ciscoRecommendation?.primarySlug ?? "ir1101";
  const safePrimarySlug = enforceCategoryMatch(
    rawPrimarySlug,
    competitorCategory,
    eligibleCiscoSlugs
  );
  const rawBundleSlugs = parsed.ciscoRecommendation?.bundleSlugs ?? [];
  const safeBundleSlugs = sanitizeBundleSlugs(
    rawBundleSlugs,
    safePrimarySlug,
    competitorCategory
  );

  const cleanedSpecs = (parsed.specs ?? []).filter((row) =>
    isUsefulSpecRow(row, competitorProductName)
  );
  const cleanedSources = sanitizeSources(parsed.sources);

  const battlecard: Battlecard = {
    competitorSlug,
    competitorProductSlug: productSlug,
    competitorProductName: parsed.competitorProductName ?? competitorProductName,
    ciscoRecommendation: {
      primarySlug: safePrimarySlug,
      bundleSlugs: safeBundleSlugs,
      summary: parsed.ciscoRecommendation?.summary ?? ""
    },
    useCases: parsed.useCases ?? [],
    pillars: (parsed.pillars ?? []).slice(0, 6),
    specs: cleanedSpecs,
    knownIssues: parsed.knownIssues ?? [],
    references: parsed.references ?? [],
    talkTrack: {
      opener: parsed.talkTrack?.opener ?? "",
      discovery: parsed.talkTrack?.discovery ?? [],
      proofPoints: parsed.talkTrack?.proofPoints ?? [],
      closer: parsed.talkTrack?.closer ?? ""
    },
    tcoNote: parsed.tcoNote,
    lastUpdatedISO: parsed.lastUpdatedISO ?? new Date().toISOString(),
    sources:
      cleanedSources.length > 0
        ? cleanedSources
        : [{ label: "Cisco Circuit AI (general)", system: "Circuit" }],
    synthesized: true
  };

  const cacheNow = Date.now();
  battlecardCache.set(cacheKey, {
    value: battlecard,
    createdAt: cacheNow,
    expiresAt: cacheNow + BATTLECARD_CACHE_TTL_MS
  });
  saveBattlecardCacheToDisk();
  return battlecard;
}

// ---------- Post-processing helpers ----------

/**
 * Strip empty arrays from the grounding payload before serializing into the
 * user prompt. Saves ~80 tokens per call on empty MCP stub responses, which
 * adds up across the 30+ pages the prewarm script hits.
 */
function trimGrounding(g: Record<string, unknown[]>): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {};
  for (const [k, v] of Object.entries(g)) {
    if (Array.isArray(v) && v.length > 0) out[k] = v;
  }
  return out;
}

/**
 * Filter bundle slugs to ones that actually make sense alongside the primary.
 *   - Drop unknown slugs.
 *   - Drop the primary itself (a "primary + primary" bundle is meaningless).
 *   - For non-switch/router primaries (APs, firewalls, security, mgmt),
 *     drop any switch/router bundle suggestion — those are noise. Keep
 *     security/management products as valid cross-category bundles.
 *   - Cap at 4 bundle items to keep the hero badges readable.
 */
function sanitizeBundleSlugs(
  raw: string[],
  primarySlug: string,
  competitorCategory: ProductCategory | undefined
): string[] {
  const seen = new Set<string>([primarySlug]);
  const isNetworkInfra = (cat: ProductCategory) =>
    cat === "Industrial Switch" || cat === "Industrial Router";
  const primaryProduct = CISCO_IIOT[primarySlug];
  const primaryIsInfra = primaryProduct ? isNetworkInfra(primaryProduct.category) : false;
  const out: string[] = [];
  for (const s of raw) {
    if (seen.has(s)) continue;
    const p = CISCO_IIOT[s];
    if (!p) continue;
    // If the primary is NOT switch/router, don't pad the bundle with switches
    // or routers — they're not a real cross-sell for an AP / firewall deal.
    if (!primaryIsInfra && isNetworkInfra(p.category)) continue;
    // Same guard the other way: if the competitor is an AP, never bundle
    // switches/routers regardless of what the primary is.
    if (competitorCategory === "Industrial Wireless" && isNetworkInfra(p.category)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 4) break;
  }
  return out;
}

/**
 * Enforce that the Cisco primary recommendation has the SAME product category
 * as the competitor product. Circuit sometimes picks a Catalyst IE switch as
 * the answer to a Moxa wireless AP because switches dominate our catalog —
 * the result is a useless battlecard. If we can detect the category and the
 * AI picked outside it, override with the category-default Cisco SKU.
 */
function enforceCategoryMatch(
  rawPrimarySlug: string,
  competitorCategory: ProductCategory | undefined,
  eligibleSlugs: string[]
): string {
  const fallbackEligible = eligibleSlugs[0];
  // If the slug is unknown to our catalog, drop to a safe default.
  const known = CISCO_IIOT[rawPrimarySlug];
  if (!known) {
    if (competitorCategory) return defaultCiscoForCategory(competitorCategory).slug;
    return fallbackEligible ?? "ir1101";
  }
  if (!competitorCategory) return rawPrimarySlug;
  if (known.category === competitorCategory) return rawPrimarySlug;
  // Category mismatch — log + override with the category default so the page is useful.
  // eslint-disable-next-line no-console
  console.warn(
    `[orchestrator] category mismatch: Circuit picked ${rawPrimarySlug} (${known.category}) for a ${competitorCategory} competitor product. Overriding with default.`
  );
  return defaultCiscoForCategory(competitorCategory).slug;
}

/**
 * Filter out spec rows where Circuit obviously didn't have real data — most
 * commonly when the `competitor` cell is just the bare product name repeated
 * on every row. Keep rows that look like real specs (numbers, protocols, etc.).
 */
function isUsefulSpecRow(row: Battlecard["specs"][number], competitorProductName: string): boolean {
  const c = String(row?.competitor ?? "").trim();
  if (!c) return false;
  if (c.length < 5) return false;
  const norm = c.toLowerCase();
  const product = competitorProductName.toLowerCase();
  // Drop rows where the competitor cell is just the product name (no spec value).
  if (norm === product || product.includes(norm) || norm.includes(product)) return false;
  return true;
}

/**
 * Strip URLs from synthesized sources unless they look unambiguously safe.
 * Circuit happily fabricates `cisco.com/c/en/us/products/...` 404 URLs that
 * look authoritative — those are worse than no link at all. We allow ONLY
 * exact prefixes we trust from the grounding plumbing OR the Cisco Docs AI
 * canonical hosts. Everything else becomes a label-only source.
 */
function sanitizeSources(rawSources: Battlecard["sources"] | undefined): Battlecard["sources"] {
  if (!rawSources || rawSources.length === 0) return [];
  // Accept URLs from these known-good hosts. Anything else is treated as a
  // potential hallucination and gets dropped (the source label still renders,
  // just without a clickable link).
  const TRUSTED_HOSTS = [
    "docs-ai.cloudapps.cisco.com",
    "chat-ai.cisco.com",
    "salesconnect.seismic.com",
    "miercom.com"
  ];
  return rawSources.map((s) => {
    if (!s) return s;
    if (!s.url) return s;
    let host = "";
    try {
      host = new URL(s.url).hostname;
    } catch {
      return { ...s, url: undefined };
    }
    if (TRUSTED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      return s;
    }
    // Unknown host — strip the URL but keep the label so the seller at least
    // sees what Circuit thought was the source.
    return { ...s, url: undefined };
  });
}
