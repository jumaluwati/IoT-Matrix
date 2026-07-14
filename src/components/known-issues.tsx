import { AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { KnownIssue } from "@/lib/types";

const severityTone: Record<KnownIssue["severity"], "risk" | "warn" | "neutral"> = {
  Critical: "risk",
  High: "risk",
  Medium: "warn",
  Low: "neutral"
};

export function KnownIssues({ issues }: { issues: KnownIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="rounded-2xl surface shadow-soft p-5 md:p-6 text-sm text-[rgb(var(--fg-muted))] h-full">
        No active advisories tracked for this competitor product. (CDETS / NVD pull will populate
        this list when the orchestrator is live.)
      </div>
    );
  }
  return (
    <ul className="space-y-3 h-full">
      {issues.map((iss) => (
        <li
          key={iss.id}
          className="rounded-2xl surface shadow-soft p-5"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-rose-500/30 text-rose-600 dark:text-rose-300 shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={severityTone[iss.severity]}>{iss.severity}</Badge>
                <span className="text-xs font-mono text-[rgb(var(--fg-muted))]">{iss.id}</span>
                <span className="text-xs text-[rgb(var(--fg-muted))]">· {iss.source}</span>
              </div>
              <div className="mt-1.5 text-sm leading-relaxed">{iss.title}</div>
              {iss.url && (
                <a
                  href={iss.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-cisco-600 dark:text-cisco-300 hover:underline"
                >
                  Source
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
