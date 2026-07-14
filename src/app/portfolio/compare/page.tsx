import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ChevronRight, Compass, Sparkles } from "lucide-react";
import { CISCO_LIST, getCisco } from "@/data/cisco-iiot";
import { askCiscoRag, ciscoRagConfigured } from "@/lib/mcp/cisco-rag";
import { ComparePicker } from "@/components/compare-picker";
import { SkuVariantsTable } from "@/components/sku-variants-table";
import { LiveLoadingIndicator } from "@/components/live-loading-indicator";
import { ProductGlyph } from "@/components/product-glyph";
import { Badge } from "@/components/ui/badge";

export const dynamicParams = true;
export const revalidate = 0;

/**
 * `/portfolio/compare?a=ie3400&b=ie3500`
 *
 * Cisco-vs-Cisco compare route. Renders a two-product picker; when both
 * slots are filled, a Cisco RAG-driven side-by-side summary streams in
 * (same Suspense + 7-day disk cache pattern as the licensing + hardware
 * sections). Designed for sellers asking "OK, which of these two Cisco
 * SKUs should I quote?" instead of comparing Cisco vs a competitor.
 *
 * URL is the source of truth — bookmarkable, shareable in Slack/Webex.
 */
export default function CiscoCompareIndex({
  searchParams
}: {
  searchParams?: { a?: string; b?: string };
}) {
  const slugA = searchParams?.a?.trim() || "";
  const slugB = searchParams?.b?.trim() || "";
  const productA = slugA ? getCisco(slugA) : undefined;
  const productB = slugB ? getCisco(slugB) : undefined;
  const ready = Boolean(productA && productB && productA.slug !== productB.slug);
  const catalog = CISCO_LIST.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    family: p.family
  }));

  return (
    <>
      {/* BREADCRUMBS */}
      <div className="container pt-10">
        <nav className="flex items-center gap-1.5 text-xs text-[rgb(var(--fg-muted))]">
          <Link href="/" className="hover:text-[rgb(var(--fg))]">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/portfolio" className="hover:text-[rgb(var(--fg))]">
            Cisco portfolio
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[rgb(var(--fg))]">Compare</span>
        </nav>
      </div>

      {/* HEADER */}
      <section className="container pt-6 pb-6">
        <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-2">
          Cisco vs Cisco
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Pick two products to compare
        </h1>
        <p className="mt-2 text-sm text-[rgb(var(--fg-muted))] max-w-2xl">
          Settle internal SKU debates fast. The summary streams from Cisco RAG and is
          cached for 7 days. Bookmarkable URL.
        </p>
      </section>

      {/* PICKER */}
      <section className="container pb-6">
        <ComparePicker catalog={catalog} initialA={slugA} initialB={slugB} />
      </section>

      {/* RESULT */}
      {ready && productA && productB ? (
        <>
          {/* HERO */}
          <section className="container pb-6">
            <div className="rounded-2xl surface overflow-hidden shadow-soft ring-1 ring-[rgb(var(--border))]">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <ProductHeroCard product={productA} />
                <div className="md:border-l border-[rgb(var(--border))]">
                  <ProductHeroCard product={productB} />
                </div>
              </div>
            </div>
          </section>

          {/* WHEN TO LEAD WITH EACH — instant, deterministic guidance from the
              catalog. Always shown (no RAG dependency); the deeper RAG summary
              streams in below. */}
          <WhenToLeadSection productA={productA} productB={productB} />

          {/* SIDE-BY-SIDE SUMMARY (RAG) */}
          {ciscoRagConfigured() && (
            <Suspense fallback={<CompareFallback aName={productA.name} bName={productB.name} />}>
              <CompareSummarySection productA={productA} productB={productB} />
            </Suspense>
          )}
        </>
      ) : (
        <section className="container pb-24">
          <div className="rounded-3xl surface shadow-soft p-6 md:p-10 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-cisco-500/10 ring-1 ring-cisco-500/30 text-cisco-600 dark:text-cisco-300 mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight">
              {slugA && !productA
                ? `Unknown product "${slugA}"`
                : slugB && !productB
                  ? `Unknown product "${slugB}"`
                  : slugA && slugB && slugA === slugB
                    ? "Pick two different products"
                    : "Pick a product on each side to start the comparison"}
            </h2>
            <p className="mt-2 text-[13px] text-[rgb(var(--fg-muted))] max-w-md mx-auto">
              Use the dropdowns above. Selections sync to the URL so you can share the
              comparison with a teammate.
            </p>
          </div>
        </section>
      )}

      {/* BACK CTA */}
      <div className="container pb-16">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portfolio
        </Link>
      </div>
    </>
  );
}

