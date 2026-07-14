"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/**
 * "Refresh intel" button for the competitor detail page. POSTs to the
 * competitor-intel refresh route (which re-pulls from Cisco RAG/Docs with the
 * cache bypassed), then calls router.refresh() so the streamed intel section
 * re-renders with the fresh answer. Honest about failure: surfaces a short
 * message when the backend isn't configured.
 */
export function CompetitorIntelRefresh({ competitorSlug }: { competitorSlug: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onRefresh() {
    if (state === "loading") return;
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/competitor-intel/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitor: competitorSlug })
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setState("error");
        setMessage(body.error ?? `Refresh failed (${res.status}).`);
        return;
      }
      setState("idle");
      router.refresh();
    } catch (err) {
      setState("error");
      setMessage((err as Error).message || "Refresh failed.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-[11px] text-amber-700 dark:text-amber-300 max-w-[16rem] leading-snug">
          {message}
        </span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={state === "loading"}
        className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${state === "loading" ? "animate-spin" : ""}`} />
        {state === "loading" ? "Refreshing…" : "Refresh intel"}
      </button>
    </div>
  );
}
