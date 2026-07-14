import { NextResponse } from "next/server";
import { generateBattlecard } from "@/lib/orchestrator";

export const runtime = "nodejs";

/**
 * GET /api/battlecard?competitor=fortinet&product=fortigate-rugged-60f
 *
 * Returns a Battlecard JSON. In mock mode this serves from `data/battlecards.ts`.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const competitor = url.searchParams.get("competitor");
  const product = url.searchParams.get("product");
  if (!competitor || !product) {
    return NextResponse.json(
      { error: "Missing required query params: competitor, product" },
      { status: 400 }
    );
  }
  try {
    const card = await generateBattlecard(competitor, product);
    if (!card) {
      return NextResponse.json(
        { error: `No battlecard available for ${competitor}/${product}` },
        { status: 404 }
      );
    }
    // Authored mocks cache for a minute; live-synthesized cards must not cache
    // so the sales person can re-roll a fresh take per call.
    const cacheControl = card.synthesized
      ? "no-store"
      : "public, max-age=60, stale-while-revalidate=600";
    return NextResponse.json(card, { headers: { "Cache-Control": cacheControl } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown orchestrator error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
