import { Globe, FileText, MessageSquareText, Bug, Brain } from "lucide-react";
import type { Battlecard } from "@/lib/types";

const ICONS = {
  Circuit: Brain,
  "Cisco Docs": FileText,
  CDETS: Bug,
  Webex: MessageSquareText,
  "Public Web": Globe
} as const;

export function SourceFooter({ sources }: { sources: Battlecard["sources"] }) {
  return (
    <div className="rounded-3xl surface p-6">
      <div className="text-[11px] uppercase tracking-[0.2em] text-[rgb(var(--fg-muted))] mb-3">
        Grounded in
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {sources.map((s, i) => {
          const I = ICONS[s.system] ?? Globe;
          return (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                <I className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate">{s.label}</div>
                <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--fg-muted))]">
                  {s.system}
                </div>
              </div>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cisco-600 dark:text-cisco-300 hover:underline"
                >
                  open
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
