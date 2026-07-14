import {
  Activity,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Layers,
  Lock,
  Network,
  Package,
  Server,
  Settings,
  ShieldAlert,
  Sparkles,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { parseDocsAnswer, type DocsHighlight, type DocsReference } from "@/lib/mcp/cisco-docs";

type Tone = "cisco" | "caution";

interface DocsHighlightsProps {
  productName: string;
  answer: string;
  /** Optional `sources` returned by the API (often empty since refs are inline). */
  sources?: string[];
  /** Limit number of cards rendered. Extra get folded into the outro paragraph. */
  maxCards?: number;
  /** Visual treatment. `caution` swaps cisco-blue accents for amber so the section
   *  reads as "watch-out" / "competitor gap" content instead of "Cisco capability". */
  tone?: Tone;
  /** Override the trailing meta text. Defaults to `via Cisco Docs · {productName}`. */
  sourceLabel?: string;
}

const TONE_STYLES: Record<Tone, {
  iconWrap: string;
  iconText: string;
  eyebrow: string;
  hoverText: string;
  underlineHover: string;
  iconHover: string;
}> = {
  cisco: {
    iconWrap: "bg-cisco-500/10 ring-cisco-500/30",
    iconText: "text-cisco-600 dark:text-cisco-300",
    eyebrow: "text-cisco-600 dark:text-cisco-300",
    hoverText: "hover:text-cisco-600 dark:hover:text-cisco-300",
    underlineHover: "group-hover:decoration-current",
    iconHover: "group-hover:text-cisco-500"
  },
  caution: {
    iconWrap: "bg-amber-500/10 ring-amber-500/30",
    iconText: "text-amber-700 dark:text-amber-300",
    eyebrow: "text-amber-700 dark:text-amber-300",
    hoverText: "hover:text-amber-700 dark:hover:text-amber-300",
    underlineHover: "group-hover:decoration-current",
    iconHover: "group-hover:text-amber-600"
  }
};

/**
 * Renders a Cisco Docs answer as distilled cards plus a clean Sources block.
 * Designed to feel like the rest of the battlecard page \u2014 no chat input, no
 * raw markdown blob, no "live AI" emphasis. Just supplementary content.
 */
export function DocsHighlights({
  productName,
  answer,
  sources,
  maxCards = 9,
  tone = "cisco",
  sourceLabel
}: DocsHighlightsProps) {
  const parsed = parseDocsAnswer(answer);
  const highlights = parsed.highlights.slice(0, maxCards);
  const overflowCount = Math.max(0, parsed.highlights.length - highlights.length);
  const t = TONE_STYLES[tone];

  // Merge parsed references with any top-level sources the API returned, dedup by url.
  const refs: DocsReference[] = [...parsed.references];
  if (sources && sources.length > 0) {
    for (const s of sources) {
      if (!refs.some((r) => r.title === s)) {
        refs.push({ index: refs.length + 1, title: s, url: "" });
      }
    }
  }

  if (!parsed.intro && highlights.length === 0 && !parsed.outro && refs.length === 0) {
    return null;
  }

  // Fallback: the upstream answer is just prose (no bullets) — render the
  // whole thing as a single elevated "summary" card so the section is never
  // visually empty.
  const hasNoCards = highlights.length === 0 && (parsed.intro || parsed.outro);
  if (hasNoCards) {
    const fallbackBody = [parsed.intro, parsed.outro].filter(Boolean).join(" ").trim();
    const FallbackIcon = tone === "caution" ? AlertTriangle : Sparkles;
    return (
      <div className="space-y-6">
        <article className="rounded-2xl surface shadow-soft p-5 md:p-6">
          <div
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 mb-3 ${t.iconWrap} ${t.iconText}`}
          >
            <FallbackIcon className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold tracking-tight mb-2">
            {tone === "caution" ? "What to watch for" : "Summary"}
          </h3>
          <p className="text-sm leading-relaxed text-[rgb(var(--fg-muted))]">{fallbackBody}</p>
        </article>
        {refs.length > 0 && <SourcesBlock refs={refs} tone={t} sourceLabel={sourceLabel ?? `via Cisco Docs · ${productName}`} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {parsed.intro && (
        <p className="text-sm md:text-base text-[rgb(var(--fg-muted))] leading-relaxed max-w-3xl">
          {parsed.intro}
        </p>
      )}

      {highlights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {highlights.map((h, i) => (
            <HighlightCard key={`${h.title}-${i}`} highlight={h} tone={tone} />
          ))}
          {overflowCount > 0 && (
            <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] p-5 flex items-center justify-center text-xs text-[rgb(var(--fg-muted))]">
              +{overflowCount} more in the full document
            </div>
          )}
        </div>
      )}

      {parsed.outro && (
        <p className="text-sm text-[rgb(var(--fg-muted))] leading-relaxed max-w-3xl">
          {parsed.outro}
        </p>
      )}

      {refs.length > 0 && (
        <SourcesBlock refs={refs} tone={t} sourceLabel={sourceLabel ?? `via Cisco Docs · ${productName}`} />
      )}
    </div>
  );
}

function SourcesBlock({
  refs,
  tone,
  sourceLabel
}: {
  refs: DocsReference[];
  tone: (typeof TONE_STYLES)[Tone];
  sourceLabel: string;
}) {
  return (
    <div className="rounded-2xl surface shadow-soft p-5 md:p-6">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className={`h-3.5 w-3.5 ${tone.iconText}`} />
        <span className={`text-[11px] uppercase tracking-[0.2em] font-mono ${tone.eyebrow}`}>
          Sources
        </span>
        <span className="text-[11px] text-[rgb(var(--fg-muted))] font-mono ml-auto">
          {sourceLabel}
        </span>
      </div>
      <ul className="space-y-2">
        {refs.map((r) => (
          <li key={`${r.url || r.title}-${r.index}`}>
            {r.url ? (
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer noopener"
                className={`group inline-flex items-start gap-2 text-sm text-[rgb(var(--fg))] ${tone.hoverText}`}
              >
                <ExternalLink
                  className={`h-3.5 w-3.5 mt-0.5 text-[rgb(var(--fg-muted))] ${tone.iconHover} shrink-0`}
                />
                <span
                  className={`underline underline-offset-2 decoration-[rgb(var(--border))] ${tone.underlineHover}`}
                >
                  {r.title}
                </span>
              </a>
            ) : (
              <span className="inline-flex items-start gap-2 text-sm text-[rgb(var(--fg-muted))]">
                <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {r.title}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HighlightCard({ highlight, tone }: { highlight: DocsHighlight; tone: Tone }) {
  // When the upstream bullet had no bold title, we render the body as the card
  // copy with no heading so it doesn't sport an ugly first-N-words placeholder.
  const hasTitle = Boolean(highlight.title);
  const Icon = pickIcon(hasTitle ? highlight.title : highlight.body, tone);
  const t = TONE_STYLES[tone];
  return (
    <article className="rounded-2xl surface shadow-soft p-5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 mb-3 ${t.iconWrap} ${t.iconText}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      {hasTitle && (
        <h3 className="text-sm font-semibold tracking-tight mb-1.5">{highlight.title}</h3>
      )}
      <p className="text-sm leading-relaxed text-[rgb(var(--fg-muted))]">{highlight.body}</p>
    </article>
  );
}

const ICON_MAP: Array<{ test: RegExp; icon: LucideIcon }> = [
  { test: /power|poe|energ/i, icon: Zap },
  { test: /security|trust|defens|threat|segment|firewall|macsec/i, icon: Lock },
  { test: /ethernet|port|interface|network|fabric|routing|switch/i, icon: Network },
  { test: /manage|admin|dashboard|center|catalyst center|meraki/i, icon: Settings },
  { test: /app|hosting|iox|container|compute|edge|software/i, icon: Package },
  { test: /assurance|monitor|visib|netflow|thousandeyes|telemetr/i, icon: Activity },
  { test: /fabric|sda|architectur|topolog|layer/i, icon: Layers },
  { test: /storage|memory|flash|swap drive|hardware/i, icon: Server }
];

// Caution-tone uses warning-style icons where the topic warrants it.
const CAUTION_ICON_MAP: Array<{ test: RegExp; icon: LucideIcon }> = [
  { test: /security|trust|defens|threat|firewall|macsec|covered|supply.?chain/i, icon: ShieldAlert },
  { test: /power|poe|energ/i, icon: Zap },
  { test: /ethernet|port|interface|network|fabric|routing|switch/i, icon: Network },
  { test: /manage|admin|dashboard|center|orchestrat/i, icon: Settings },
  { test: /app|hosting|iox|container|compute|edge|software/i, icon: Package },
  { test: /assurance|monitor|visib|telemetr|observab/i, icon: Activity },
  { test: /fabric|sda|architectur|topolog|layer/i, icon: Layers },
  { test: /storage|memory|flash|hardware/i, icon: Server }
];

function pickIcon(title: string, tone: Tone): LucideIcon {
  const map = tone === "caution" ? CAUTION_ICON_MAP : ICON_MAP;
  for (const { test, icon } of map) {
    if (test.test(title)) return icon;
  }
  return tone === "caution" ? AlertTriangle : Sparkles;
}
