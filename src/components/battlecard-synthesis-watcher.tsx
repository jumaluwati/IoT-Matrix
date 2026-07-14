"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Loader2, RefreshCw, Sparkles, Zap } from "lucide-react";

/**
 * Client-side companion to the Quick Read fallback. When a background Circuit
 * synthesis is in flight (or kicks off after the user clicks "Refresh now"),
 * this component:
 *   - polls `/api/battlecard/status` every 5s
 *   - shows live elapsed time
 *   - auto-reloads the page (router.refresh) the moment the cache lands
 *
 * Lives in the same UI as the Quick Read fallback strip. Render conditionally
 * from the server when `synthesisStatus === "circuit-cooldown" || initialInFlight`.
 */
interface Props {
  competitorSlug: string;
  productSlug: string;
  /** Whether a synthesis was already running at server-render time. */
  initialInFlight?: boolean;
  /** Tone — `cooldown` shows amber, `pending` shows cisco-blue. */
  tone?: "cooldown" | "pending";
  /** Estimated total wait the user should expect. */
  estimateSec?: number;
}

export function BattlecardSynthesisWatcher({
  competitorSlug,
  productSlug,
  initialInFlight = false,
  tone = "pending",
  estimateSec = 120
}: Props) {
  const [inFlight, setInFlight] = useState(initialInFlight);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tick the elapsed counter every second so the user sees something happening.
  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsedSec(Math.round((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Poll the status endpoint every 5s. When inFlight transitions false AND
  // we have a fresh cache entry (ageMs < 60s), force a hard reload so the
  // server re-renders with the new battlecard.
  useEffect(() => {
    let cancelled = false;
    let prevInFlight = initialInFlight;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/battlecard/status?competitor=${encodeURIComponent(competitorSlug)}&product=${encodeURIComponent(productSlug)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          inFlight: boolean;
          ageMs: number | null;
          lastError: { message: string; ageSec: number } | null;
        };
        if (cancelled) return;
        setInFlight(data.inFlight);
        if (data.lastError && data.lastError.ageSec < 30) {
          setErrorMsg(data.lastError.message);
        } else {
          setErrorMsg(null);
        }
        // Transitioned from in-flight → done AND cache landed recently → reload.
        const justFinished = prevInFlight && !data.inFlight;
        const cacheIsFresh = typeof data.ageMs === "number" && data.ageMs < 60_000;
        if (justFinished && cacheIsFresh) {
          window.location.reload();
        }
        prevInFlight = data.inFlight;
      } catch {
        /* network blip — keep polling */
      }
    };
    poll(); // initial
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [competitorSlug, productSlug, initialInFlight]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/battlecard/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitor: competitorSlug, product: productSlug })
      });
      if (res.status === 503) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(data.error ?? "Cisco Circuit not configured");
        return;
      }
      if (!res.ok) {
        setErrorMsg(`Refresh failed (${res.status})`);
        return;
      }
      setInFlight(true);
    } finally {
      setRefreshing(false);
    }
  }, [competitorSlug, productSlug]);

  const isCooldown = tone === "cooldown";
  const accent = isCooldown
    ? {
        bg: "bg-amber-500/10",
        ring: "ring-amber-500/30",
        text: "text-amber-700 dark:text-amber-300",
        bar: "bg-amber-500"
      }
    : {
        bg: "bg-cisco-500/10",
        ring: "ring-cisco-500/30",
        text: "text-cisco-700 dark:text-cisco-300",
        bar: "bg-cisco-500"
      };
  const pct = Math.min(95, Math.floor((elapsedSec / estimateSec) * 95));

  return (
    <div className={`rounded-2xl ring-1 ${accent.ring} ${accent.bg} p-4 space-y-3`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${accent.ring} bg-[rgb(var(--bg-elev))] ${accent.text}`}>
          {inFlight ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-semibold tracking-tight ${accent.text}`}>
              {inFlight ? "Synthesizing battlecard in the background…" : "Battlecard synthesis idle"}
            </span>
            {inFlight && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/5 px-2 py-0.5 text-[10.5px] font-mono uppercase tracking-wider text-[rgb(var(--fg-muted))]">
                <Clock className="h-2.5 w-2.5" />
                {elapsedSec}s
              </span>
            )}
          </div>
          <p className="mt-1 text-[12.5px] text-[rgb(var(--fg-muted))] leading-relaxed">
            {inFlight ? (
              <>Cisco Circuit takes ~{estimateSec}s on a cold pair. This page will auto-refresh the moment the card lands &mdash; keep browsing in the meantime.</>
            ) : errorMsg ? (
              <>Last attempt failed: <span className="font-mono">{errorMsg}</span>. Click <em>Refresh now</em> to retry.</>
            ) : (
              <>No synthesis running. Use <em>Refresh now</em> to kick one off.</>
            )}
          </p>
          {inFlight && (
            <div className="mt-3 h-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
              <div className={`h-full ${accent.bar} transition-[width] duration-1000 ease-out`} style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing || inFlight}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium ring-1 transition-colors ${
            refreshing || inFlight
              ? "ring-[rgb(var(--border))] text-[rgb(var(--fg-muted))] cursor-not-allowed"
              : `ring-cisco-500/40 ${accent.text} bg-cisco-500/5 hover:bg-cisco-500/15`
          }`}
        >
          {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {refreshing ? "Kicking off…" : "Refresh now"}
        </button>
      </div>
    </div>
  );
}

/**
 * Read-only stale indicator. Render this on full battlecard pages (not the
 * Quick Read fallback) when the cache is fresh but >24h old AND a background
 * refresh has been queued. Tells the user "you're seeing the cached card from
 * 3 days ago, fresh one is in flight, reload when ready".
 *
 * Intentionally subtle — sales engineers don't want a big banner during a demo
 * if the cached card is perfectly usable.
 */
export function BattlecardStaleIndicator({
  competitorSlug,
  productSlug,
  ageHours
}: {
  competitorSlug: string;
  productSlug: string;
  ageHours: number;
}) {
  const [inFlight, setInFlight] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let prevInFlight = false;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/battlecard/status?competitor=${encodeURIComponent(competitorSlug)}&product=${encodeURIComponent(productSlug)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { inFlight: boolean; ageMs: number | null };
        if (cancelled) return;
        setInFlight(data.inFlight);
        // Auto-reload when a refresh finishes so the user sees the new card
        // without clicking anything.
        if (prevInFlight && !data.inFlight && data.ageMs && data.ageMs < 60_000) {
          window.location.reload();
        }
        prevInFlight = data.inFlight;
      } catch {
        /* ignore */
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [competitorSlug, productSlug]);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 ring-1 ring-amber-500/30 text-amber-700 dark:text-amber-300 px-2.5 py-1 text-[11px] font-medium">
      {inFlight ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
      {inFlight
        ? "Refreshing in background"
        : `Cached ${ageHours}h ago · refreshing soon`}
    </span>
  );
}
