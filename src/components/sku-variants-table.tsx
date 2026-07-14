"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles
} from "lucide-react";
import {
  parseMarkdownTables,
  parseReferenceLinks,
  type ParsedReference,
  type ParsedTable
} from "@/lib/mcp/cisco-rag-parser";

interface Props {
  productName: string;
  /** Raw markdown answer from Cisco RAG containing the SKU table(s). */
  answer: string;
  /** Optional flat list of source URLs from the RAG response. */
  sources?: string[];
}

/**
 * Renders the hardware-configuration markdown table(s) returned by Cisco RAG
 * as a clean, sortable, scannable table.
 *
 * Layout:
 *   1. Optional intro from the RAG answer (anything before the first table).
 *   2. Each table:
 *      - Header row with column labels
 *      - First column treated as the SKU identifier (slightly bolder)
 *      - "N.A." values dimmed so they don't draw the eye
 *      - Bonus: click any column header to toggle sort
 *      - Horizontal scroll on narrow screens so wide tables don't blow out the layout
 *   3. Optional outro (anything after the last table but before the references trailer).
 *   4. Sources block (parsed `**Reference Document Links:**`).
 *
 * Renders nothing when no table is found — the parent Suspense / null-guard
 * pattern keeps the page clean if RAG returned prose without structured data.
 */
