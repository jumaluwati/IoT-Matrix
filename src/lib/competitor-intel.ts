import type { Competitor } from "@/lib/types";
import { askCiscoRag, ciscoRagConfigured } from "@/lib/mcp/cisco-rag";
import { askCiscoDocs, ciscoDocsConfigured } from "@/lib/mcp/cisco-docs";

/**
 * Live competitor intelligence.
 *
 * Pulls a fresh briefing on a competitor's industrial portfolio — recent
 * models, security advisories, and Cisco positioning — from the same Cisco
 * RAG / Docs AI endpoints the rest of the app uses (over VPN). Answers are
 * cached on disk for 7 days by the underlying client; pass `forceRefresh` to
 * bypass the cache and re-pull (used by the "Refresh intel" action).
 *
 * Cisco RAG is preferred when configured because its curated indexes include
 * compete content; Cisco Docs AI is the fallback. Returns null when neither is
 * configured or the upstream call fails, so the page renders no orphan section.
 */
export interface CompetitorIntel {
  answer: string;
  sources: string[];
  backendLabel: string;
}

export function competitorIntelConfigured(): boolean {
  return ciscoRagConfigured() || ciscoDocsConfigured();
}

function buildQuery(competitor: Competitor): string {
  const productList = competitor.products.map((p) => p.name).join(", ");
  return [
    `Provide a concise competitive-intelligence briefing on ${competitor.name}'s industrial networking and IIoT portfolio for a Cisco sales engineer.`,
    "Cover three things:",
    `(1) current and recently announced ${competitor.name} product models relevant to industrial Ethernet switching, routing, or wireless;`,
    "(2) notable security advisories, CVEs, or PSIRT issues from roughly the last 18 months;",
    `(3) how Cisco should position its Industrial IoT portfolio against ${competitor.name}.`,
    `Known ${competitor.name} products of interest: ${productList}.`,
    "List the most important points one per bullet, each with a short bold title and a 1-2 sentence explanation."
  ].join(" ");
}

export async function fetchCompetitorIntel(
  competitor: Competitor,
  opts: { forceRefresh?: boolean } = {}
): Promise<CompetitorIntel | null> {
  const useRag = ciscoRagConfigured();
  const useDocs = !useRag && ciscoDocsConfigured();
  if (!useRag && !useDocs) return null;

  const query = buildQuery(competitor);
  try {
    if (useRag) {
      const r = await askCiscoRag(query, { timeoutMs: 25_000, forceRefresh: opts.forceRefresh });
      if (!r.answer) return null;
      return { answer: r.answer, sources: r.sources, backendLabel: "Cisco RAG" };
    }
    const r = await askCiscoDocs(query, { timeoutMs: 20_000, forceRefresh: opts.forceRefresh });
    if (!r.answer) return null;
    return { answer: r.answer, sources: r.sources, backendLabel: "Cisco Docs" };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[competitor-intel] fetch failed for ${competitor.slug}:`, (err as Error).message);
    return null;
  }
}
