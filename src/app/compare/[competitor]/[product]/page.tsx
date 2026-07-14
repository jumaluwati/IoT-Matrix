import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, ChevronRight, Coins, Hash, Sparkles, Zap } from "lucide-react";
import { getCompetitor, getCompetitorProduct } from "@/data/competitors";
import { defaultCiscoForCategory, getCisco } from "@/data/cisco-iiot";
import { BATTLECARDS } from "@/data/battlecards";
import { licensingModelFor, supportsLicenseTiers } from "@/data/licensing-models";
import { useCaseSlug } from "@/data/use-cases";
import { generateBattlecard, circuitCooldownActive, isSynthesisInFlight, cachedBattlecardAgeMs, BATTLECARD_STALE_AFTER_HOURS } from "@/lib/orchestrator";
import { circuitConfigured } from "@/lib/mcp/circuit";
import { askCiscoDocs, ciscoDocsConfigured } from "@/lib/mcp/cisco-docs";
import { askCiscoRag, ciscoRagConfigured } from "@/lib/mcp/cisco-rag";
import { ProductGlyph } from "@/components/product-glyph";
import { WhyCiscoWinsGrid } from "@/components/why-cisco-wins";
import { SpecTable } from "@/components/spec-table";
import { TalkTrack } from "@/components/talk-track";
import { KnownIssues } from "@/components/known-issues";
import { ReferenceWins } from "@/components/reference-wins";
import { SourceFooter } from "@/components/source-footer";
import { DocsHighlights } from "@/components/docs-highlights";
import { LicensingModelCard } from "@/components/licensing-model-card";
import { LicenseTiers } from "@/components/license-tiers";
import { LiveLoadingIndicator } from "@/components/live-loading-indicator";
import { BattlecardSynthesisWatcher, BattlecardStaleIndicator } from "@/components/battlecard-synthesis-watcher";
import { MeddpiccChecklist } from "@/components/meddpicc-checklist";
import { Badge } from "@/components/ui/badge";

/**
 * Which backend powers the "Live highlights" + "Where the competitor falls short"
 * sections. Set MATRIX_DOCS_BACKEND=data-rag in .env.local to flip from the
 * default Cisco Docs AI endpoint to the genai-ext-rag context_inference endpoint.
 * Both return the same markdown shape so DocsHighlights renders either backend
 * unchanged. Licensing always uses the RAG (no equivalent on Cisco Docs AI).
 */
type DocsBackend = "docs-ai" | "data-rag";
function chooseDocsBackend(): DocsBackend {
  const v = (process.env.MATRIX_DOCS_BACKEND || "").toLowerCase().trim();
  if (v === "data-rag" && ciscoRagConfigured()) return "data-rag";
  return "docs-ai";
}
function docsBackendConfigured(backend: DocsBackend): boolean {
  return backend === "data-rag" ? ciscoRagConfigured() : ciscoDocsConfigured();
}
async function askDocs(
  backend: DocsBackend,
  query: string,
  productName: string,
  timeoutMs: number
): Promise<{ answer: string; sources: string[] }> {
  if (backend === "data-rag") {
    const r = await askCiscoRag(query, { timeoutMs });
    return { answer: r.answer, sources: r.sources };
  }
  const r = await askCiscoDocs(query, { product: productName, timeoutMs });
  return { answer: r.answer, sources: r.sources };
}
function docsBackendLabel(backend: DocsBackend): string {
  return backend === "data-rag" ? "Cisco RAG" : "Cisco Docs";
}

// Only prerender pairs that have an authored mock card (no network at build time).
// Other competitor:product pairs are rendered on demand and synthesized live by Circuit.
export function generateStaticParams() {
  return Object.keys(BATTLECARDS).map((key) => {
    const [competitor, product] = key.split(":");
    return { competitor, product };
  });
}

export const dynamicParams = true;
export const revalidate = 0;

