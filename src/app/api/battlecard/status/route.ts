import { NextResponse } from "next/server";
import {
  kickoffBackgroundSynthesis,
  isSynthesisInFlight,
  cachedBattlecardAgeMs,
  circuitCooldownActive,
  lastCircuitError
} from "@/lib/orchestrator";
import { circuitConfigured } from "@/lib/mcp/circuit";

/**
 * Background-synthesis kickoff + status endpoint.
 *
 * GET  /api/battlecard/status?competitor=X&product=Y
 *   Returns { inFlight, ageMs, cooldownActive, lastError }. Used by the
 *   client-side BattlecardSynthesisWatcher to know when to reload the page.
 *
 * POST /api/battlecard/refresh
 *   Body: { competitor, product, force? }
 *   Kicks off a background synthesis if there's no in-flight one. Always
 *   returns 202 immediately — the actual Circuit call runs in the background.
 *   The page reload happens client-side once status polling sees the card.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const competitor = searchParams.get("competitor");
  const product = searchParams.get("product");
  if (!competitor || !product) {
    return NextResponse.json({ error: "competitor and product query params are required" }, { status: 400 });
  }
  return NextResponse.json({
    competitor,
    product,
    circuitConfigured: circuitConfigured(),
    inFlight: isSynthesisInFlight(competitor, product),
    ageMs: cachedBattlecardAgeMs(competitor, product),
    cooldownActive: circuitCooldownActive(),
    lastError: lastCircuitError()
  });
}
