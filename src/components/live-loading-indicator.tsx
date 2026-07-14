"use client";

import { useEffect, useState } from "react";
import { Clock, Sparkles, Database, Brain } from "lucide-react";

/**
 * Live loading indicator for slow async sections (Cisco RAG licensing, Cisco
 * Docs highlights, Circuit synthesis). Displays:
 *   - a friendly elapsed-time counter so users know the page didn't hang
 *   - an estimated-window hint ("typically 20-60s on first load")
 *   - a tier-shaped skeleton silhouette so the layout doesn't jump when
 *     real content streams in
 *
 * Always client-side (uses setInterval). Safe to import from a server
 * component because the parent <Suspense> never resolves until the async
 * data arrives — this component only renders during the wait.
 *
 * Variants:
 *   "licensing" — pair of family-shaped cards + selected-tier silhouette
 *   "docs"      — 6-card grid silhouette matching DocsHighlights
 *   "circuit"   — single hero card for Circuit battlecard synthesis
 */
type Variant = "licensing" | "docs" | "circuit";
type Tone = "cisco" | "caution";

interface Props {
  variant: Variant;
  /** Plain English label shown next to the spinner (e.g. "license tiers"). */
  label: string;
  /** Friendly hint about expected duration. */
  estimate?: string;
  /** Color tone — `caution` flips cisco-blue accents to amber. */
  tone?: Tone;
}

const TONE = {
  cisco: {
    text: "text-cisco-600 dark:text-cisco-300",
    bg: "bg-cisco-500",
    bgSoft: "bg-cisco-500/10",
    ring: "ring-cisco-500/30",
    icon: "text-cisco-600 dark:text-cisco-300"
  },
  caution: {
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500",
    bgSoft: "bg-amber-500/10",
    ring: "ring-amber-500/30",
    icon: "text-amber-700 dark:text-amber-300"
  }
};

const ICON_FOR_VARIANT: Record<Variant, typeof Sparkles> = {
  licensing: Database,
  docs: Sparkles,
  circuit: Brain
};

export function LiveLoadingIndicator({
  variant,
  label,
  estimate = "typically 20-60s on first load · instant after cache lands",
  tone = "cisco"
}: Props) {
  const t = TONE[tone];
  const VariantIcon = ICON_FOR_VARIANT[variant];

  // Tick the elapsed counter once a second. We mount on the client only
  // (Suspense fallback runs in the browser when the async child suspends),
  // so this never runs on the server.
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsedSec(Math.round((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Soft progress bar — fills toward 95% over ~60s but never reaches 100%
  // until real content actually arrives. Cheap psychological reassurance.
  const pct = Math.min(95, Math.floor((elapsedSec / 60) * 95));

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl ring-1 ${t.ring} ${t.bgSoft} p-4`}>
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${t.ring} bg-[rgb(var(--bg-elev))] ${t.icon}`}
          >
            <VariantIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm font-semibold tracking-tight ${t.text}`}>
                Fetching live {label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/5 px-2 py-0.5 text-[10.5px] font-mono uppercase tracking-wider text-[rgb(var(--fg-muted))]">
                <Clock className="h-2.5 w-2.5" />
                {elapsedSec}s
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-[rgb(var(--fg-muted))] leading-relaxed">
              {estimate}
            </p>
            <div className="mt-3 h-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
              <div
                className={`h-full ${t.bg} transition-[width] duration-1000 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Silhouette skeleton — variant-specific so the layout doesn't jump
          when the real content streams in. */}
      {variant === "licensing" && <LicensingSilhouette tone={t} />}
      {variant === "docs" && <DocsSilhouette tone={t} />}
      {variant === "circuit" && <CircuitSilhouette tone={t} />}
    </div>
  );
}

type ToneTokens = (typeof TONE)[Tone];

function LicensingSilhouette({ tone }: { tone: ToneTokens }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-2xl surface ring-1 ring-[rgb(var(--border))] p-3.5 md:p-4 space-y-3"
          >
            <div className="flex items-center gap-2.5">
              <div className={`h-8 w-8 rounded-lg ${tone.bgSoft} animate-pulse`} />
              <div className="h-4 w-32 rounded bg-[rgb(var(--border))]/40 animate-pulse" />
              <div className="ml-auto h-4 w-20 rounded-full bg-[rgb(var(--border))]/30 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-9 rounded-lg bg-[rgb(var(--border))]/30 animate-pulse" />
              <div className="h-9 rounded-lg bg-[rgb(var(--border))]/30 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl surface ring-1 ring-[rgb(var(--border))] p-5 space-y-4">
        <div className="h-6 w-1/3 rounded bg-[rgb(var(--border))]/40 animate-pulse" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-[180px_1fr] gap-4 items-start py-2">
              <div className="h-3 w-24 rounded bg-[rgb(var(--border))]/40 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-[rgb(var(--border))]/25 animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-[rgb(var(--border))]/25 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocsSilhouette({ tone }: { tone: ToneTokens }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-2xl surface shadow-soft p-5 space-y-3">
          <div className={`h-9 w-9 rounded-xl ${tone.bgSoft} animate-pulse`} />
          <div className="h-4 w-2/3 rounded bg-[rgb(var(--border))]/40 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-[rgb(var(--border))]/25 animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-[rgb(var(--border))]/25 animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-[rgb(var(--border))]/25 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CircuitSilhouette({ tone }: { tone: ToneTokens }) {
  return (
    <div className="rounded-3xl surface shadow-soft p-6 space-y-4">
      <div className={`h-10 w-10 rounded-xl ${tone.bgSoft} animate-pulse`} />
      <div className="h-6 w-1/2 rounded bg-[rgb(var(--border))]/40 animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-[rgb(var(--border))]/25 animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-[rgb(var(--border))]/25 animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-[rgb(var(--border))]/25 animate-pulse" />
      </div>
    </div>
  );
}