function ProductHeroCard({ product }: { product: ReturnType<typeof getCisco> & {} }) {
  return (
    <div className="p-6 md:p-7 flex flex-col gap-4">
      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 mb-1">
          {product.family}
        </div>
        <Link
          href={`/portfolio/${product.slug}`}
          className="text-xl md:text-2xl font-semibold tracking-tight hover:text-cisco-600 dark:hover:text-cisco-300 transition-colors"
        >
          {product.name}
        </Link>
        <p className="mt-1.5 text-[13px] text-[rgb(var(--fg-muted))] leading-relaxed">
          {product.oneLiner}
        </p>
      </div>
      <div className="aspect-[16/9] rounded-xl overflow-hidden ring-1 ring-[rgb(var(--border))]">
        <ProductGlyph category={product.category} brand="#049fd9" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="cisco">{product.category}</Badge>
      </div>
    </div>
  );
}

/**
 * Brief, instant "which one when" guidance pulled straight from the catalog's
 * curated `whenToLead` positioning — no RAG, no latency. Renders two compact
 * cards side-by-side. Falls back gracefully if a SKU has no positioning line.
 */
function WhenToLeadSection({
  productA,
  productB
}: {
  productA: ReturnType<typeof getCisco> & {};
  productB: ReturnType<typeof getCisco> & {};
}) {
  const reasonA = productA.whenToLead ?? `Lead with ${productA.name} for ${productA.category.toLowerCase()} deployments that fit its strengths.`;
  const reasonB = productB.whenToLead ?? `Lead with ${productB.name} for ${productB.category.toLowerCase()} deployments that fit its strengths.`;
  return (
    <section className="container pb-6">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-3">
        <Compass className="h-3 w-3" />
        Which one, when
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <LeadCard name={productA.name} category={productA.category} reason={reasonA} />
        <LeadCard name={productB.name} category={productB.category} reason={reasonB} />
      </div>
    </section>
  );
}

function LeadCard({ name, category, reason }: { name: string; category: string; reason: string }) {
  return (
    <div className="rounded-2xl surface shadow-soft ring-1 ring-[rgb(var(--border))] p-5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--fg-muted))] font-mono mb-1">
        Lead with
      </div>
      <div className="text-base font-semibold tracking-tight">{name}</div>
      <p className="mt-2 text-[13px] text-[rgb(var(--fg-muted))] leading-relaxed">{reason}</p>
    </div>
  );
}

/**
 * Async server component — asks Cisco RAG to compare two products and
 * renders the response. Uses our existing SkuVariantsTable to render any
 * markdown tables RAG returns. Returns null on RAG failure to keep the
 * page clean.
 */
async function CompareSummarySection({
  productA,
  productB
}: {
  productA: ReturnType<typeof getCisco> & {};
  productB: ReturnType<typeof getCisco> & {};
}) {
  if (!ciscoRagConfigured()) return null;
  const query = `Compare Cisco ${productA.name} and Cisco ${productB.name} side by side for an industrial IoT seller. Output ONLY two things: (1) a single markdown table comparing the two products row-by-row on the dimensions that matter most for the purchase decision (form factor, port density, PoE budget, redundancy, industrial certifications, software stack, target deployments, end-of-sale or product status), with one column per product; (2) below the table, a short 'Lead with ${productA.name} when...' / 'Lead with ${productB.name} when...' decision guide as two short paragraphs. No other prose, no introduction.`;
  let answer = "";
  let sources: string[] = [];
  try {
    const res = await askCiscoRag(query, { timeoutMs: 60_000 });
    answer = res.answer;
    sources = res.sources;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[compare-cisco] RAG fetch failed for ${productA.slug} vs ${productB.slug}:`, (err as Error).message);
    return null;
  }
  if (!answer) return null;
  return (
    <section className="container pb-16 space-y-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono">
        <Sparkles className="h-3 w-3" />
        Side-by-side summary
      </div>
      <SkuVariantsTable
        productName={`${productA.name} vs ${productB.name}`}
        answer={answer}
        sources={sources}
      />
    </section>
  );
}

function CompareFallback({ aName, bName }: { aName: string; bName: string }) {
  return (
    <section className="container pb-16">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-3">
        <Sparkles className="h-3 w-3" />
        Side-by-side summary
      </div>
      <LiveLoadingIndicator
        variant="licensing"
        label={`${aName} vs ${bName} summary from Cisco RAG`}
        estimate="Cisco RAG answers take 20-60s the first time. Cached for 7 days after."
      />
    </section>
  );
}
