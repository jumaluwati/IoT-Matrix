import { HeroSearch } from "@/components/hero-search";
import { CompetitorGrid } from "@/components/competitor-grid";
import { Zap, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* HERO — needs z-30 so the search dropdown paints above the competitor
          grid below. overflow-hidden is removed because it was clipping the
          absolutely-positioned dropdown that extends past the section box. */}
      <section className="relative z-30">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(4,159,217,0.15), transparent 70%)"
          }}
        />
        <div className="container pt-16 pb-12 md:pt-20 md:pb-16">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] animate-fade-in-up max-w-2xl">
              Show them why{" "}
              <span className="gradient-text">Cisco does it best.</span>
            </h1>

            {/* Source chips — placed ABOVE the search so the dropdown never overlaps them.
                Only MCPs that are actually wired up are shown. */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-[rgb(var(--fg-muted))] animate-fade-in-up">
              <span className="inline-flex items-center gap-1.5 glass rounded-full px-3 py-1">
                <Zap className="h-3 w-3 text-amber-500" />
                Cisco Circuit + RAG
              </span>
              <span className="inline-flex items-center gap-1.5 glass rounded-full px-3 py-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Cisco Docs MCP
              </span>
            </div>

            <div className="mt-4 w-full animate-fade-in-up">
              <HeroSearch />
            </div>
          </div>
        </div>
      </section>

      {/* COMPETITOR GRID — explicit z-0 so the hero's dropdown wins. */}
      <section className="container pb-24 relative z-0">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-2">
              01 · Pick a competitor
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Who is your customer comparing Cisco to?
            </h2>
          </div>
          <span className="hidden md:inline text-sm text-[rgb(var(--fg-muted))]">
            Click any card to drill into their IIoT lineup.
          </span>
        </div>
        <CompetitorGrid />
      </section>
    </>
  );
}
