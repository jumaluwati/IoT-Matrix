#!/usr/bin/env node
/**
 * Cache pre-warmer.
 *
 * Loops over every competitor:product pair (and every Cisco SKU for portfolio
 * licensing) and hits the local Next.js dev server. Each visit causes the
 * server to call Cisco Circuit (battlecard synthesis), Cisco Docs AI (live
 * highlights + competitor gaps), and Cisco RAG (license tiers) — populating
 * `.cache/battlecards.json`, `.cache/cisco-docs.json`, `.cache/cisco-rag.json`
 * along the way. Each entry has a 1h TTL.
 *
 * The cache files are gitignored and survive dev-server restarts. Once warm,
 * subsequent page loads are sub-second.
 *
 * Usage:
 *   npm run dev           # in one terminal
 *   npm run prewarm       # in another
 *
 *   # Limit which competitors to warm (comma-separated slugs):
 *   PREWARM_ONLY=schneier,rockwell npm run prewarm
 *
 *   # Skip portfolio pages (only do compare pages):
 *   PREWARM_PORTFOLIO=false npm run prewarm
 *
 *   # Point at a different host:
 *   PREWARM_BASE=http://localhost:3001 npm run prewarm
 *
 * Each request is sequential (one at a time) so we don't overwhelm Circuit's
 * rate limits or trigger concurrent OAuth token requests.
 *
 * Requires the Cisco VPN to be connected — without it Circuit/Docs/RAG all
 * fail and the cache stays empty (every page still HTTP 200s, just slower).
 */

const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.PREWARM_BASE || "http://localhost:3000";
const ONLY = (process.env.PREWARM_ONLY || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const DO_PORTFOLIO = (process.env.PREWARM_PORTFOLIO ?? "true").toLowerCase() !== "false";
const REQ_TIMEOUT_MS = Number(process.env.PREWARM_TIMEOUT_MS) || 180_000; // 3 min/page

function pad(s, n) {
  return String(s).padEnd(n, " ");
}

function fmtTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

async function fetchWithTimeout(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    // Drain the body so the server actually finishes rendering before we move on.
    await res.text();
    return { ok: res.ok, status: res.status, elapsedMs: Date.now() - startedAt };
  } catch (err) {
    return { ok: false, status: 0, elapsedMs: Date.now() - startedAt, error: (err && err.message) || String(err) };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Lightweight TypeScript file parser for the catalog data — we read the source
 * files directly so the script doesn't have to compile TS to find product slugs.
 * Looks for `slug: "..."` lines inside `src/data/competitors.ts` and
 * `src/data/cisco-iiot.ts`. Crude but stable; no runtime dep on Next or the build.
 */
function parseSlugsFromTs(filePath, blockRe, slugRe = /slug:\s*"([^"]+)"/g) {
  const raw = fs.readFileSync(filePath, "utf8");
  const out = [];
  for (const block of raw.matchAll(blockRe)) {
    const blockText = block[0];
    const slug = block[1] || (slugRe.exec(blockText) || [])[1];
    if (slug) out.push({ slug, block: blockText });
  }
  return out;
}

function loadCompetitorPairs() {
  const file = path.join(process.cwd(), "src/data/competitors.ts");
  const raw = fs.readFileSync(file, "utf8");
  // Match each top-level competitor `{ slug: "...", ..., products: [...] }`
  // entry. We don't fully parse TS — we just walk by `slug:` markers and
  // collect each competitor's nested products.
  const pairs = [];
  const competitorRe = /\{\s*slug:\s*"([^"]+)"[\s\S]*?products:\s*\[([\s\S]*?)\n\s{4}\]/g;
  let m;
  while ((m = competitorRe.exec(raw)) !== null) {
    const competitorSlug = m[1];
    const productsBlock = m[2];
    const productSlugRe = /slug:\s*"([^"]+)"/g;
    let pm;
    while ((pm = productSlugRe.exec(productsBlock)) !== null) {
      pairs.push({ competitor: competitorSlug, product: pm[1] });
    }
  }
  return pairs;
}

function loadCiscoSlugs() {
  const file = path.join(process.cwd(), "src/data/cisco-iiot.ts");
  const raw = fs.readFileSync(file, "utf8");
  const out = [];
  // Top-level catalog keys: `"slug-name": { slug: "slug-name", ... }`
  const re = /"([a-z0-9-]+)":\s*\{\s*slug:\s*"\1"/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    out.push(m[1]);
  }
  return out;
}

