"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Factory,
  Gift,
  Infinity as InfinityIcon,
  Layers,
  Network,
  Package,
  Repeat,
  Settings,
  ShieldCheck,
  Sparkles,
  Zap,
  type LucideIcon
} from "lucide-react";
import {
  parseLicenseTiers,
  parseReferenceLinks,
  type LicenseTier as ParsedTier,
  type ParsedReference
} from "@/lib/mcp/cisco-rag-parser";

interface LicenseTiersProps {
  productName: string;
  /** Raw markdown answer from Cisco RAG. */
  answer: string;
  /** Optional flat list of source URLs from the RAG response. */
  sources?: string[];
  /** Override the "via Cisco RAG · {productName}" footer text. */
  sourceLabel?: string;
}

type Kind = ParsedTier["kind"];

/** Tier color tokens. Subtle by default; the *selected* tier gets the full ring. */
const TIER_STYLES: Record<
  Kind,
  {
    badge: string;
    ring: string;
    pill: string;
    pillDot: string;
    bg: string;
    bgSolid: string;
    chipIcon: string;
  }
> = {
  essentials: {
    badge: "text-slate-700 dark:text-slate-200",
    ring: "ring-slate-400/60",
    pill: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200",
    pillDot: "bg-slate-500",
    bg: "from-slate-500/10 via-transparent to-transparent",
    bgSolid: "bg-slate-500/[0.06]",
    chipIcon: "text-slate-600 dark:text-slate-300"
  },
  advantage: {
    badge: "text-cisco-700 dark:text-cisco-300",
    ring: "ring-cisco-500/60",
    pill: "bg-cisco-500/10 text-cisco-700 dark:text-cisco-300",
    pillDot: "bg-cisco-500",
    bg: "from-cisco-500/15 via-cisco-500/5 to-transparent",
    bgSolid: "bg-cisco-500/[0.08]",
    chipIcon: "text-cisco-600 dark:text-cisco-300"
  },
  "dna-essentials": {
    badge: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/60",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    pillDot: "bg-amber-500",
    bg: "from-amber-500/15 via-amber-500/5 to-transparent",
    bgSolid: "bg-amber-500/[0.08]",
    chipIcon: "text-amber-700 dark:text-amber-300"
  },
  "dna-advantage": {
    badge: "text-purple-700 dark:text-purple-300",
    ring: "ring-purple-500/60",
    pill: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
    pillDot: "bg-purple-500",
    bg: "from-purple-500/15 via-purple-500/5 to-transparent",
    bgSolid: "bg-purple-500/[0.08]",
    chipIcon: "text-purple-700 dark:text-purple-300"
  },
  other: {
    badge: "text-[rgb(var(--fg-muted))]",
    ring: "ring-[rgb(var(--border))]",
    pill: "bg-black/5 dark:bg-white/5 text-[rgb(var(--fg))]",
    pillDot: "bg-[rgb(var(--fg-muted))]",
    bg: "from-black/[0.02] via-transparent to-transparent",
    bgSolid: "bg-black/[0.03] dark:bg-white/[0.03]",
    chipIcon: "text-[rgb(var(--fg-muted))]"
  }
};

/**
 * Renders Cisco license tier data as an interactive tier-selector.
 *
 * Layout (new):
 *   1. Optional intro — trimmed RAG intro line.
 *   2. Two FAMILY GROUP cards side-by-side: "Network License (perpetual,
 *      included)" and "Cisco DNA License (subscription, add-on)". Each
 *      contains a short blurb + the tier toggle buttons that belong to it.
 *      This makes the Network vs DNA distinction obvious instead of leaving
 *      sales engineers to wonder why there are two families.
 *   3. SELECTED TIER PANEL — name, qualifier, baseline subtitle ("Adds N
 *      capabilities on top of Network Essentials" when the RAG says so),
 *      feature cards in a tight grid grouped by category, and a Footer Notes
 *      banner for bonus entitlements / disclaimers that aren't features.
 *   4. Sources block (Cisco RAG references + flat sources prop).
 */