export default async function ComparePage({
  params,
  searchParams
}: {
  params: { competitor: string; product: string };
  searchParams?: { cisco?: string; sync?: string };
}) {
  const competitor = getCompetitor(params.competitor);
  const compProduct = getCompetitorProduct(params.competitor, params.product);
  if (!competitor || !compProduct) notFound();

  // generateBattlecard returns the authored mock instantly when one exists.
  // For non-authored pairs it's NON-BLOCKING by default — kicks off Circuit
  // synthesis in the background and returns null. The page renders Quick
  // Compare with a BattlecardSynthesisWatcher that auto-reloads when the
  // card lands. Pass ?sync=1 to wait for synthesis (used by prewarm script).
  const blocking = searchParams?.sync === "1";
  const card = await generateBattlecard(params.competitor, params.product, { blocking });

  // Honor the user's explicit Cisco pick from smart-compare. If the user typed
  // `?cisco=X` (e.g. "compare ie3500 with 7250 ixr") and the curated card
  // recommends a DIFFERENT product, surface Quick Compare with X as primary so
  // we never silently break the promise the search dropdown made — but expose
  // the curated card as a one-click escape hatch.
  const ciscoOverride = searchParams?.cisco?.trim() || undefined;
  const overrideDiverges =
    card && ciscoOverride && ciscoOverride !== card.ciscoRecommendation.primarySlug;

  if (!card || overrideDiverges) {
    // Capture the orchestrator's view of WHY there's no card so the fallback
    // UI can render an honest message instead of "wire up Cisco Circuit" when
    // Circuit is already wired and just timed out.
    const synthesisStatus = !circuitConfigured()
      ? "circuit-not-configured"
      : circuitCooldownActive()
        ? "circuit-cooldown"
        : "no-attempt";
    const synthesisInFlight = isSynthesisInFlight(params.competitor, params.product);
    return (
      <NoBattlecardYet
        competitor={competitor}
        compProduct={compProduct}
        ciscoOverrideSlug={ciscoOverride}
        authoredCard={overrideDiverges ? card : null}
        synthesisStatus={synthesisStatus}
        synthesisInFlight={synthesisInFlight}
      />
    );
  }

  const primary = getCisco(card.ciscoRecommendation.primarySlug);
  const bundle = card.ciscoRecommendation.bundleSlugs
    .map((s) => getCisco(s))
    .filter(Boolean);

  return (
    <>
      {/* BREADCRUMBS */}
      <div className="container pt-10">
        <nav className="flex items-center gap-1.5 text-xs text-[rgb(var(--fg-muted))]">
          <Link href="/" className="hover:text-[rgb(var(--fg))]">
            Competitors
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/competitor/${competitor.slug}`} className="hover:text-[rgb(var(--fg))]">
            {competitor.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[rgb(var(--fg))]">{card.competitorProductName}</span>
        </nav>
      </div>

      {/* SPLIT HERO */}
      <section className="container pt-6 pb-10">
        <div className="rounded-[2.25rem] surface overflow-hidden shadow-soft">
          <div className="relative grid grid-cols-1 md:grid-cols-2">
            {/* Competitor side */}
            <div className="relative p-8 md:p-10 bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02] flex flex-col">
              <div>
                <div className="text-[11px] font-mono tracking-[0.2em] mb-2" style={{ color: competitor.color }}>
                  {competitor.logoMark}
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  {card.competitorProductName}
                </h1>
                <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">{compProduct.positioning}</p>
              </div>
              <div className="mt-auto pt-8">
                <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-[rgb(var(--border))] grayscale opacity-90">
                  <ProductGlyph category={compProduct.category} brand={competitor.color} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2 min-h-[3.5rem] content-start">
                  <Badge tone="neutral">{compProduct.category}</Badge>
                  {compProduct.family && <Badge tone="neutral">{compProduct.family}</Badge>}
                </div>
              </div>
            </div>

            {/* Divider with VS */}
            <div
              aria-hidden
              className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--bg))] border border-[rgb(var(--border))] shadow-soft"
            >
              <span className="text-[11px] font-bold tracking-wider">VS</span>
            </div>

            {/* Cisco side */}
            <div className="relative p-8 md:p-10 bg-gradient-to-br from-cisco-500/10 via-transparent to-indigo-500/10 flex flex-col">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(4,159,217,0.25), transparent)"
                }}
              />
              <div className="relative">
                <div className="text-[11px] font-mono tracking-[0.2em] text-cisco-600 dark:text-cisco-300 mb-2">
                  CISCO · RECOMMENDED
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  {primary?.name ?? "Cisco"}
                </h2>
                <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">
                  {primary?.oneLiner}
                </p>
              </div>
              <div className="relative mt-auto pt-8">
                <div className="aspect-[16/9] rounded-2xl overflow-hidden ring-1 ring-cisco-500/30 shadow-glow">
                  <ProductGlyph category={primary?.category ?? compProduct.category} brand="#049fd9" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2 min-h-[3.5rem] content-start">
                  <Badge tone="cisco">Primary</Badge>
                  {bundle.map(
                    (b) =>
                      b && (
                        <Badge key={b.slug} tone="neutral">
                          + {b.name}
                        </Badge>
                      )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation strip */}
          <div className="border-t border-[rgb(var(--border))] p-6 md:p-8">
            <div className="flex items-center gap-2 text-xs text-[rgb(var(--fg-muted))] mb-4">
              <Calendar className="h-3.5 w-3.5" />
              Updated {new Date(card.lastUpdatedISO).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </div>
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
              {card.synthesized && (
                <div className="flex flex-col items-start gap-2 md:w-44 md:shrink-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cisco-500/10 text-cisco-700 dark:text-cisco-300 ring-1 ring-cisco-500/30 px-2.5 py-1 text-[11px] font-medium">
                    <Sparkles className="h-3 w-3" />
                    Synthesized live · Cisco Circuit
                  </span>
                  {/* Stale indicator + background-refresh poller. Only renders
                      when the cached card is older than the stale threshold; the
                      page still shows the cached content, and the user gets an
                      auto-reload once the silent refresh completes. */}
                  {(() => {
                    const ageMs = cachedBattlecardAgeMs(params.competitor, params.product);
                    if (ageMs === null) return null;
                    const ageHours = Math.round(ageMs / (60 * 60 * 1000));
                    if (ageHours < BATTLECARD_STALE_AFTER_HOURS) return null;
                    return (
                      <BattlecardStaleIndicator
                        competitorSlug={params.competitor}
                        productSlug={params.product}
                        ageHours={ageHours}
                      />
                    );
                  })()}
                </div>
              )}
              <div className="flex-1 text-sm md:text-base leading-relaxed">
                <span className="font-semibold text-cisco-700 dark:text-cisco-300 mr-1">Recommendation —</span>
                {card.ciscoRecommendation.summary}
              </div>
              <a
                href="#talk-track"
                className="inline-flex items-center gap-2 self-start md:self-auto md:shrink-0 whitespace-nowrap rounded-full bg-cisco-500 px-5 py-2.5 text-sm font-medium text-white shadow-glow hover:bg-cisco-600 transition-colors"
              >
                Jump to talk track
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      {card.useCases.length > 0 && (
        <section className="container pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[rgb(var(--fg-muted))] mr-2">
              Use cases
            </span>
            {card.useCases.map((u) => (
              <Link key={u} href={`/use-cases/${useCaseSlug(u)}`} className="group">
                <Badge
                  tone="cisco"
                  className="cursor-pointer ring-1 ring-cisco-500/30 transition-colors group-hover:bg-cisco-500/20 group-hover:ring-cisco-500/60"
                >
                  <Hash className="h-3 w-3 opacity-70" />
                  {u}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* WHY CISCO WINS */}
      <section className="container py-12">
        <SectionHeader index="03" eyebrow="Why Cisco wins" title="The pillars to lead with" />
        <WhyCiscoWinsGrid pillars={card.pillars} />
      </section>

      {/* SPECS */}
      <section className="container py-12">
        <SectionHeader index="04" eyebrow="Side-by-side" title="Capability comparison" />
        <SpecTable specs={card.specs} competitorName={card.competitorProductName} synthesized={card.synthesized} />
      </section>

      {/* TALK TRACK */}
      <section id="talk-track" className="container py-12 scroll-mt-24">
        <SectionHeader
          index="05"
          eyebrow="In the room"
          title="What to say next"
          subtitle="Drop these verbatim. Built for live customer conversations."
        />
        <TalkTrack talk={card.talkTrack} />
      </section>

      {/* RISK + WINS */}
      <section className="container py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
        <div className="flex flex-col">
          <SectionHeader index="06" eyebrow="Competitor risk" title="Known issues and advisories" />
          <div className="flex-1">
            <KnownIssues issues={card.knownIssues} />
          </div>
        </div>
        <div className="flex flex-col">
          <SectionHeader index="07" eyebrow="Proof" title="Reference wins" />
          <div className="flex-1">
            <ReferenceWins wins={card.references} />
          </div>
        </div>
      </section>

      {/* TCO + SOURCES + CISCO DOCS (stacked, full-width, balanced) */}
      <section className="container pb-12 space-y-6">
        {card.tcoNote && (
          <div className="rounded-3xl surface shadow-soft p-5 md:p-6 flex items-start gap-4">
            <div className="rounded-2xl bg-cisco-500/10 ring-1 ring-cisco-500/30 p-2.5 shrink-0">
              <Coins className="h-4 w-4 text-cisco-600 dark:text-cisco-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-1">
                TCO insight
              </div>
              <p className="text-sm leading-relaxed">{card.tcoNote}</p>
            </div>
          </div>
        )}
        <SourceFooter sources={card.sources} />
      </section>

      {/* LIVE FROM CISCO DOCS / RAG — streams in independently via Suspense.
          The header lives INSIDE the async component so a failed fetch (timeout,
          ambiguous product, etc.) doesn't leave an orphan title + empty body on
          the page. The skeleton fallback renders the same header silhouette so
          the layout is stable as content streams in. */}
      {primary && docsBackendConfigured(chooseDocsBackend()) && (
        <Suspense
          fallback={
            <SectionShell index="08" eyebrow={`From ${docsBackendLabel(chooseDocsBackend())}`} title={`Live highlights for ${primary.name}`} subtitle="Pulled from current Cisco product documentation. Cached for an hour after the first visit.">
              <DocsHighlightsSkeleton />
            </SectionShell>
          }
        >
          <DocsSection
            productName={primary.name}
            sectionIndex="08"
            sectionTitle={`Live highlights for ${primary.name}`}
            sectionSubtitle="Pulled from current Cisco product documentation. Cached for an hour after the first visit."
          />
        </Suspense>
      )}

      {/* LICENSING — branches on the Cisco recommendation's category. Switches
          and routers use the dynamic Network Essentials/Advantage tier model
          via Cisco RAG. Other product categories have a different commercial
          model, so we render a hand-curated LicensingModelCard instead of
          asking RAG a question that would produce hallucinated tier data. */}
      {primary && supportsLicenseTiers(primary.category) && ciscoRagConfigured() && (
        <Suspense
          fallback={
            <SectionShell index="09" eyebrow="Licensing" title={`What ${primary.name} ships with at each tier`} subtitle="Click any tier to see the included features.">
              <LicenseTiersSkeleton />
            </SectionShell>
          }
        >
          <LicensingSection
            productName={primary.name}
            sectionIndex="09"
            sectionTitle={`What ${primary.name} ships with at each tier`}
          />
        </Suspense>
      )}
      {primary && !supportsLicenseTiers(primary.category) && (() => {
        const model = licensingModelFor(primary);
        if (!model) return null;
        return (
          <SectionShell index="09" eyebrow="Licensing" title={`How ${primary.name} is licensed`}>
            <LicensingModelCard productName={primary.name} model={model} />
          </SectionShell>
        );
      })()}

      {/* WHERE THE COMPETITOR FALLS SHORT — also streams in via Suspense */}
      {primary && docsBackendConfigured(chooseDocsBackend()) && (
        <Suspense
          fallback={
            <SectionShell index="10" eyebrow="What to attack" title={`Where the ${card.competitorProductName} falls short`} subtitle={`Grounded in Cisco compete content. Use these as discovery hooks against the ${card.competitorProductName}.`}>
              <DocsHighlightsSkeleton tone="caution" />
            </SectionShell>
          }
        >
          <GapsSection
            competitorName={card.competitorProductName}
            ciscoName={primary.name}
            sectionIndex="10"
            sectionTitle={`Where the ${card.competitorProductName} falls short`}
            sectionSubtitle={`Grounded in Cisco compete content. Use these as discovery hooks against the ${card.competitorProductName}.`}
          />
        </Suspense>
      )}
{/* MEDDPICC qualification — client-side, localStorage-persisted. The
          discovery questions from the talk track seed the Identify-Pain
          section as prompts so the seller has Cisco-vetted starting hooks. */}
      {primary && (
        <section className="container pb-16">
          <SectionHeader
            index="11"
            eyebrow="Deal qualification"
            title="MEDDPICC scratchpad"
            subtitle="Captured locally in your browser. Never sent over the network. Copy as markdown to paste into your CRM."
          />
          <MeddpiccChecklist
            competitorSlug={competitor.slug}
            productSlug={compProduct.slug}
            competitorName={card.competitorProductName}
            ciscoProductName={primary.name}
            discoveryQuestions={card.talkTrack?.discovery}
          />
        </section>
      )}

      
      <div className="container pb-16">
        <Link
          href={`/competitor/${competitor.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {competitor.name} lineup
        </Link>
      </div>
    </>
  );
}

function SectionHeader({
  index,
  eyebrow,
  title,
  subtitle
}: {
  index: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-2">
        {index} · {eyebrow}
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">{subtitle}</p>}
    </div>
  );
}

/**
 * Outer <section> wrapper used by every async streaming block so the header +
 * body land together. Suspense fallbacks render this with a skeleton inside;
 * the async components render it with real data (or `null` when the fetch
 * fails, which yields no DOM at all — no orphan header).
 */
function SectionShell({
  index,
  eyebrow,
  title,
  subtitle,
  children,
  padding = "pb-16"
}: {
  index: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  padding?: string;
}) {
  return (
    <section className={`container ${padding}`}>
      <SectionHeader index={index} eyebrow={eyebrow} title={title} subtitle={subtitle} />
      {children}
    </section>
  );
}

async function NoBattlecardYet({
  competitor,
  compProduct,
  ciscoOverrideSlug,
  authoredCard,
  synthesisStatus,
  synthesisInFlight
}: {
  competitor: ReturnType<typeof getCompetitor> extends infer T ? Exclude<T, undefined> : never;
  compProduct: ReturnType<typeof getCompetitorProduct> extends infer T ? Exclude<T, undefined> : never;
  ciscoOverrideSlug?: string;
  authoredCard?: Awaited<ReturnType<typeof generateBattlecard>>;
  synthesisStatus?: "circuit-not-configured" | "circuit-cooldown" | "no-attempt";
  synthesisInFlight?: boolean;
}) {
  // Honor ?cisco=<slug> from smart search; fall back to a category-based pick
  // so the page is useful even without a hand-authored battlecard.
  const override = ciscoOverrideSlug ? getCisco(ciscoOverrideSlug) : undefined;
  const primary = override ?? defaultCiscoForCategory(compProduct.category);
  const isUserPicked = Boolean(override);
  const authoredPrimary = authoredCard
    ? getCisco(authoredCard.ciscoRecommendation.primarySlug)
    : undefined;

  // Generic talk-track scaffolding by category — enough to start a conversation
  // while a full battlecard is being authored or synthesized live.
  const discovery = discoveryForCategory(compProduct.category);

  return (
    <>
      {/* BREADCRUMBS */}
      <div className="container pt-10">
        <nav className="flex items-center gap-1.5 text-xs text-[rgb(var(--fg-muted))]">
          <Link href="/" className="hover:text-[rgb(var(--fg))]">
            Competitors
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/competitor/${competitor.slug}`} className="hover:text-[rgb(var(--fg))]">
            {competitor.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[rgb(var(--fg))]">{compProduct.name}</span>
        </nav>
      </div>

      {/* QUICK COMPARE HERO */}
      <section className="container pt-6 pb-10">
        <div className="rounded-[2.25rem] surface overflow-hidden shadow-soft">
          <div className="relative grid grid-cols-1 md:grid-cols-2">
            <div className="relative p-8 md:p-10 bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02] flex flex-col">
              <div>
                <div className="text-[11px] font-mono tracking-[0.2em] mb-2" style={{ color: competitor.color }}>
                  {competitor.logoMark}
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  {compProduct.name}
                </h1>
                <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">{compProduct.positioning}</p>
              </div>
              <div className="mt-auto pt-8">
                <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-[rgb(var(--border))] grayscale opacity-90">
                  <ProductGlyph category={compProduct.category} brand={competitor.color} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2 min-h-[3.5rem] content-start">
                  <Badge tone="neutral">{compProduct.category}</Badge>
                  {compProduct.family && <Badge tone="neutral">{compProduct.family}</Badge>}
                </div>
              </div>
            </div>

            <div
              aria-hidden
              className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--bg))] border border-[rgb(var(--border))] shadow-soft"
            >
              <span className="text-[11px] font-bold tracking-wider">VS</span>
            </div>

            <div className="relative p-8 md:p-10 bg-gradient-to-br from-cisco-500/10 via-transparent to-indigo-500/10 flex flex-col">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(4,159,217,0.25), transparent)"
                }}
              />
              <div className="relative">
                <div className="text-[11px] font-mono tracking-[0.2em] text-cisco-600 dark:text-cisco-300 mb-2">
                  CISCO · {isUserPicked ? "YOUR PICK" : "LIKELY MATCH"}
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{primary.name}</h2>
                <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">{primary.oneLiner}</p>
              </div>
              <div className="relative mt-auto pt-8">
                <div className="aspect-[16/9] rounded-2xl overflow-hidden ring-1 ring-cisco-500/30 shadow-glow">
                  <ProductGlyph category={primary.category} brand="#049fd9" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2 min-h-[3.5rem] content-start">
                  <Badge tone="cisco">{isUserPicked ? "Your pick" : "Best-guess match"}</Badge>
                  <Badge tone="neutral">{primary.category}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Awaiting-synthesis strip (or authored-card escape hatch) */}
          <div className="border-t border-[rgb(var(--border))] p-6 md:p-8">
            {authoredCard && authoredPrimary ? (
              /* OVERRIDE CASE: the curated card recommends a different Cisco
                 SKU than what the seller picked. Show BOTH options side-by-side
                 with concrete "lead with this when..." reasoning instead of
                 framing one as wrong. The seller has full context and clicks
                 whichever fits the current customer. */
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cisco-500/10 text-cisco-700 dark:text-cisco-300 ring-1 ring-cisco-500/30 px-2.5 py-1 text-[11px] font-medium">
                    <Sparkles className="h-3 w-3" />
                    Two valid Cisco answers
                  </span>
                  <span className="text-[12.5px] text-[rgb(var(--fg-muted))]">
                    Pick the SKU that best fits this opportunity &mdash; both compete with {compProduct.name}.
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* User's pick — the one already rendered in the hero. */}
                  <div className="rounded-2xl ring-2 ring-cisco-500/40 bg-cisco-500/[0.04] p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-cisco-500 text-white px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider">
                        Currently showing
                      </span>
                    </div>
                    <div className="text-base font-semibold tracking-tight">{primary.name}</div>
                    <div className="mt-1 text-[12.5px] text-[rgb(var(--fg-muted))] leading-relaxed">
                      {primary.oneLiner}
                    </div>
                    <div className="mt-2.5 text-[11.5px] text-[rgb(var(--fg-muted))]">
                      <span className="font-semibold text-[rgb(var(--fg))]">Lead here when:</span>{" "}
                      {leadReasonFor(primary, compProduct)}
                    </div>
                  </div>
                  {/* Curated card's pick — clicking switches to it. */}
                  <Link
                    href={`/compare/${competitor.slug}/${compProduct.slug}`}
                    className="group rounded-2xl ring-1 ring-[rgb(var(--border))] hover:ring-cisco-500/40 hover:-translate-y-0.5 transition-all p-4 bg-[rgb(var(--bg-elev))]"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 ring-1 ring-amber-500/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider">
                        Curated battlecard
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[rgb(var(--fg-muted))] group-hover:text-cisco-600 dark:group-hover:text-cisco-300 transition-colors" />
                    </div>
                    <div className="text-base font-semibold tracking-tight group-hover:text-cisco-600 dark:group-hover:text-cisco-300 transition-colors">
                      {authoredPrimary.name}
                    </div>
                    <div className="mt-1 text-[12.5px] text-[rgb(var(--fg-muted))] leading-relaxed">
                      {authoredPrimary.oneLiner}
                    </div>
                    <div className="mt-2.5 text-[11.5px] text-[rgb(var(--fg-muted))]">
                      <span className="font-semibold text-[rgb(var(--fg))]">Lead here when:</span>{" "}
                      {leadReasonFor(authoredPrimary, compProduct)}
                    </div>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                {synthesisStatus === "circuit-not-configured" ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 px-2.5 py-1 text-[11px] font-medium self-start">
                      <Zap className="h-3 w-3" />
                      Full battlecard pending
                    </span>
                    <div className="flex-1 text-sm md:text-base leading-relaxed text-[rgb(var(--fg-muted))]">
                      <span className="font-semibold text-[rgb(var(--fg))] mr-1">Quick read &mdash;</span>
                      Pre-authored battlecard isn&rsquo;t available for this pair yet, and Cisco Circuit
                      isn&rsquo;t configured in <code className="text-[12px] px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">.env.local</code>.
                      Wire up the CIRCUIT_* env block to get a synthesized card with full pillars, specs, and references on demand.
                    </div>
                  </>
                ) : (
                  <div className="flex-1 text-sm md:text-base leading-relaxed text-[rgb(var(--fg-muted))]">
                    <span className="font-semibold text-[rgb(var(--fg))] mr-1">Quick read &mdash;</span>
                    Full battlecard is synthesizing in the background. Browse the lineup metadata + live
                    Cisco Docs content below; the full card will load automatically the moment it&rsquo;s ready.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BACKGROUND SYNTHESIS WATCHER — only when Circuit is wired. The
              page never blocks on synthesis; this client widget polls status
              every 5s and triggers an auto-reload when the cache lands. The
              manual "Refresh now" button lets the user kick off a synthesis
              immediately (e.g. before a customer call). */}
          {!authoredCard && synthesisStatus !== "circuit-not-configured" && (
            <div className="px-6 md:px-8 pb-6 md:pb-8">
              <BattlecardSynthesisWatcher
                competitorSlug={competitor.slug}
                productSlug={compProduct.slug}
                initialInFlight={synthesisInFlight}
                tone={synthesisStatus === "circuit-cooldown" ? "cooldown" : "pending"}
                estimateSec={150}
              />
            </div>
          )}
        </div>
      </section>

      {/* CISCO MATCH HIGHLIGHTS */}
      <section className="container py-8">
        <SectionHeader index="01" eyebrow="Why this Cisco match" title={`${primary.name} highlights`} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {primary.highlights.map((h) => (
            <div key={h} className="rounded-2xl surface shadow-soft p-5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cisco-500/10 ring-1 ring-cisco-500/30 text-cisco-600 dark:text-cisco-300 mb-3">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-sm leading-relaxed">{h}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DISCOVERY QUESTIONS */}
      <section className="container py-8">
        <SectionHeader
          index="02"
          eyebrow="In the room"
          title="Starter discovery questions"
          subtitle={`Generic prompts for the ${compProduct.category.toLowerCase()} category — refine once the full battlecard lands.`}
        />
        <ol className="space-y-3">
          {discovery.map((q, i) => (
            <li key={q} className="flex items-start gap-3 rounded-2xl surface shadow-soft p-4">
              <span className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-cisco-500/10 ring-1 ring-cisco-500/30 text-cisco-600 dark:text-cisco-300 text-xs font-mono">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-relaxed">{q}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* CISCO DOCS / RAG LIVE — streams in independently via Suspense. Header
          lives inside the async component so failed fetches don't leave orphan
          titles. */}
      {docsBackendConfigured(chooseDocsBackend()) && (
        <Suspense
          fallback={
            <SectionShell index="03" eyebrow={`From ${docsBackendLabel(chooseDocsBackend())}`} title={`Live highlights for ${primary.name}`} subtitle="Pulled from current Cisco product documentation. Cached for an hour after the first visit." padding="py-8">
              <DocsHighlightsSkeleton />
            </SectionShell>
          }
        >
          <DocsSection
            productName={primary.name}
            sectionIndex="03"
            sectionTitle={`Live highlights for ${primary.name}`}
            sectionSubtitle="Pulled from current Cisco product documentation. Cached for an hour after the first visit."
            padding="py-8"
          />
        </Suspense>
      )}

      {/* LICENSING — same category-aware branching as the authored-card path. */}
      {supportsLicenseTiers(primary.category) && ciscoRagConfigured() && (
        <Suspense
          fallback={
            <SectionShell index="04" eyebrow="Licensing" title={`What ${primary.name} ships with at each tier`} subtitle="Click any tier to see the included features." padding="py-8">
              <LicenseTiersSkeleton />
            </SectionShell>
          }
        >
          <LicensingSection
            productName={primary.name}
            sectionIndex="04"
            sectionTitle={`What ${primary.name} ships with at each tier`}
            padding="py-8"
          />
        </Suspense>
      )}
      {!supportsLicenseTiers(primary.category) && (() => {
        const model = licensingModelFor(primary);
        if (!model) return null;
        return (
          <SectionShell index="04" eyebrow="Licensing" title={`How ${primary.name} is licensed`} padding="py-8">
            <LicensingModelCard productName={primary.name} model={model} />
          </SectionShell>
        );
      })()}

      {/* WHERE THE COMPETITOR FALLS SHORT — also streams in via Suspense */}
      {docsBackendConfigured(chooseDocsBackend()) && (
        <Suspense
          fallback={
            <SectionShell index="05" eyebrow="What to attack" title={`Where the ${compProduct.name} falls short`} subtitle={`Grounded in Cisco compete content. Use these as discovery hooks against the ${compProduct.name}.`} padding="py-8">
              <DocsHighlightsSkeleton tone="caution" />
            </SectionShell>
          }
        >
          <GapsSection
            competitorName={compProduct.name}
            ciscoName={primary.name}
            sectionIndex="05"
            sectionTitle={`Where the ${compProduct.name} falls short`}
            sectionSubtitle={`Grounded in Cisco compete content. Use these as discovery hooks against the ${compProduct.name}.`}
            padding="py-8"
          />
        </Suspense>
      )}

      {/* MEDDPICC qualification (Quick Read branch). Uses the generic
          category-based discovery questions since there's no authored
          talk track. Same client-side localStorage persistence as the
          authored-card path. */}
      <section className="container py-8">
        <SectionHeader
          index="06"
          eyebrow="Deal qualification"
          title="MEDDPICC scratchpad"
          subtitle="Captured locally in your browser. Never sent over the network. Copy as markdown to paste into your CRM."
        />
        <MeddpiccChecklist
          competitorSlug={competitor.slug}
          productSlug={compProduct.slug}
          competitorName={compProduct.name}
          ciscoProductName={primary.name}
          discoveryQuestions={discovery}
        />
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="rounded-3xl surface shadow-soft p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold tracking-tight">Need the full battlecard now?</h3>
            <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
              We have ready battlecards for {Object.keys(BATTLECARDS).length} competitor pairs.
              Browse the rest of {competitor.name}&rsquo;s lineup or jump back to the competitor grid.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/competitor/${competitor.slug}`}
              className="rounded-full bg-cisco-500 text-white px-5 py-2.5 text-sm shadow-glow hover:bg-cisco-600"
            >
              Back to {competitor.name} lineup
            </Link>
            <Link href="/" className="rounded-full surface px-5 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5">
              All competitors
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Async server component that fetches a Cisco Docs answer for the given
 * product and renders it as DocsHighlights cards. Wrapped in <Suspense> by
 * the page so it streams in independently of the rest of the page render.
 *
 * The SectionHeader is rendered INSIDE this component so failed fetches
 * (timeout, 409 "ambiguous product" with no retry suggestion, empty answer)
 * yield `null` from the entire section — no orphan title left on the page.
 */
async function DocsSection({
  productName,
  sectionIndex,
  sectionTitle,
  sectionSubtitle,
  padding = "pb-16"
}: {
  productName: string;
  sectionIndex: string;
  sectionTitle: string;
  sectionSubtitle?: string;
  padding?: string;
}) {
  const backend = chooseDocsBackend();
  if (!docsBackendConfigured(backend)) return null;
  let answer = "";
  let sources: string[] = [];
  try {
    const res = await askDocs(
      backend,
      `What are the key industrial and security capabilities of ${productName}? List the most important capabilities, one per bullet, with a short 2-5 word title in bold and a 1-2 sentence explanation.`,
      productName,
      20_000
    );
    answer = res.answer;
    sources = res.sources;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[compare-page] DocsSection failed for ${productName}:`, (err as Error).message);
    return null;
  }
  if (!answer) return null;
  return (
    <SectionShell
      index={sectionIndex}
      eyebrow={`From ${docsBackendLabel(backend)}`}
      title={sectionTitle}
      subtitle={sectionSubtitle}
      padding={padding}
    >
      <DocsHighlights
        productName={productName}
        answer={answer}
        sources={sources}
        sourceLabel={`via ${docsBackendLabel(backend)} · ${productName}`}
      />
    </SectionShell>
  );
}

/**
 * Companion to DocsSection that asks Cisco Docs about competitor gaps. Same
 * Suspense + cache mechanics; rendered with `tone="caution"` so the cards
 * read as "watch-outs" not "capabilities".
 */
async function GapsSection({
  competitorName,
  ciscoName,
  sectionIndex,
  sectionTitle,
  sectionSubtitle,
  padding = "pb-16"
}: {
  competitorName: string;
  ciscoName: string;
  sectionIndex: string;
  sectionTitle: string;
  sectionSubtitle?: string;
  padding?: string;
}) {
  const backend = chooseDocsBackend();
  if (!docsBackendConfigured(backend)) return null;
  let answer = "";
  let sources: string[] = [];
  try {
    const res = await askDocs(
      backend,
      `Compared to ${ciscoName}, what are the main gaps, limitations, or operational weaknesses of ${competitorName} for industrial IoT deployments? Focus on security, manageability, ecosystem integration, supply-chain considerations, and resilience. List concrete shortcomings, one per bullet, with a short title in bold and a 1-2 sentence explanation.`,
      ciscoName,
      20_000
    );
    answer = res.answer;
    sources = res.sources;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[compare-page] GapsSection failed for ${competitorName} vs ${ciscoName}:`, (err as Error).message);
    return null;
  }
  if (!answer) return null;
  return (
    <SectionShell
      index={sectionIndex}
      eyebrow="What to attack"
      title={sectionTitle}
      subtitle={sectionSubtitle}
      padding={padding}
    >
      <DocsHighlights
        productName={competitorName}
        answer={answer}
        sources={sources}
        tone="caution"
        maxCards={6}
        sourceLabel={`via ${docsBackendLabel(backend)} · ${ciscoName} vs ${competitorName}`}
      />
    </SectionShell>
  );
}

/**
 * Async server component that fetches license-tier data from Cisco RAG and
 * renders it via the interactive LicenseTiers client component. Wrapped in
 * <Suspense> by the page so it streams independently. Cached on disk so
 * subsequent visits are instant.
 *
 * Header is rendered INSIDE the section so a failed RAG call yields no
 * orphan title on the page.
 */
async function LicensingSection({
  productName,
  sectionIndex,
  sectionTitle,
  padding = "pb-16"
}: {
  productName: string;
  sectionIndex: string;
  sectionTitle: string;
  padding?: string;
}) {
  if (!ciscoRagConfigured()) return null;
  let answer = "";
  let sources: string[] = [];
  try {
    const res = await askCiscoRag(
      `What are the available software license tiers for the Cisco ${productName} industrial switch? For each tier (typically Network Essentials, Network Advantage, Cisco DNA Essentials, and Cisco DNA Advantage), list the included features grouped by category — switching, routing, redundancy, industrial protocols, security, IOx / edge compute, and management. Format each tier with a bold heading like "**1. Network Essentials (Perpetual License)**" followed by category bullets like "- Security: 802.1x, MACsec-128, TACACS+".`,
      { timeoutMs: 30_000 }
    );
    answer = res.answer;
    sources = res.sources;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[compare-page] LicensingSection failed for ${productName}:`, (err as Error).message);
    return null;
  }
  if (!answer) return null;
  return (
    <SectionShell
      index={sectionIndex}
      eyebrow="Licensing"
      title={sectionTitle}
      subtitle="Click any tier to see what ships with it."
      padding={padding}
    >
      <LicenseTiers productName={productName} answer={answer} sources={sources} />
    </SectionShell>
  );
}

function LicenseTiersSkeleton() {
  return (
    <LiveLoadingIndicator
      variant="licensing"
      label="license tiers from Cisco RAG"
      estimate="Cisco RAG answers take 20-60s the first time. Cached for an hour after."
    />
  );
}

function DocsHighlightsSkeleton({ tone = "cisco" }: { tone?: "cisco" | "caution" } = {}) {
  const label = tone === "caution" ? "competitor gaps from Cisco Docs" : "highlights from Cisco Docs";
  return (
    <LiveLoadingIndicator
      variant="docs"
      label={label}
      estimate="Cisco Docs AI answers take 5-20s the first time. Cached for an hour after."
      tone={tone}
    />
  );
}

/**
 * One-sentence "lead with this when…" guidance for the override-strip's
 * side-by-side comparison. Uses curated rules based on Cisco IIoT product
 * family + family-vs-family signals; falls back to a generic line so we
 * never render an empty cell.
 *
 * Keep this conservative — it's shown to sales engineers who need defensible
 * positioning, not marketing copy.
 */
function leadReasonFor(
  cisco: ReturnType<typeof getCisco> extends infer T ? Exclude<T, undefined> : never,
  compProduct: ReturnType<typeof getCompetitorProduct> extends infer T ? Exclude<T, undefined> : never
): string {
  // Curated per-SKU positioning lives on the product catalog (`whenToLead`) so
  // it's the single source of truth shared with the Cisco-vs-Cisco compare page.
  if (cisco.whenToLead) return cisco.whenToLead;
  return `Lead with ${cisco.name} when ${compProduct.category.toLowerCase()} positioning aligns with its specific strengths (see talk track and pillars below).`;
}

function discoveryForCategory(category: string): string[] {
  const norm = category.toLowerCase();
  if (norm.includes("router")) {
    return [
      "Is the box already deployed, or are we in the design phase? What carrier and what cellular tech (LTE-A, 5G Sub-6, mmWave)?",
      "Who manages the device today — the OT team, the IT team, or a third party? Does that team already use IOS XE / DNA / IoT Operations Dashboard for anything else?",
      "What edge compute do they need at the asset — protocol translation, local analytics, container hosting?",
      "Does the deployment fall under any covered-list, NDAA, or supply-chain restrictions for the buyer's vertical?"
    ];
  }
  if (norm.includes("switch")) {
    return [
      "Is this for an industrial cabinet (DIN-rail), an outdoor enclosure (IP67), or a rack-mount in a substation / control room?",
      "Do they need TSN, PRP/HSR, or PTP for deterministic OT traffic? Which protocol family (PROFINET, EtherNet/IP, IEC 61850)?",
      "Are they running a separate appliance for OT visibility today, or do they want it embedded in the switch (Cyber Vision)?",
      "What's their existing campus / enterprise stack? Catalyst 9000 + ISE? That alignment turns into Day-2 cost savings."
    ];
  }
  if (norm.includes("wireless") || norm.includes("ap")) {
    return [
      "Is the use case mobility-critical (AGVs, trains, port cranes) or general OT Wi-Fi? Sub-50ms handoff requirements?",
      "Outdoor or in-cabinet? Wi-Fi 6/6E sufficient, or do they need Ultra-Reliable Wireless Backhaul (URWB) for mesh?",
      "Who owns the spectrum strategy — IT, OT, or a plant integrator? Any need for private 5G in parallel?",
      "Existing Catalyst Wireless or Meraki footprint anywhere else in the org?"
    ];
  }
  if (norm.includes("firewall") || norm.includes("security")) {
    return [
      "Where is the IT/OT DMZ today, and what enforces it — a NGFW, a data diode, or just VLANs?",
      "Do they have a CMDB or asset inventory for OT? How current is it?",
      "Have they been audited against IEC 62443, NIS2, NERC CIP, or TSA pipeline directives recently?",
      "What's the SOC stack — Splunk, QRadar, Sentinel? Cyber Vision feeds them all natively."
    ];
  }
  return [
    `What problem is the customer trying to solve with the ${category}?`,
    "Is this a greenfield deployment or a refresh? What's the existing Cisco footprint in the rest of the network?",
    "Who owns the buying decision — IT, OT, plant engineering, or procurement?",
    "What's the timeline, and what compliance / regulatory constraints apply?"
  ];
}
