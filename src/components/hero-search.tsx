"use client";

import Link from "next/link";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUpRight, ArrowLeftRight, Sparkles } from "lucide-react";
import { COMPETITORS } from "@/data/competitors";
import { CISCO_LIST } from "@/data/cisco-iiot";
import { cn } from "@/lib/utils";

interface SearchHit {
  competitorSlug: string;
  competitorName: string;
  productSlug: string;
  productName: string;
  category: string;
}

type SmartMatch =
  | {
      kind: "compete";
      competitorSlug: string;
      competitorName: string;
      productSlug: string;
      productName: string;
      ciscoSlug: string;
      ciscoName: string;
    }
  | {
      kind: "cisco-vs-cisco";
      aSlug: string;
      aName: string;
      bSlug: string;
      bName: string;
    };

const ALL_HITS: SearchHit[] = COMPETITORS.flatMap((c) =>
  c.products.map((p) => ({
    competitorSlug: c.slug,
    competitorName: c.name,
    productSlug: p.slug,
    productName: p.name,
    category: p.category
  }))
);

/**
 * Token-overlap score: count distinct query tokens that appear in `haystack`.
 * Cheap, deterministic, and handles model-number fragments well ("ar502gw" → "AR502GW-Lc-D-H").
 */
function scoreMatch(needle: string, haystack: string): number {
  const tokens = needle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return 0;
  const hay = haystack.toLowerCase();
  return tokens.reduce((acc, t) => (hay.includes(t) ? acc + t.length : acc), 0);
}

function findCompetitorProductByName(text: string) {
  let best: { hit: SearchHit; score: number } | null = null;
  for (const h of ALL_HITS) {
    const s = scoreMatch(text, `${h.competitorName} ${h.productName} ${h.category}`);
    if (s > 0 && (!best || s > best.score)) best = { hit: h, score: s };
  }
  return best && best.score >= 3 ? best.hit : null;
}

function findCiscoProductByName(text: string) {
  let best: { cisco: (typeof CISCO_LIST)[number]; score: number } | null = null;
  for (const c of CISCO_LIST) {
    const s = scoreMatch(text, `${c.name} ${c.slug} ${c.family ?? ""} ${c.category}`);
    if (s > 0 && (!best || s > best.score)) best = { cisco: c, score: s };
  }
  return best && best.score >= 3 ? best.cisco : null;
}

/**
 * Detects natural-language compare phrasings and resolves them to either a
 * competitor-vs-Cisco pair (→ /compare) or a Cisco-vs-Cisco pair (→
 * /portfolio/compare). Handles: "compare X with Y", "X vs Y", "X versus Y",
 * "X against Y".
 */
function smartParseQuery(raw: string): SmartMatch | null {
  const q = raw.toLowerCase().trim();
  // Need at least one connector word
  const m = q.match(/^(?:compare\s+)?(.+?)\s+(?:vs\.?|versus|with|against)\s+(.+)$/i);
  if (!m) return null;
  const a = m[1].trim();
  const b = m[2].trim();
  if (a.length < 2 || b.length < 2) return null;

  const aComp = findCompetitorProductByName(a);
  const bComp = findCompetitorProductByName(b);
  const aCisco = findCiscoProductByName(a);
  const bCisco = findCiscoProductByName(b);

  // Competitor-vs-Cisco takes precedence — it's the primary compete flow.
  if (aComp && bCisco) {
    return {
      kind: "compete",
      competitorSlug: aComp.competitorSlug,
      competitorName: aComp.competitorName,
      productSlug: aComp.productSlug,
      productName: aComp.productName,
      ciscoSlug: bCisco.slug,
      ciscoName: bCisco.name
    };
  }
  if (bComp && aCisco) {
    return {
      kind: "compete",
      competitorSlug: bComp.competitorSlug,
      competitorName: bComp.competitorName,
      productSlug: bComp.productSlug,
      productName: bComp.productName,
      ciscoSlug: aCisco.slug,
      ciscoName: aCisco.name
    };
  }
  // Both sides resolve to distinct Cisco SKUs → Cisco-vs-Cisco comparison.
  if (aCisco && bCisco && aCisco.slug !== bCisco.slug) {
    return {
      kind: "cisco-vs-cisco",
      aSlug: aCisco.slug,
      aName: aCisco.name,
      bSlug: bCisco.slug,
      bName: bCisco.name
    };
  }
  return null;
}