export function LicenseTiers({ productName, answer, sources, sourceLabel }: LicenseTiersProps) {
  // Parse tier data + lift references from the same markdown so we can render
  // a single Sources block at the bottom (parseReferenceLinks works on the
  // same `**Reference Document Links:**` trailer block that Cisco Docs/RAG returns).
  const parsedTiers = useMemo(() => parseLicenseTiers(answer), [answer]);
  const parsedRefs = useMemo(() => parseReferenceLinks(answer), [answer]);

  // Stable initial selection: prefer Essentials (everyone has it) → Advantage → DNA →
  // first available. Falls back gracefully when the RAG returns a smaller tier set.
  const initialIdx = useMemo(() => {
    const order: Kind[] = ["essentials", "advantage", "dna-essentials", "dna-advantage", "other"];
    for (const k of order) {
      const i = parsedTiers.tiers.findIndex((t) => t.kind === k);
      if (i >= 0) return i;
    }
    return 0;
  }, [parsedTiers]);
  const [selectedIdx, setSelectedIdx] = useState(initialIdx);

  const refs: ParsedReference[] = [...parsedRefs];
  if (sources && sources.length > 0) {
    for (const s of sources) {
      if (s && !refs.some((r) => r.url === s || r.title === s)) {
        refs.push({ index: refs.length + 1, title: s, url: s });
      }
    }
  }

  if (parsedTiers.tiers.length === 0) {
    // Defensive: if parsing returned nothing usable, render nothing rather
    // than an empty section. The page already shows other Cisco content.
    return null;
  }

  const tiers = parsedTiers.tiers;
  const selected = tiers[Math.min(selectedIdx, tiers.length - 1)];
  const sel = TIER_STYLES[selected.kind];

  // Split tiers into the two license families so the UI can explain WHY there
  // are two groups instead of dumping 4 buttons in one row.
  const families = buildFamilies(tiers);

  // Pre-classify features once per selected tier. Lines with a "Category:"
  // prefix get rendered in a clean 2-column row (CATEGORY | values). Lines
  // without a prefix (common in DNA Advantage: "LAN Automation for…", "Device
  // 360", "NBAR2") are collected into a synthetic "Capabilities" bucket so
  // they don't look like orphan rows.
  const featureRows: FeatureRow[] = [];
  const looseLines: string[] = [];
  for (const f of selected.features) {
    const parsed = parseFeatureLine(f);
    if (parsed.category) {
      featureRows.push({ category: parsed.category, body: parsed.body, Icon: parsed.Icon });
    } else {
      looseLines.push(parsed.body);
    }
  }
  if (looseLines.length > 0) {
    featureRows.push({
      category: "Capabilities",
      body: looseLines.join(" · "),
      Icon: iconForCategory("capabilities"),
      isLoose: true
    });
  }

  // Detect "free at no cost" entitlements in the notes so we can render them
  // as a prominent freebie callout instead of a quiet footer line. The Cisco
  // IE3500H/IE9300 + Network Advantage promo bundles a Cyber Vision + SEA
  // Advantage license at no extra cost — this is a SALES-CRITICAL value-add
  // sellers should never miss. Same logic catches future "Bundled XYZ at no
  // additional cost" entitlements without needing a hardcoded list.
  const freebies = selected.notes.filter((n) => /\b(at no (extra|additional) cost|no additional charge|complimentary|bundled at no)\b/i.test(n));
  const otherNotes = selected.notes.filter((n) => !freebies.includes(n));

  return (
    <div className="space-y-5">
      {/* FAMILY GROUPS — the Network vs DNA distinction is the part SEs are
          most often confused by, so it gets explicit headers + tier toggles.
          Intentionally NO blurb paragraph: family name + one-line pill carry
          all the information without the wall of text the previous version had. */}
      <div
        role="tablist"
        aria-label="License tiers"
        className={[
          "grid gap-3",
          families.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
        ].join(" ")}
      >
        {families.map((fam) => {
          const FamIcon = fam.icon;
          return (
            <div
              key={fam.id}
              className="rounded-2xl surface ring-1 ring-[rgb(var(--border))] p-3.5 md:p-4"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg ${fam.accentBg} ${fam.accentText}`}
                >
                  <FamIcon className="h-4 w-4" />
                </div>
                <span className="font-semibold tracking-tight text-[rgb(var(--fg))] text-[15px]">
                  {fam.title}
                </span>
                <span
                  className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${fam.pillClass}`}
                >
                  {fam.pillIcon && <fam.pillIcon className="h-2.5 w-2.5" />}
                  {fam.pillLabel}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {fam.tierIndices.map((i) => {
                  const t = tiers[i];
                  const s = TIER_STYLES[t.kind];
                  const active = i === selectedIdx;
                  // Show a small "+ Free" pip on tiers that bundle no-cost
                  // entitlements (Cyber Vision + SEA promo, etc.) so the
                  // value-add is visible BEFORE the user clicks the tier.
                  const hasFreebie = t.notes.some((n) =>
                    /\b(at no (extra|additional) cost|no additional charge|complimentary|bundled at no)\b/i.test(n)
                  );
                  return (
                    <button
                      key={`${t.name}-${i}`}
                      role="tab"
                      aria-selected={active}
                      aria-controls="license-tier-panel"
                      onClick={() => setSelectedIdx(i)}
                      className={[
                        "relative inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium tracking-tight transition-all duration-200",
                        active
                          ? `ring-2 ${s.ring} ${s.bgSolid} ${s.badge}`
                          : "ring-1 ring-[rgb(var(--border))] text-[rgb(var(--fg))] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                      ].join(" ")}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.pillDot}`} />
                      {shortTierLabel(t.name)}
                      {hasFreebie && (
                        <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider">
                          <Gift className="h-2.5 w-2.5" />
                          Free
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* SELECTED TIER PANEL — flat 2-column category list (no per-feature
          card chrome). Renders dramatically more compact than the previous
          chunky feature-card grid. */}
      <div
        id="license-tier-panel"
        role="tabpanel"
        className={[
          "relative rounded-2xl surface shadow-soft overflow-hidden ring-1",
          sel.ring
        ].join(" ")}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${sel.bg}`}
        />

        {/* Header strip */}
        <div className="flex items-center justify-between gap-4 flex-wrap px-5 md:px-6 pt-5 pb-4 border-b border-[rgb(var(--border))]/50">
          <div className="min-w-0">
            <h3 className="text-lg md:text-xl font-semibold tracking-tight">{selected.name}</h3>
            <div className="mt-0.5 text-[12.5px] text-[rgb(var(--fg-muted))]">
              {selected.qualifier ?? ""}
              {selected.baseline && (
                <>
                  {selected.qualifier && <span className="mx-1.5 opacity-50">·</span>}
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className={`h-3 w-3 ${sel.chipIcon}`} />
                    adds {selected.features.length} on top of {selected.baseline}
                  </span>
                </>
              )}
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${sel.pill}`}
          >
            <CheckCircle2 className="h-3 w-3" />
            {selected.features.length} capabilit{selected.features.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {/* FREEBIE CALLOUT — surface "no extra cost" entitlements (Cyber Vision +
            SEA license bundled with Network Advantage, etc.) as a high-contrast
            promo strip right under the header. Sales-critical info; hiding it
            in a footer note loses deals. */}
        {freebies.length > 0 && (
          <div className="mx-5 md:mx-6 mt-4 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/[0.08] via-emerald-500/[0.05] to-transparent p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                <Gift className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300 font-semibold">
                    Included at no extra cost
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[9.5px] font-mono uppercase tracking-wider">
                    Free
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {freebies.map((n, i) => (
                    <li
                      key={`${selected.name}-free-${i}`}
                      className="text-[13px] text-[rgb(var(--fg))] leading-relaxed"
                    >
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Feature rows — 2-column flat list: CATEGORY | comma-separated body */}
        {featureRows.length > 0 ? (
          <ul className="divide-y divide-[rgb(var(--border))]/40">
            {featureRows.map((row, i) => (
              <li
                key={`${selected.name}-row-${i}`}
                className="grid grid-cols-[140px_1fr] md:grid-cols-[180px_1fr] gap-4 md:gap-6 px-5 md:px-6 py-3.5"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <row.Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${sel.chipIcon}`} />
                  <span
                    className={`text-[10.5px] font-mono font-semibold uppercase tracking-[0.12em] text-[rgb(var(--fg))] leading-snug break-words`}
                  >
                    {row.category}
                  </span>
                </div>
                <div className="text-[13px] leading-relaxed text-[rgb(var(--fg-muted))] break-words">
                  {row.body}
                </div>
              </li>
            ))}
          </ul>
        ) : selected.baseline ? (
          <div className="px-5 md:px-6 py-5 text-[13px] text-[rgb(var(--fg-muted))]">
            All capabilities from{" "}
            <span className="font-semibold text-[rgb(var(--fg))]">{selected.baseline}</span> are
            included. See the Notes below for any bonus entitlements specific to this tier.
          </div>
        ) : null}

        {otherNotes.length > 0 && (
          <div className="border-t border-[rgb(var(--border))]/50 bg-black/[0.02] dark:bg-white/[0.02] px-5 md:px-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className={`h-3.5 w-3.5 ${sel.chipIcon}`} />
              <span
                className={`text-[10.5px] font-mono uppercase tracking-[0.12em] ${sel.badge}`}
              >
                Bonus &amp; notes
              </span>
            </div>
            <ul className="space-y-1.5">
              {otherNotes.map((n, i) => (
                <li
                  key={`${selected.name}-note-${i}`}
                  className="text-[12.5px] text-[rgb(var(--fg-muted))] leading-relaxed"
                >
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {refs.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-[rgb(var(--fg-muted))]">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em]">Sources</span>
          </span>
          {refs.map((r) =>
            r.url ? (
              <a
                key={`${r.url || r.title}-${r.index}`}
                href={r.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[rgb(var(--fg))] hover:text-cisco-600 dark:hover:text-cisco-300 underline underline-offset-2 decoration-[rgb(var(--border))] hover:decoration-current"
              >
                {r.title}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            ) : (
              <span key={`${r.title}-${r.index}`} className="inline-flex items-center gap-1">
                {r.title}
              </span>
            )
          )}
          <span className="ml-auto font-mono text-[10.5px] opacity-70">
            {sourceLabel ?? `via Cisco RAG · ${productName}`}
          </span>
        </div>
      )}
    </div>
  );
}

interface FeatureRow {
  category: string;
  body: string;
  Icon: LucideIcon;
  isLoose?: boolean;
}

/**
 * Best-effort split of a feature line into `category: body` plus an icon.
 * Handles all three RAG/Docs shapes:
 *   "Security: 802.1x, DHCP snooping"          → cat="Security", body="802.1x..."
 *   "**Security:** 802.1x, DHCP snooping"      → cat="Security", body="802.1x..."
 *   "**Switching:** IEEE 802.1Q, 802.1w"       → cat="Switching", body="IEEE 802.1Q..."
 *   "Layer 2 switching: 802.1Q, RSTP/MSTP"     → cat="Layer 2 switching", body="..."
 *   "LAN Automation for SDA underlay"          → cat=undefined, body=as-is
 * The bold-wrapped form is what Cisco RAG returns; the bare form is what the
 * parser produces after stripping. Both should yield the same rendered row.
 */
function parseFeatureLine(line: string): { category?: string; body: string; Icon: LucideIcon } {
  // Strip any surviving bold-wrapped category at the start (defensive — the
  // parser already does this, but a synthesized cache entry or a direct
  // upstream change could deliver bold markers unchanged).
  const stripped = line
    .replace(/^\*\*\s*([^*]+?)\s*\*\*\s*[:—–-]?\s*/, (_full, cat: string) => {
      const trimmed = cat.trim().replace(/:\s*$/, "");
      return trimmed ? `${trimmed}: ` : "";
    })
    // Remove any stray ** that survived inside the body so they never reach the
    // DOM as visible asterisks.
    .replace(/\*\*/g, "");
  const m = stripped.match(/^([A-Z][\w \-/()&+]{2,40}):\s+(.+)$/);
  const category = m?.[1]?.trim();
  const body = (m ? m[2] : stripped).trim();
  return { category, body, Icon: iconForCategory(category ?? body) };
}

function iconForCategory(text: string): LucideIcon {
  const t = text.toLowerCase();
  if (/secur|trustsec|macsec|802\.1x|firewall|encryption|ise|dot1x/.test(t)) return ShieldCheck;
  if (/industrial|profinet|cip|modbus|opc|iec\s*61850|ptp|tsn/.test(t)) return Factory;
  if (/redund|prp|hsr|rep|stp|hsrp|vrrp|mrp|failover/.test(t)) return Repeat;
  if (/route|rout|ospf|bgp|isis|eigrp|vrf|sd-?wan|sd-?access|fabric/.test(t)) return Network;
  if (/manag|orchestrat|catalyst center|dna center|provision|automation|telem|monitor|analytics/.test(t))
    return Settings;
  if (/switch|layer 2|vlan|stp|trunk|access port|spanning/.test(t)) return Layers;
  if (/iox|container|edge\s+app|app\s+host|docker|cyber\s+vision/.test(t)) return Package;
  if (/perform|throughput|latency|jitter|delay|qos/.test(t)) return Zap;
  if (/visib|insight|health|client/.test(t)) return Activity;
  return CheckCircle2;
}

/**
 * Compress a long tier name into something that fits inside a 2-column toggle
 * button. The family card already says "Network" or "Cisco DNA", so we just
 * need the trailing word(s) like "Essentials" or "Advantage".
 */
function shortTierLabel(name: string): string {
  return name
    .replace(/^Cisco\s+DNA\s+/i, "")
    .replace(/^Cisco\s+/i, "")
    .replace(/^Network\s+/i, "")
    .trim() || name;
}

interface Family {
  id: "network" | "dna" | "other";
  title: string;
  blurb: string;
  pillLabel: string;
  pillClass: string;
  pillIcon?: LucideIcon;
  icon: LucideIcon;
  accentBg: string;
  accentText: string;
  tierIndices: number[];
}

/**
 * Group parsed tiers into the two Cisco license families so the UI can
 * explain the Network-vs-DNA distinction up front instead of leaving it
 * implicit. Order: Network first (the perpetual baseline), then DNA (the
 * subscription add-on). Anything that can't be classified lands in an "Other"
 * group at the end so we never silently drop tiers.
 */
function buildFamilies(tiers: ParsedTier[]): Family[] {
  const networkIdx: number[] = [];
  const dnaIdx: number[] = [];
  const otherIdx: number[] = [];
  tiers.forEach((t, i) => {
    if (t.kind === "essentials" || t.kind === "advantage") networkIdx.push(i);
    else if (t.kind === "dna-essentials" || t.kind === "dna-advantage") dnaIdx.push(i);
    else otherIdx.push(i);
  });

  const families: Family[] = [];
  if (networkIdx.length > 0) {
    families.push({
      id: "network",
      title: "Network License",
      blurb:
        "Perpetual switching, routing and security stack — installed at manufacture and bundled with the hardware.",
      pillLabel: "Perpetual · Included",
      pillClass: "bg-cisco-500/10 text-cisco-700 dark:text-cisco-300",
      pillIcon: InfinityIcon,
      icon: Network,
      accentBg: "bg-cisco-500/10",
      accentText: "text-cisco-700 dark:text-cisco-300",
      tierIndices: networkIdx
    });
  }
  if (dnaIdx.length > 0) {
    families.push({
      id: "dna",
      title: "Cisco DNA License",
      blurb:
        "Term-based subscription that unlocks SD-Access fabric, advanced automation, analytics and assurance — sold on top of the Network license.",
      pillLabel: "Subscription · Add-on",
      pillClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
      pillIcon: Sparkles,
      icon: Settings,
      accentBg: "bg-purple-500/10",
      accentText: "text-purple-700 dark:text-purple-300",
      tierIndices: dnaIdx
    });
  }
  if (otherIdx.length > 0) {
    families.push({
      id: "other",
      title: "Other tiers",
      blurb: "Specialty tiers returned by Cisco licensing for this product.",
      pillLabel: "Specialty",
      pillClass: "bg-black/5 dark:bg-white/5 text-[rgb(var(--fg))]",
      icon: Package,
      accentBg: "bg-black/5 dark:bg-white/5",
      accentText: "text-[rgb(var(--fg-muted))]",
      tierIndices: otherIdx
    });
  }
  return families;
}
