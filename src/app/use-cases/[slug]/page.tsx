import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, Cpu, MessageCircleQuestion, Swords, Target } from "lucide-react";
import { COMPETITORS } from "@/data/competitors";
import { getCisco } from "@/data/cisco-iiot";
import {
  USE_CASES,
  battlecardsForUseCase,
  ciscoProductsForUseCase,
  useCaseBySlug
} from "@/data/use-cases";
import { ProductGlyph } from "@/components/product-glyph";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export const dynamicParams = false;

function competitorName(slug: string): string {
  return COMPETITORS.find((c) => c.slug === slug)?.name ?? slug;
}

export default function UseCaseDetailPage({ params }: { params: { slug: string } }) {
  const useCase = useCaseBySlug(params.slug);
  if (!useCase) notFound();

  const products = ciscoProductsForUseCase(useCase.label);
  const battlecards = battlecardsForUseCase(useCase.label);
  const Icon = useCase.icon;

  return (
    <>
      {/* HERO */}
      <section className="container pt-12 pb-8">
        <Link
          href="/use-cases"
          className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]"
        >
          <ArrowLeft className="h-4 w-4" />
          All use cases
        </Link>
        <div className="mt-6 flex items-start gap-4">
          <div
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1"
            style={{ backgroundColor: `${useCase.accent}1a`, color: useCase.accent, borderColor: `${useCase.accent}40` }}
          >
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] font-mono mb-1" style={{ color: useCase.accent }}>
              Use case
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{useCase.label}</h1>
            <p className="mt-2 text-[rgb(var(--fg-muted))] max-w-2xl leading-relaxed">{useCase.blurb}</p>
          </div>
        </div>

        {/* Quick-switch chips for the other use cases */}
        <div className="mt-6 flex flex-wrap gap-1.5">
          {USE_CASES.map((u) => (
            <Link
              key={u.slug}
              href={`/use-cases/${u.slug}`}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                u.slug === useCase.slug
                  ? "bg-cisco-500 text-white"
                  : "bg-black/[0.05] dark:bg-white/[0.06] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]"
              }`}
            >
              {u.label}
            </Link>
          ))}
        </div>
      </section>

      {/* OPENING THE CONVERSATION — discovery / positioning / qualification */}
      <section className="container pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PitchColumn
            icon={MessageCircleQuestion}
            label="Discovery"
            hint="Open with these"
            items={useCase.pitch.discovery}
            accent={useCase.accent}
          />
          <PitchColumn
            icon={Target}
            label="Positioning"
            hint="Frame the Cisco story"
            items={useCase.pitch.positioning}
            accent={useCase.accent}
          />
          <PitchColumn
            icon={CheckCircle2}
            label="Qualification"
            hint="Confirms a real deal"
            items={useCase.pitch.qualification}
            accent={useCase.accent}
          />
        </div>
      </section>

      {/* RECOMMENDED DEVICES */}
      <section className="container pb-12">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Devices to lead with</h2>
          <span className="text-xs text-[rgb(var(--fg-muted))]">
            {products.length} product{products.length === 1 ? "" : "s"}
          </span>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-[rgb(var(--fg-muted))]">No devices tagged for this use case yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <Link
                key={p.slug}
                href={`/portfolio/${p.slug}`}
                className="group rounded-3xl surface shadow-soft overflow-hidden ring-1 ring-transparent hover:ring-cisco-500/40 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="aspect-[16/9] relative">
                  <ProductGlyph category={p.category} brand="#049fd9" />
                  {p.embedded && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[rgb(var(--bg-elev))]/90 ring-1 ring-[rgb(var(--border))] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--fg-muted))]">
                      <Cpu className="h-3 w-3" />
                      Embedded
                    </div>
                  )}
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[rgb(var(--bg-elev))]/90 ring-1 ring-[rgb(var(--border))] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--fg-muted))] opacity-0 group-hover:opacity-100 transition-opacity">
                    View details
                    <ArrowUpRight className="h-3 w-3" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-[11px] uppercase tracking-wider text-[rgb(var(--fg-muted))]">{p.family}</div>
                  <div className="mt-1 text-lg font-semibold tracking-tight group-hover:text-cisco-600 dark:group-hover:text-cisco-300 transition-colors">
                    {p.name}
                  </div>
                  <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">{p.oneLiner}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="neutral">{p.category}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* COMPETE PLAYS */}
      {battlecards.length > 0 && (
        <section className="container pb-24">
          <div className="flex items-center gap-2 mb-4">
            <Swords className="h-4 w-4 text-cisco-600 dark:text-cisco-300" />
            <h2 className="text-xl font-semibold tracking-tight">Compete plays for this use case</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {battlecards.map((c) => {
              const primary = getCisco(c.ciscoRecommendation.primarySlug);
              return (
                <Link
                  key={`${c.competitorSlug}/${c.competitorProductSlug}`}
                  href={`/compare/${c.competitorSlug}/${c.competitorProductSlug}`}
                  className="group rounded-2xl surface shadow-soft p-5 ring-1 ring-transparent hover:ring-cisco-500/40 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] uppercase tracking-wider text-[rgb(var(--fg-muted))] font-mono">
                      {competitorName(c.competitorSlug)}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[rgb(var(--fg-muted))] group-hover:text-cisco-600 dark:group-hover:text-cisco-300 transition-colors" />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold tracking-tight">
                    <span>{c.competitorProductName}</span>
                    <span className="text-[rgb(var(--fg-muted))] font-normal">vs</span>
                    <span className="text-cisco-700 dark:text-cisco-300">{primary?.name ?? "Cisco"}</span>
                  </div>
                  <p className="mt-2 text-[12.5px] text-[rgb(var(--fg-muted))] leading-relaxed line-clamp-3">
                    {c.ciscoRecommendation.summary}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

function PitchColumn({
  icon: Icon,
  label,
  hint,
  items,
  accent
}: {
  icon: typeof Target;
  label: string;
  hint: string;
  items: string[];
  accent: string;
}) {
  return (
    <div className="rounded-2xl surface shadow-soft p-5">
      <div className="flex items-center gap-2.5">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl ring-1"
          style={{ backgroundColor: `${accent}1a`, color: accent, borderColor: `${accent}40` }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold tracking-tight leading-none">{label}</div>
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-[rgb(var(--fg-muted))] font-mono mt-1">
            {hint}
          </div>
        </div>
      </div>
      <ul className="mt-3.5 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-[rgb(var(--fg-muted))]">
            <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: accent }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