export function HeroSearch() {
  const [q, setQ] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const smartMatch = React.useMemo(() => (q.trim() ? smartParseQuery(q) : null), [q]);

  const hits = React.useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    return ALL_HITS.filter(
      (h) =>
        h.competitorName.toLowerCase().includes(needle) ||
        h.productName.toLowerCase().includes(needle) ||
        h.category.toLowerCase().includes(needle)
    ).slice(0, 6);
  }, [q]);

  const showDropdown = focused && (smartMatch || hits.length > 0);

  return (
    <div className="relative w-full max-w-2xl mx-auto isolate z-50">
      <div
        className={cn(
          "glass flex items-center gap-3 rounded-full pl-5 pr-2 py-2 transition-all duration-300",
          focused ? "shadow-glow" : "shadow-soft"
        )}
      >
        <Search className="h-4 w-4 text-[rgb(var(--fg-muted))]" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search a product, or try 'compare Huawei AR502GW with IE3500'"
          className="flex-1 bg-transparent outline-none text-sm md:text-base placeholder:text-[rgb(var(--fg-muted))]"
        />
        <kbd className="hidden md:inline-flex h-7 items-center gap-1 rounded-full border border-[rgb(var(--border))] px-2 text-[10px] text-[rgb(var(--fg-muted))] font-mono">
          ⌘K
        </kbd>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            // Fully opaque surface — .glass is bg-white/70 which lets the
            // competitor grid below bleed through the dropdown items.
            className="absolute left-0 right-0 mt-3 rounded-2xl overflow-hidden z-50 shadow-2xl bg-[rgb(var(--bg-elev))] border border-[rgb(var(--border))] ring-1 ring-black/5 dark:ring-white/10"
          >
            {smartMatch && smartMatch.kind === "compete" && (
              <Link
                href={`/compare/${smartMatch.competitorSlug}/${smartMatch.productSlug}?cisco=${smartMatch.ciscoSlug}`}
                className="block px-5 py-3 bg-gradient-to-r from-cisco-500/10 via-indigo-500/5 to-transparent hover:from-cisco-500/15 border-b border-[rgb(var(--border))]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cisco-500/15 text-cisco-600 dark:text-cisco-300 ring-1 ring-cisco-500/30 shrink-0">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-cisco-600 dark:text-cisco-300 font-mono mb-0.5">
                      Smart compare
                    </div>
                    <div className="text-sm font-medium truncate">
                      {smartMatch.competitorName} {smartMatch.productName}{" "}
                      <span className="text-[rgb(var(--fg-muted))] mx-1">vs</span> Cisco{" "}
                      {smartMatch.ciscoName}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-cisco-600 dark:text-cisco-300 shrink-0" />
                </div>
              </Link>
            )}
            {smartMatch && smartMatch.kind === "cisco-vs-cisco" && (
              <Link
                href={`/portfolio/compare?a=${smartMatch.aSlug}&b=${smartMatch.bSlug}`}
                className="block px-5 py-3 bg-gradient-to-r from-cisco-500/10 via-indigo-500/5 to-transparent hover:from-cisco-500/15 border-b border-[rgb(var(--border))]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cisco-500/15 text-cisco-600 dark:text-cisco-300 ring-1 ring-cisco-500/30 shrink-0">
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-cisco-600 dark:text-cisco-300 font-mono mb-0.5">
                      Cisco vs Cisco
                    </div>
                    <div className="text-sm font-medium truncate">
                      Cisco {smartMatch.aName}{" "}
                      <span className="text-[rgb(var(--fg-muted))] mx-1">vs</span> Cisco{" "}
                      {smartMatch.bName}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-cisco-600 dark:text-cisco-300 shrink-0" />
                </div>
              </Link>
            )}
            {hits.length > 0 && (
              <ul className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {hits.map((h) => (
                  <li key={`${h.competitorSlug}:${h.productSlug}`}>
                    <Link
                      href={`/compare/${h.competitorSlug}/${h.productSlug}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {h.competitorName} · {h.productName}
                        </div>
                        <div className="text-xs text-[rgb(var(--fg-muted))]">{h.category}</div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[rgb(var(--fg-muted))]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
