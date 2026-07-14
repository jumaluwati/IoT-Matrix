import { Check, Minus, X } from "lucide-react";
import type { SpecRow } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  specs: SpecRow[];
  competitorName: string;
  /**
   * True when this card came from Circuit synthesis. Circuit often fills
   * `competitor` with the bare product name on every row, which hits our
   * junk-detection heuristic. Hand-authored cards (synthesized=false) are
   * trusted: even short competitor cells like "SNMP" or "FL Switch firmware"
   * are real values, never junk.
   */
  synthesized?: boolean;
}

/**
 * Heuristic: when a Battlecard is fully Circuit-synthesized (no authored card),
 * Circuit often fills `competitor` with the bare product name on every row
 * because it has no real spec data. That column is then worse than useless —
 * it makes the table look broken. Detect that and switch to a Cisco-led
 * layout that drops the noisy column.
 *
 * IMPORTANT: only runs for synthesized cards. Hand-authored cards (e.g.
 * phoenix-contact/fl-switch-2000) deliberately use short competitor values
 * like "SNMP" or "DIN-rail, fanless" — those are correct and should render
 * in the standard side-by-side layout.
 */
function competitorColumnIsJunk(specs: SpecRow[], competitorName: string): boolean {
  if (specs.length === 0) return false;
  const norm = (s: string) => s.trim().toLowerCase();
  const product = norm(competitorName);
  const firstVal = norm(specs[0].competitor);
  if (specs.every((r) => norm(r.competitor) === firstVal)) return true;
  if (specs.every((r) => product.includes(norm(r.competitor)) || norm(r.competitor).includes(product))) return true;
  const avgLen = specs.reduce((acc, r) => acc + r.competitor.trim().length, 0) / specs.length;
  if (avgLen < 14) return true;
  return false;
}

export function SpecTable({ specs, competitorName, synthesized = false }: Props) {
  // Only apply junk-column detection for Circuit-synthesized cards. Authored
  // cards are trusted to have real (sometimes terse) competitor values.
  if (synthesized && competitorColumnIsJunk(specs, competitorName)) {
    return <CiscoLedTable specs={specs} competitorName={competitorName} />;
  }
  return <SideBySideTable specs={specs} competitorName={competitorName} />;
}

/**
 * Original side-by-side layout — used when the Battlecard has real competitor
 * spec data per row (i.e. hand-authored cards, or a future Circuit prompt
 * that surfaces honest spec values).
 */
function SideBySideTable({ specs, competitorName }: Props) {
  return (
    <div className="rounded-3xl surface overflow-hidden shadow-soft">
      <div className="grid grid-cols-[1.1fr_1fr_1fr] text-xs uppercase tracking-wider text-[rgb(var(--fg-muted))] border-b border-[rgb(var(--border))]">
        <div className="px-5 py-3">Capability</div>
        <div className="px-5 py-3 border-l border-[rgb(var(--border))]">{competitorName}</div>
        <div className="px-5 py-3 border-l border-[rgb(var(--border))] bg-cisco-500/5">
          <span className="text-cisco-600 dark:text-cisco-300 font-semibold">Cisco</span>
        </div>
      </div>
      <ul className="divide-y divide-[rgb(var(--border))]">
        {specs.map((row) => {
          const ciscoWin = row.winner === "cisco";
          const compWin = row.winner === "competitor";
          const tie = row.winner === "tie";
          return (
            <li
              key={row.label}
              className="grid grid-cols-[1.1fr_1fr_1fr] text-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
            >
              <div className="px-5 py-4 font-medium">{row.label}</div>
              <div
                className={cn(
                  "px-5 py-4 border-l border-[rgb(var(--border))] text-[rgb(var(--fg-muted))]",
                  compWin && "text-[rgb(var(--fg))]"
                )}
              >
                <div className="flex items-start gap-2">
                  {compWin && <Check className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />}
                  {tie && <Minus className="h-4 w-4 mt-0.5 text-[rgb(var(--fg-muted))] shrink-0" />}
                  <span>{row.competitor}</span>
                </div>
              </div>
              <div
                className={cn(
                  "px-5 py-4 border-l border-[rgb(var(--border))] bg-cisco-500/[0.04]",
                  ciscoWin ? "text-[rgb(var(--fg))] font-medium" : "text-[rgb(var(--fg-muted))]"
                )}
              >
                <div className="flex items-start gap-2">
                  {ciscoWin && <Check className="h-4 w-4 mt-0.5 text-cisco-500 shrink-0" />}
                  {tie && <Minus className="h-4 w-4 mt-0.5 text-[rgb(var(--fg-muted))] shrink-0" />}
                  <span>{row.cisco}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Cisco-led layout — used when Circuit couldn't synthesize real competitor
 * specs (every row was just "Stratix 5800" or similar). Drops the noisy
 * column entirely. Each row reads as a clear Cisco capability claim grouped
 * under the capability label, with a small honest "competitor spec not
 * available" eyebrow at the top so users know what they're looking at.
 *
 * Winner badges still render (Cisco / tie / competitor) so the seller knows
 * which rows are unambiguous strengths.
 */
function CiscoLedTable({ specs, competitorName }: Props) {
  return (
    <div className="rounded-3xl surface overflow-hidden shadow-soft">
      <div className="px-5 py-3 border-b border-[rgb(var(--border))] flex items-center gap-2 text-[11px] uppercase tracking-wider text-[rgb(var(--fg-muted))] bg-cisco-500/5">
        <span className="text-cisco-600 dark:text-cisco-300 font-mono">Cisco capabilities</span>
        <span className="opacity-50">·</span>
        <span className="font-mono">vs {competitorName}</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/10 ring-1 ring-amber-500/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-mono normal-case tracking-wider">
          competitor specs not in source
        </span>
      </div>
      <ul className="divide-y divide-[rgb(var(--border))]">
        {specs.map((row) => {
          const ciscoWin = row.winner === "cisco";
          const compWin = row.winner === "competitor";
          const tie = row.winner === "tie";
          return (
            <li
              key={row.label}
              className="grid grid-cols-[180px_1fr] md:grid-cols-[220px_1fr] gap-4 md:gap-6 px-5 py-4 text-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors items-start"
            >
              <div className="min-w-0">
                <div className="font-medium text-[rgb(var(--fg))]">{row.label}</div>
                <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider">
                  {ciscoWin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cisco-500/10 text-cisco-700 dark:text-cisco-300 ring-1 ring-cisco-500/30 px-1.5 py-0.5">
                      <Check className="h-2.5 w-2.5" />
                      Cisco wins
                    </span>
                  )}
                  {tie && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/5 text-[rgb(var(--fg-muted))] ring-1 ring-[rgb(var(--border))] px-1.5 py-0.5">
                      <Minus className="h-2.5 w-2.5" />
                      Parity
                    </span>
                  )}
                  {compWin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 px-1.5 py-0.5">
                      <X className="h-2.5 w-2.5" />
                      Competitor leads
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[13.5px] leading-relaxed text-[rgb(var(--fg-muted))] break-words">
                {row.cisco}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
