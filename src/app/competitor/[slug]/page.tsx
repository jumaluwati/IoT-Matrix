import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Factory } from "lucide-react";
import { COMPETITORS, getCompetitor } from "@/data/competitors";
import type { Competitor } from "@/lib/types";
import { ProductGlyph } from "@/components/product-glyph";
import { Badge } from "@/components/ui/badge";
import { DocsHighlights } from "@/components/docs-highlights";
import { LiveLoadingIndicator } from "@/components/live-loading-indicator";
import { CompetitorIntelRefresh } from "@/components/competitor-intel-refresh";
import { competitorIntelConfigured, fetchCompetitorIntel } from "@/lib/competitor-intel";
import { getBattlecard } from "@/data/battlecards";

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ slug: c.slug }));
}

export const revalidate = 0;

export default function CompetitorPage({ params }: { params: { slug: string } }) {
  const c = getCompetitor(params.slug);
  if (!c) notFound();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            background: `radial-gradient(60% 50% at 50% 0%, ${c.color}26 0%, transparent 70%)`
          }}
        />
        <div className="container pt-12 pb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All competitors
          </Link>
          <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <div
                className="text-[11px] font-mono tracking-[0.2em]"
                style={{ color: c.color }}
              >
                {c.logoMark}
              </div>
              <h1 className="mt-3 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
                {c.name}
              </h1>
              <p className="mt-4 text-base md:text-lg text-[rgb(var(--fg-muted))]">
                {c.tagline}
              </p>
            </div>
            <div className="glass rounded-2xl px-4 py-3 text-xs text-[rgb(var(--fg-muted))]">
              <div className="text-[10px] uppercase tracking-wider mb-1">Lineup</div>
              <div className="text-[rgb(var(--fg))] font-medium">
                {c.products.length} product{c.products.length === 1 ? "" : "s"} tracked
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="container pb-24">
        <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-2">
          02 · Pick the product the customer mentioned
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
          {c.name} IIoT lineup
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {c.products.map((p) => {
            const hasCard = !!getBattlecard(c.slug, p.slug);
            return (
              <Link
                key={p.slug}
                href={`/compare/${c.slug}/${p.slug}`}
                className="group rounded-3xl surface shadow-soft overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] transition-all duration-300"
              >
                <div className="aspect-[16/9] relative overflow-hidden">
                  <ProductGlyph category={p.category} brand={c.color} className="absolute inset-0" />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-[rgb(var(--fg-muted))]">
                        {p.family ?? p.category}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight">{p.name}</h3>
                    </div>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 group-hover:bg-cisco-500 group-hover:text-white transition-colors">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[rgb(var(--fg-muted))] line-clamp-2">{p.positioning}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge tone="neutral">
                      <Factory className="h-3 w-3 mr-1" /> {p.category}
                    </Badge>
                    {hasCard ? (
                      <Badge tone="win">Battlecard ready</Badge>
                    ) : (
                      <Badge tone="warn">Stub — will generate</Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* LIVE COMPETITIVE INTEL — streamed from Cisco RAG/Docs. Only rendered
          when a backend is configured, so there's no orphan section on a
          stock checkout. The header carries a manual "Refresh intel" action;
          the body streams in via Suspense and re-pulls on refresh. */}
      {competitorIntelConfigured() && (
        <section className="container pb-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-2">
                03 · Live intel
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                What&rsquo;s changing at {c.name}
              </h2>
              <p className="mt-2 text-sm text-[rgb(var(--fg-muted))] max-w-2xl">
                Latest models, security advisories, and how to position Cisco &mdash; pulled live from
                Cisco RAG/Docs and cached for 7 days.
              </p>
            </div>
            <CompetitorIntelRefresh competitorSlug={c.slug} />
          </div>
          <Suspense
            fallback={
              <LiveLoadingIndicator
                variant="docs"
                label={`latest ${c.name} intel`}
                estimate="typically 20-40s on first load · instant after cache lands"
              />
            }
          >
            <CompetitorIntelBody competitor={c} />
          </Suspense>
        </section>
      )}
    </>
  );
}

async function CompetitorIntelBody({ competitor }: { competitor: Competitor }) {
  const intel = await fetchCompetitorIntel(competitor);
  if (!intel) {
    return (
      <p className="text-sm text-[rgb(var(--fg-muted))]">
        No live intel available right now. Try{" "}
        <span className="font-medium text-[rgb(var(--fg))]">Refresh intel</span>, or check VPN
        connectivity to Cisco RAG/Docs.
      </p>
    );
  }
  return (
    <DocsHighlights
      productName={competitor.name}
      answer={intel.answer}
      sources={intel.sources}
      sourceLabel={`via ${intel.backendLabel} · ${competitor.name}`}
      maxCards={6}
    />
  );
}
