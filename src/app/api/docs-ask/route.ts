import { NextResponse } from "next/server";
import { askCiscoDocs, ciscoDocsConfigured } from "@/lib/mcp/cisco-docs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/docs-ask
 *
 * Body: { question: string, product?: string }
 * Server-side proxy so the X-API-Key never reaches the browser.
 */
export async function POST(req: Request) {
  if (!ciscoDocsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Cisco Docs is not configured. Set CISCO_DOCS_API_URL and CISCO_DOCS_API_KEY in .env.local."
      },
      { status: 503 }
    );
  }

  let body: { question?: unknown; product?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "Field 'question' is required." }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json(
      { error: "Question is too long (max 500 chars)." },
      { status: 400 }
    );
  }
  const product = typeof body.product === "string" ? body.product : undefined;

  try {
    const answer = await askCiscoDocs(question, { product });
    return NextResponse.json(answer, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Cisco Docs error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