export function SkuVariantsTable({ productName, answer, sources }: Props) {
  const tables = useMemo(() => parseMarkdownTables(answer), [answer]);
  const refs = useMemo<ParsedReference[]>(() => {
    const parsed = parseReferenceLinks(answer);
    // Dedup by URL with optional sources prop (often empty for RAG, but safe).
    if (!sources || sources.length === 0) return parsed;
    const out = [...parsed];
    for (const s of sources) {
      if (s && !out.some((r) => r.url === s || r.title === s)) {
        out.push({ index: out.length + 1, title: s, url: s });
      }
    }
    return out;
  }, [answer, sources]);

  // Auto-label each table so the tab strip is meaningful when there's more
  // than one. Heuristic: look at the SKU codes in the first column for
  // signals like `IEM-` (expansion module), trailing `=` (orderable spare),
  // or `IE-` (base chassis). Falls back to "Table N" when we can't guess.
  const labeledTables = useMemo(() => tables.map((t, i) => ({ ...t, label: labelTable(t, i) })), [tables]);
  const { intro, outro } = useMemo(() => splitIntroOutro(answer), [answer]);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [showContext, setShowContext] = useState(false);

  if (tables.length === 0) return null;
  const safeActiveIdx = Math.min(activeTabIdx, labeledTables.length - 1);

  return (
    <div className="space-y-4">
      {/* CONTEXT TOGGLE — RAG's intro + outro prose were drowning the table.
          Hide both behind a small "Show context" button so the SKU data is
          front-and-center; sellers can expand if they want the explanation. */}
      {(intro || outro) && (
        <div>
          <button
            type="button"
            onClick={() => setShowContext((v) => !v)}
            className="inline-flex items-center gap-1 text-[11.5px] font-mono uppercase tracking-[0.12em] text-[rgb(var(--fg-muted))] hover:text-cisco-600 dark:hover:text-cisco-300 transition-colors"
          >
            {showContext ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {showContext ? "Hide context" : "Show context"}
          </button>
          {showContext && (
            <div className="mt-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] ring-1 ring-[rgb(var(--border))] px-4 py-3 space-y-2 text-[12.5px] text-[rgb(var(--fg-muted))] leading-relaxed">
              {intro && <p>{intro}</p>}
              {outro && <p>{outro}</p>}
            </div>
          )}
        </div>
      )}

      {/* TAB STRIP — only renders when there's more than one table. Single
          tables render their content directly. */}
      {labeledTables.length > 1 && (
        <div role="tablist" aria-label="SKU table" className="flex flex-wrap gap-1.5">
          {labeledTables.map((t, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === safeActiveIdx}
              onClick={() => setActiveTabIdx(i)}
              className={[
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium ring-1 transition-colors",
                i === safeActiveIdx
                  ? "ring-2 ring-cisco-500 bg-cisco-500/5 text-cisco-700 dark:text-cisco-300"
                  : "ring-[rgb(var(--border))] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
              ].join(" ")}
            >
              <Layers className="h-3 w-3" />
              {t.label}
              <span className="text-[10.5px] font-mono text-[rgb(var(--fg-muted))]">{t.rows.length}</span>
            </button>
          ))}
        </div>
      )}

      <SortableTable
        headers={labeledTables[safeActiveIdx].headers}
        rows={labeledTables[safeActiveIdx].rows}
      />

      {refs.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-[rgb(var(--fg-muted))]">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em]">Sources</span>
          </span>
          {refs.map((r) =>
            r.url ? (
              <a
                key={`${r.url}-${r.index}`}
                href={r.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[rgb(var(--fg))] hover:text-cisco-600 dark:hover:text-cisco-300 underline underline-offset-2 decoration-[rgb(var(--border))] hover:decoration-current"
              >
                {r.title}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            ) : (
              <span key={`${r.title}-${r.index}`}>{r.title}</span>
            )
          )}
          <span className="ml-auto font-mono text-[10.5px] opacity-70">
            via Cisco RAG · {productName}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Pick a short tab label for a table based on its rows. Looks at SKU codes
 * in column 0:
 *   - Trailing `=` everywhere → "Expansion modules" (orderable spares)
 *   - All start with `IEM-` / `NIM-` / `EM-` → "Expansion modules"
 *   - Otherwise → "Base chassis" (or "Base / Variants" for the first table)
 * Falls back to `Table N` when nothing matches.
 */
function labelTable(t: ParsedTable, idx: number): string {
  if (t.rows.length === 0) return `Table ${idx + 1}`;
  const firstCol = t.rows.map((r) => (r[0] ?? "").trim().toLowerCase());
  const looksLikeExpansion =
    firstCol.every((c) => c.endsWith("=")) ||
    firstCol.every((c) => /^(iem|nim|em|sm|asyc|hot-?spare)-/.test(c));
  if (looksLikeExpansion) return "Expansion modules";
  // Mixed table containing both base and expansion → name by index.
  return idx === 0 ? "Base chassis" : `Variants ${idx + 1}`;
}

/**
 * Drop everything before the first `|...|` line into `intro`, everything after
 * the last table row that isn't a Reference Document Links block into `outro`.
 * Tables themselves are rendered separately so we don't double-render their
 * cell text inside a `<p>`.
 */
function splitIntroOutro(raw: string): { intro?: string; outro?: string } {
  if (!raw) return {};
  // Strip the references block first.
  let body = raw;
  const refHeaderMatch = body.match(/\*\*Reference Document Links:?\*\*|Reference Document Links:/i);
  if (refHeaderMatch && typeof refHeaderMatch.index === "number") {
    body = body.slice(0, refHeaderMatch.index).trimEnd();
  }
  const lines = body.split(/\r?\n/);
  // Find the line index of the first table-looking row.
  const firstTableIdx = lines.findIndex((l) => l.trim().includes("|") && l.trim().split("|").length >= 3);
  // Find the line index of the last table-looking row.
  let lastTableIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (t.includes("|") && t.split("|").length >= 3) {
      lastTableIdx = i;
      break;
    }
  }
  const intro =
    firstTableIdx > 0 ? lines.slice(0, firstTableIdx).join("\n").trim() : undefined;
  const outroRaw =
    lastTableIdx >= 0 && lastTableIdx < lines.length - 1
      ? lines.slice(lastTableIdx + 1).join("\n").trim()
      : undefined;
  return {
    intro: intro && intro.length > 0 ? cleanProse(intro) : undefined,
    outro: outroRaw && outroRaw.length > 0 ? cleanProse(outroRaw) : undefined
  };
}

function cleanProse(s: string): string {
  return s
    .replace(/\[\d+\]\((?:https?:\/\/[^)]+)\)/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Internal sortable table component. Click any header to cycle through:
 *   asc → desc → unsorted (original RAG order).
 * Numeric values are compared numerically; everything else is string-compared.
 *
 * Wraps in `overflow-x-auto` so wide hardware tables (8+ columns) scroll
 * horizontally on narrow screens without breaking the page layout.
 */
function SortableTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const [sort, setSort] = useState<{ col: number; dir: "asc" | "desc" } | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const { col, dir } = sort;
    const out = [...rows];
    out.sort((a, b) => {
      const av = a[col] ?? "";
      const bv = b[col] ?? "";
      const an = parseLeadingNumber(av);
      const bn = parseLeadingNumber(bv);
      let cmp: number;
      if (Number.isFinite(an) && Number.isFinite(bn)) {
        cmp = an - bn;
      } else {
        cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      }
      return dir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [rows, sort]);

  const toggleSort = (col: number) => {
    setSort((s) => {
      if (!s || s.col !== col) return { col, dir: "asc" };
      if (s.dir === "asc") return { col, dir: "desc" };
      return null; // third click → unsorted
    });
  };

  return (
    <div className="rounded-2xl surface shadow-soft ring-1 ring-[rgb(var(--border))] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead className="bg-black/[0.02] dark:bg-white/[0.02]">
            <tr>
              {headers.map((h, i) => {
                const isSorted = sort?.col === i;
                return (
                  <th
                    key={i}
                    onClick={() => toggleSort(i)}
                    className={[
                      "text-left px-3 md:px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] cursor-pointer select-none whitespace-nowrap",
                      i === 0 ? "text-cisco-700 dark:text-cisco-300" : "text-[rgb(var(--fg-muted))]",
                      isSorted ? "text-[rgb(var(--fg))]" : ""
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center gap-1">
                      {i === 0 && <Layers className="h-3 w-3" />}
                      {h}
                      <ChevronDown
                        className={[
                          "h-3 w-3 transition-transform shrink-0",
                          isSorted ? "opacity-100" : "opacity-30",
                          isSorted && sort?.dir === "desc" ? "rotate-180" : ""
                        ].join(" ")}
                      />
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]/40">
            {sortedRows.map((row, ri) => (
              <tr key={ri} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={[
                      "px-3 md:px-4 py-3 align-top leading-relaxed",
                      ci === 0
                        ? "font-mono text-[12px] font-semibold text-[rgb(var(--fg))] whitespace-nowrap"
                        : isUnavailable(cell)
                          ? "text-[rgb(var(--fg-muted))]/60 italic"
                          : "text-[rgb(var(--fg))]"
                    ].join(" ")}
                  >
                    {cell || <span className="opacity-40">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[rgb(var(--border))]/50 px-3 md:px-4 py-2 flex items-center gap-2 text-[11px] text-[rgb(var(--fg-muted))]">
        <Sparkles className="h-3 w-3 text-cisco-600 dark:text-cisco-300" />
        <span>{sortedRows.length} variants · click any column header to sort</span>
      </div>
    </div>
  );
}

/** Extract the first numeric token in a cell ("240W base, 480W with expansion" → 240). */
function parseLeadingNumber(s: string): number {
  const m = s.match(/-?\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(/,/g, "")) : NaN;
}

/** Cisco RAG uses "N.A.", "N/A", "—", and "Not applicable" interchangeably for empty cells. */
function isUnavailable(s: string): boolean {
  const t = s.trim().toLowerCase();
  return t === "" || t === "n.a." || t === "n/a" || t === "—" || t === "-" || t === "not applicable" || t === "none";
}
