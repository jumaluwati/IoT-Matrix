import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Hash,
  Network as NetworkIcon,
  Sparkles
} from "lucide-react";
import { CISCO_LIST, getCisco } from "@/data/cisco-iiot";
import { COMPETITORS } from "@/data/competitors";
import { BATTLECARDS } from "@/data/battlecards";
import { licensingModelFor, supportsLicenseTiers } from "@/data/licensing-models";
import { useCaseSlug } from "@/data/use-cases";
import { askCiscoRag, ciscoRagConfigured } from "@/lib/mcp/cisco-rag";
import { listSynthesizedBattlecards } from "@/lib/orchestrator";
import { ProductGlyph } from "@/components/product-glyph";
import { LicenseTiers } from "@/components/license-tiers";
import { LicensingModelCard } from "@/components/licensing-model-card";
import { LiveLoadingIndicator } from "@/components/live-loading-indicator";
import { SkuVariantsTable } from "@/components/sku-variants-table";
import { CompareThisCta } from "@/components/compare-picker";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return CISCO_LIST.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = true;
export const revalidate = 0;

interface AuthoredLink {
  competitorName: string;
  competitorSlug: string;
  competitorProductName: string;
  competitorProductSlug: string;
  isPrimary: boolean;
  /** "Hand-authored" for entries from src/data/battlecards.ts, "Synthesized" for Circuit-cached. */
  origin: "authored" | "synthesized";
}

/**
 * Detail page for a single Cisco IIoT SKU.
 *
 * - Hero with glyph + family + category + oneLiner
 * - Highlights from the curated catalog
 * - "Where you lead with this product" — every authored battlecard that
 *   recommends this SKU as the primary or part of the bundle
 * - License tiers (RAG-driven, server-fetched, Suspense-streamed)
 * - Quick links: open Compete grid, jump to portfolio
 */