async function main() {
  console.log(`[prewarm] base=${BASE}`);
  console.log(`[prewarm] cwd=${process.cwd()}`);

  // Quick liveness check so we fail fast if the dev server isn't running.
  const ping = await fetchWithTimeout(`${BASE}/`, 10_000);
  if (!ping.ok) {
    console.error(`[prewarm] ${BASE}/ returned ${ping.status} (${ping.error ?? "timeout"}). Start the dev server first: npm run dev`);
    process.exit(1);
  }
  console.log(`[prewarm] dev server up (${fmtTime(ping.elapsedMs)})`);

  const allPairs = loadCompetitorPairs();
  const pairs = ONLY.length > 0
    ? allPairs.filter((p) => ONLY.includes(p.competitor.toLowerCase()))
    : allPairs;
  const ciscoSlugs = DO_PORTFOLIO ? loadCiscoSlugs() : [];

  console.log(`[prewarm] ${pairs.length} compare pages + ${ciscoSlugs.length} portfolio pages = ${pairs.length + ciscoSlugs.length} total`);
  if (ONLY.length > 0) console.log(`[prewarm] filtered to: ${ONLY.join(", ")}`);

  const startedAt = Date.now();
  let ok = 0;
  let failed = 0;
  let slowest = { url: "", elapsedMs: 0 };

  // Compare pages first — those drive Circuit (~80s cold) + Docs + RAG.
  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    // Pass ?sync=1 so the page waits for Circuit synthesis to complete before
    // returning. Without this the page is now non-blocking by default and
    // kicks off synthesis in the background — perfect for users, useless for
    // prewarming because the curl would return before the cache lands.
    const url = `${BASE}/compare/${p.competitor}/${p.product}?sync=1`;
    process.stdout.write(`[${pad(i + 1, 3)}/${pairs.length + ciscoSlugs.length}] ${pad(`${p.competitor}/${p.product}`, 45)} `);
    const r = await fetchWithTimeout(url, REQ_TIMEOUT_MS);
    const tag = r.ok ? "ok " : "FAIL";
    process.stdout.write(`${tag} ${pad(r.status, 4)} ${fmtTime(r.elapsedMs)}\n`);
    if (r.ok) ok++; else failed++;
    if (r.elapsedMs > slowest.elapsedMs) slowest = { url: `${p.competitor}/${p.product}`, elapsedMs: r.elapsedMs };
    if (r.error) console.log(`      error: ${r.error}`);
  }

  // Portfolio pages — each triggers a RAG license-tier fetch for one Cisco SKU.
  for (let i = 0; i < ciscoSlugs.length; i++) {
    const slug = ciscoSlugs[i];
    const url = `${BASE}/portfolio/${slug}`;
    process.stdout.write(`[${pad(pairs.length + i + 1, 3)}/${pairs.length + ciscoSlugs.length}] ${pad(`portfolio/${slug}`, 45)} `);
    const r = await fetchWithTimeout(url, REQ_TIMEOUT_MS);
    const tag = r.ok ? "ok " : "FAIL";
    process.stdout.write(`${tag} ${pad(r.status, 4)} ${fmtTime(r.elapsedMs)}\n`);
    if (r.ok) ok++; else failed++;
    if (r.elapsedMs > slowest.elapsedMs) slowest = { url: `portfolio/${slug}`, elapsedMs: r.elapsedMs };
    if (r.error) console.log(`      error: ${r.error}`);
  }

  const totalMs = Date.now() - startedAt;
  console.log("---");
  console.log(`[prewarm] done in ${fmtTime(totalMs)} (${ok} ok, ${failed} failed)`);
  console.log(`[prewarm] slowest: ${slowest.url} (${fmtTime(slowest.elapsedMs)})`);

  // Report cache sizes so the operator can confirm entries landed.
  const reportCache = (rel) => {
    const f = path.join(process.cwd(), rel);
    if (!fs.existsSync(f)) {
      console.log(`[prewarm] ${rel}: missing`);
      return;
    }
    const stat = fs.statSync(f);
    let count = 0;
    try {
      const parsed = JSON.parse(fs.readFileSync(f, "utf8"));
      count = Object.keys(parsed || {}).length;
    } catch {
      /* ignore */
    }
    console.log(`[prewarm] ${rel}: ${count} entries, ${stat.size} bytes`);
  };
  reportCache(".cache/battlecards.json");
  reportCache(".cache/cisco-docs.json");
  reportCache(".cache/cisco-rag.json");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[prewarm] fatal:", err);
  process.exit(2);
});
