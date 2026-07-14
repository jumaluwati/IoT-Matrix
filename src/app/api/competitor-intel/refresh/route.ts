import { NextResponse } from "next/server";
import { getCompetitor } from "@/data/competitors";
import { competitorIntelConfigured, fetchCompetitorIntel } from "@/lib/competitor-intel";

/**
 * POST /api/competitor-intel/refresh
 * Body: { competitor: string }
 *
 * Re-pulls the competitor intel briefing from Cisco RAG/Docs with the cache
 * bypassed, repopulating the on-disk cache. The client then calls
 * router.refresh() so the streamed section re-renders with the fresh answer.
 *
 * Returns 503 when neither RAG nor Docs is configured so the UI can show an
 * honest "not configured" message instead of pretending to refresh.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { competitor?: string };
  try {
    body = (await req.json()) as { competitor?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const slug = body.competitor?.trim();
  if (!slug) {
    return NextResponse.json({ error: "competitor is required" }, { status: 400 });
  }
  const competitor = getCompetitor(slug);
  if (!competitor) {
    return NextResponse.json({ error: "Unknown competitor" }, { status: 404 });
  }
  if (!competitorIntelConfigured()) {
    return NextResponse.json(
      { error: "Cisco RAG / Docs is not configured. Set the CISCO_RAG_* or CISCO_DOCS_* env vars." },
      { status: 503 }
    );
  }
  const intel = await fetchCompetitorIntel(competitor, { forceRefresh: true });
  if (!intel) {
    return NextResponse.json({ status: "no-content" }, { status: 200 });
  }
  return NextResponse.json({ status: "refreshed" }, { status: 200 });
}