export default function PortfolioDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const product = getCisco(params.slug);
  if (!product) notFound();

  // Cross-reference battlecards so the page tells the seller WHEN to lead
  // with this SKU. We check BOTH hand-authored (`src/data/battlecards.ts`)
  // AND Circuit-synthesized cards from the disk cache, so SKUs that only
  // appear as Circuit picks (e.g. IE3500 recommended for Schneider TCSESB
  // even though no authored card recommends IE3500 directly) still show up.
  // Primary recommendations show first; bundle-only mentions follow.
  const authoredLinks: AuthoredLink[] = [];
  const seen = new Set<string>();
  const pushLink = (
    competitorSlug: string,
    competitorProductSlug: string,
    competitorProductName: string,
    isPrimary: boolean,
    origin: "authored" | "synthesized"
  ) => {
    const key = `${competitorSlug}/${competitorProductSlug}`;
    if (seen.has(key)) return;
    const competitor = COMPETITORS.find((c) => c.slug === competitorSlug);
    if (!competitor) return;
    seen.add(key);
    authoredLinks.push({
      competitorName: competitor.name,
      competitorSlug,
      competitorProductName,
      competitorProductSlug,
      isPrimary,
      origin
    });
  };

  for (const card of Object.values(BATTLECARDS)) {
    const isPrimary = card.ciscoRecommendation.primarySlug === product.slug;
    const inBundle = card.ciscoRecommendation.bundleSlugs?.includes(product.slug);
    if (!isPrimary && !inBundle) continue;
    pushLink(card.competitorSlug, card.competitorProductSlug, card.competitorProductName, isPrimary, "authored");
  }

  for (const entry of listSynthesizedBattlecards()) {
    const isPrimary = entry.card.ciscoRecommendation.primarySlug === product.slug;
    const inBundle = entry.card.ciscoRecommendation.bundleSlugs?.includes(product.slug);
    if (!isPrimary && !inBundle) continue;
    pushLink(entry.competitorSlug, entry.productSlug, entry.card.competitorProductName, isPrimary, "synthesized");
  }
  authoredLinks.sort((a, b) =>
    a.isPrimary === b.isPrimary ? a.competitorProductName.localeCompare(b.competitorProductName) : a.isPrimary ? -1 : 1
  );

  // Pull a couple of sibling SKUs from the same family for cross-navigation.
  const siblings = CISCO_LIST.filter(
    (p) => p.family === product.family && p.slug !== product.slug
  ).slice(0, 4);

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
          <span className="text-[rgb(var(--fg))]">{product.name}</span>
        </nav>
      </div>

      {/* HERO */}
      <section className="container pt-6 pb-10">
        <div className="rounded-[2.25rem] surface overflow-hidden shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
            <div className="p-8 md:p-10 bg-gradient-to-br from-cisco-500/10 via-transparent to-indigo-500/10 flex flex-col">
              <div className="text-[11px] font-mono tracking-[0.2em] text-cisco-600 dark:text-cisco-300 mb-2">
                CISCO · {product.category.toUpperCase()}
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                {product.name}
              </h1>
              <p className="mt-3 text-base text-[rgb(var(--fg-muted))] max-w-xl">
                {product.oneLiner}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone="cisco">{product.family}</Badge>
                <Badge tone="neutral">{product.category}</Badge>
                <CompareThisCta slug={product.slug} />
              </div>
              {product.useCases && product.useCases.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-[rgb(var(--fg-muted))] font-mono mb-2">
                    Best for
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.useCases.map((u) => (
                      <Link
                        key={u}
                        href={`/use-cases/${useCaseSlug(u)}`}
                        className="inline-flex items-center gap-1 rounded-full bg-cisco-500/10 ring-1 ring-cisco-500/30 px-2.5 py-1 text-[11px] font-medium text-cisco-700 dark:text-cisco-300 hover:bg-cisco-500/20 hover:ring-cisco-500/60 transition-colors"
                      >
                        <Hash className="h-3 w-3 opacity-70" />
                        {u}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <ul className="mt-6 space-y-2">
                {product.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <Sparkles className="h-3.5 w-3.5 mt-1 text-cisco-600 dark:text-cisco-300 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative p-8 md:p-10 flex items-center justify-center bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
              <div className="w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-cisco-500/30 shadow-glow">
                <ProductGlyph category={product.category} brand="#049fd9" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHERE YOU LEAD WITH THIS — the heading depends on the product
          category. Network devices (switches, routers, APs, firewalls) are
          legit primary recommendations against competitor products. Overlay
          products (Catalyst Center, IoT Ops Dashboard, Cyber Vision) are
          NOT — DNA Center is a management plane, not a competitor to a
          Phoenix Contact switch. For those we reframe as "Pairs with these
          compete scenarios" and only list bundle-only mentions.
          We also filter out "Primary" entries entirely for overlay products,
          since Circuit sometimes hallucinates them as the primary answer. */}
      {(() => {
        const isOverlay =
          product.category === "Management / Orchestration" ||
          product.category === "OT Security / Visibility";
        const visibleLinks = isOverlay
          ? authoredLinks.filter((l) => !l.isPrimary)
          : authoredLinks;
        if (visibleLinks.length === 0) return null;
        return (
          <section className="container pb-12">
            <SectionHeader
              eyebrow={isOverlay ? "Pairs with" : "When to lead with this"}
              title={
                isOverlay
                  ? `${product.name} ships as part of these compete bundles`
                  : `${product.name} is the recommended Cisco answer for these competitor products`
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleLinks.map((l) => (
                <Link
                  key={`${l.competitorSlug}-${l.competitorProductSlug}`}
                  /* Pass ?cisco=<this product slug> so the compare page honors
                   * the seller's intent (they navigated FROM the IE3500 portfolio
                   * page, so they want IE3500 as the Cisco recommendation —
                   * not whatever the authored card or a stale Circuit synthesis
                   * picked). The compare page's smart-override logic will show
                   * the authored card's recommendation as an escape hatch. */
                  href={`/compare/${l.competitorSlug}/${l.competitorProductSlug}?cisco=${product.slug}`}
                  className="group rounded-2xl surface shadow-soft ring-1 ring-[rgb(var(--border))] hover:ring-cisco-500/40 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10.5px] font-mono uppercase tracking-wider text-[rgb(var(--fg-muted))]">
                        vs {l.competitorName}
                      </div>
                      <div className="mt-1 text-sm font-semibold tracking-tight group-hover:text-cisco-600 dark:group-hover:text-cisco-300 transition-colors">
                        {l.competitorProductName}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[rgb(var(--fg-muted))] group-hover:text-cisco-600 dark:group-hover:text-cisco-300 transition-colors shrink-0 mt-0.5" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono tracking-wider bg-cisco-500/10 ring-1 ring-cisco-500/30 text-cisco-700 dark:text-cisco-300">
                      {l.isPrimary ? "Primary recommendation" : isOverlay ? "Included in bundle" : "Part of the bundle"}
                    </span>
                    {l.origin === "synthesized" && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono tracking-wider bg-purple-500/10 ring-1 ring-purple-500/30 text-purple-700 dark:text-purple-300">
                        Circuit-synthesized
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* LICENSING — branches on category. Switches/routers use the Network
          Essentials/Advantage + DNA tier model (rendered via the Cisco RAG
          response). Everything else (wireless APs, Cyber Vision, Catalyst
          Center, IoT OPS, Secure Firewall) has a different commercial model,
          so we render a hand-curated LicensingModelCard instead of asking RAG
          a question that would produce hallucinated tier data. */}
      {supportsLicenseTiers(product.category) ? (
        ciscoRagConfigured() && (
          <Suspense fallback={<LicensingFallback productName={product.name} />}>
            <LicensingSection productName={product.name} />
          </Suspense>
        )
      ) : (
        (() => {
          const model = licensingModelFor(product);
          if (!model) return null;
          return (
            <section className="container pb-12">
              <SectionHeader
                eyebrow="Licensing"
                title={`How ${product.name} is licensed`}
              />
              <LicensingModelCard productName={product.name} model={model} />
            </section>
          );
        })()
      )}

      {/* HARDWARE CONFIGURATIONS — Cisco RAG returns a markdown table with
          SKU variants, port/PoE/PSU breakdown, supported expansion modules.
          Same Suspense + stale-while-revalidate pattern as licensing. Section
          vanishes when RAG isn't configured OR returns no parseable table. */}
      {ciscoRagConfigured() && (
        <Suspense fallback={<HardwareConfigFallback productName={product.name} />}>
          <HardwareConfigSection productName={product.name} />
        </Suspense>
      )}

      {/* SIBLINGS / RELATED */}
      {siblings.length > 0 && (
        <section className="container pb-12">
          <SectionHeader
            eyebrow={`More in ${product.family}`}
            title="Related Cisco SKUs"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {siblings.map((s) => (
              <Link
                key={s.slug}
                href={`/portfolio/${s.slug}`}
                className="group rounded-2xl surface shadow-soft ring-1 ring-[rgb(var(--border))] hover:ring-cisco-500/40 hover:-translate-y-0.5 transition-all duration-200 p-4 flex items-start gap-3"
              >
                <div className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cisco-500/10 ring-1 ring-cisco-500/30 text-cisco-600 dark:text-cisco-300">
                  <NetworkIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-tight group-hover:text-cisco-600 dark:group-hover:text-cisco-300 transition-colors truncate">
                    {s.name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[rgb(var(--fg-muted))] line-clamp-2 leading-snug">
                    {s.oneLiner}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="container pb-24 flex flex-wrap gap-2.5">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1.5 rounded-full bg-cisco-500 text-white px-5 py-2.5 text-sm shadow-glow hover:bg-cisco-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portfolio
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full surface ring-1 ring-[rgb(var(--border))] px-5 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
        >
          All competitors
        </Link>
      </div>
    </>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-2">
        {eyebrow}
      </div>
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

/**
 * Async server component that queries Cisco RAG for license tiers. When the
 * call fails or returns nothing, returns null so the entire section vanishes
 * — no orphan "Licensing" header on the page. Same pattern as the compare
 * page's LicensingSection.
 */
async function LicensingSection({ productName }: { productName: string }) {
  if (!ciscoRagConfigured()) return null;
  let answer = "";
  let sources: string[] = [];
  try {
    const res = await askCiscoRag(
      `What are the available software license tiers for the Cisco ${productName} industrial switch? For each tier (typically Network Essentials, Network Advantage, Cisco DNA Essentials, and Cisco DNA Advantage), list the included features grouped by category — switching, routing, redundancy, industrial protocols, security, IOx / edge compute, and management. Format each tier with a bold heading like "**1. Network Essentials (Perpetual License)**" followed by category bullets like "- Security: 802.1x, MACsec-128, TACACS+".`,
      { timeoutMs: 60_000 }
    );
    answer = res.answer;
    sources = res.sources;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[portfolio/${productName}] licensing fetch failed:`, (err as Error).message);
    return null;
  }
  if (!answer) return null;
  return (
    <section className="container pb-12">
      <SectionHeader
        eyebrow="Licensing"
        title={`What ${productName} ships with at each tier`}
      />
      <LicenseTiers productName={productName} answer={answer} sources={sources} />
    </section>
  );
}

function LicensingFallback({ productName }: { productName: string }) {
  return (
    <section className="container pb-12">
      <SectionHeader
        eyebrow="Licensing"
        title={`What ${productName} ships with at each tier`}
      />
      <LiveLoadingIndicator
        variant="licensing"
        label="license tiers from Cisco RAG"
        estimate="Cisco RAG answers take 20-60s the first time. Cached for an hour after."
      />
    </section>
  );
}

/**
 * Async server component that queries Cisco RAG for the product's SKU
 * variants and hardware configurations. Renders a sortable markdown-table
 * via SkuVariantsTable. Returns null when RAG fails OR returns prose without
 * a parseable table (which happens for non-hardware products like Catalyst
 * Center / Cyber Vision / IoT Ops). The whole section vanishes cleanly in
 * that case — no orphan header.
 */
async function HardwareConfigSection({ productName }: { productName: string }) {
  if (!ciscoRagConfigured()) return null;
  let answer = "";
  let sources: string[] = [];
  try {
    const res = await askCiscoRag(
      `For Cisco ${productName}, list the available hardware SKU variants and their configurations as a single markdown table. Include columns for: SKU code, total port count, copper/fiber port breakdown, PoE budget (if applicable), power supply options, and supported expansion or accessory modules. Only include variants that are currently orderable per the latest Cisco ordering guide. Output ONLY the markdown table plus a brief 1-2 sentence intro — no extended prose. If no hardware SKU variants exist for this product, say "No hardware SKU variants — this is a software/service product." and nothing else.`,
      { timeoutMs: 60_000 }
    );
    answer = res.answer;
    sources = res.sources;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[portfolio/${productName}] hardware config fetch failed:`, (err as Error).message);
    return null;
  }
  if (!answer) return null;
  // If RAG explicitly said no hardware SKUs (software/service products like
  // Cyber Vision, Catalyst Center, IoT Ops), don't render the section.
  if (/no hardware sku variants/i.test(answer) && !answer.includes("|")) {
    return null;
  }
  return (
    <section className="container pb-12">
      <SectionHeader
        eyebrow="Hardware configurations"
        title={`${productName} SKU variants and modules`}
      />
      <SkuVariantsTable productName={productName} answer={answer} sources={sources} />
    </section>
  );
}

function HardwareConfigFallback({ productName }: { productName: string }) {
  return (
    <section className="container pb-12">
      <SectionHeader
        eyebrow="Hardware configurations"
        title={`${productName} SKU variants and modules`}
      />
      <LiveLoadingIndicator
        variant="licensing"
        label="SKU variants from Cisco RAG"
        estimate="Cisco RAG answers take 20-60s the first time. Cached for 7 days after."
      />
    </section>
  );
}
