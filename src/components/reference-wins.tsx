import { Quote } from "lucide-react";
import type { ReferenceWin } from "@/lib/types";

export function ReferenceWins({ wins }: { wins: ReferenceWin[] }) {
  if (wins.length === 0) {
    return (
      <div className="rounded-2xl surface shadow-soft p-5 md:p-6 text-sm text-[rgb(var(--fg-muted))] h-full">
        No reference wins on file yet.
      </div>
    );
  }
  return (
    <ul className="space-y-3 h-full">
      {wins.map((w, i) => (
        <li key={i} className="rounded-2xl surface shadow-soft p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cisco-500/10 ring-1 ring-cisco-500/30 text-cisco-600 dark:text-cisco-300 shrink-0">
              <Quote className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-[rgb(var(--fg-muted))]">
                <span className="font-semibold text-cisco-600 dark:text-cisco-300">{w.industry}</span>
                <span>·</span>
                <span>{w.region}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed">{w.summary}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
