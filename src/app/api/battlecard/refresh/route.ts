import { NextResponse } from "next/server";
import { kickoffBackgroundSynthesis, isSynthesisInFlight } from "@/lib/orchestrator";
import { circuitConfigured } from "@/lib/mcp/circuit";

/**
 * POST /api/battlecard/refresh
 * Body: { competitor: string, product: string }
 *
 * Kicks off a background Circuit synthesis if one isn't already running.
 * Returns 202 immediately — the actual Circuit call runs in the background.
 * The page reload is driven by client-side polling of /api/battlecard/status.
 *
 * Returns 503 if Circuit isn't configured (so the UI can show an honest
 * "wire up Circuit" message instead of pretending to refresh).
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { competitor?: string; product?: string };
  try {
    body = (await req.json()) as { competitor?: string; product?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { competitor, product } = body;
  if (!competitor || !product) {
    return NextResponse.json({ error: "competitor and product are required" }, { status: 400 });
  }
  if (!circuitConfigured()) {
    return NextResponse.json(
      { error: "Cisco Circuit is not configured. Set CIRCUIT_* env vars in .env.local." },
      { status: 503 }
    );
  }
  if (isSynthesisInFlight(competitor, product)) {
    return NextResponse.json({ status: "already-in-flight" }, { status: 202 });
  }
  kickoffBackgroundSynthesis(competitor, product);
  return NextResponse.json({ status: "kicked-off" }, { status: 202 });
}
