"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Check,
  CircleDollarSign,
  Clipboard,
  ClipboardCheck,
  Crown,
  FileText,
  Handshake,
  ListChecks,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  Workflow
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * MEDDPICC qualification scaffolding for the active compare context.
 *
 * Persistence:
 *   Saved per-pair AND per-opportunity-name in localStorage under
 *     matrix.meddpicc.v1.<competitorSlug>/<productSlug>::<opportunityName>
 *   Default opportunity name is "Default" so SEs can start typing immediately;
 *   they can switch / add new opportunities via the input in the header.
 *
 * Security:
 *   100% client-side. No customer names, financials, or contact info ever
 *   touches the server. Wiped only by the user explicitly clearing fields
 *   OR clearing browser storage. Honest about this in the footer.
 *
 * Autofill seed:
 *   `discoveryQuestions` (from the battlecard's talk track) pre-populate the
 *   "Identify pain" section's hint list. `competitorName` pre-fills the
 *   Competition section's current-vendor field.
 *
 * Export:
 *   "Copy as markdown" produces a clean Cisco-CRM-pasteable summary. The
 *   shape matches what most CRM custom fields expect (one heading per
 *   MEDDPICC letter, fields rendered as `field: value`).
 */

const FIELD_SCHEMA = [
  {
    id: "metrics",
    letter: "M",
    title: "Metrics",
    icon: Target,
    accent: "text-cisco-700 dark:text-cisco-300",
    hint: "What measurable outcome does the customer want?",
    fields: [
      { id: "outcome", label: "Target business outcome", placeholder: "Reduce unplanned downtime, accelerate audit pass rate, consolidate vendor SKUs…", multiline: true },
      { id: "current", label: "Current baseline (today)", placeholder: "e.g. 18hr MTTR, 4 OT vendors managed separately" },
      { id: "target", label: "Goal value", placeholder: "e.g. <4hr MTTR, single Cisco-managed plane" }
    ]
  },
  {
    id: "economic-buyer",
    letter: "E",
    title: "Economic buyer",
    icon: CircleDollarSign,
    accent: "text-emerald-700 dark:text-emerald-300",
    hint: "Who can sign the PO and unblock budget?",
    fields: [
      { id: "name", label: "Name + title", placeholder: "Plant Manager, OT Director, CIO…" },
      { id: "met", label: "Met them in person? Their stated priorities?", placeholder: "If not met yet, who can bring them in?", multiline: true }
    ]
  },
  {
    id: "decision-criteria",
    letter: "D",
    title: "Decision criteria",
    icon: ListChecks,
    accent: "text-purple-700 dark:text-purple-300",
    hint: "What technical + commercial bar does the winner need to clear?",
    fields: [
      { id: "must-have", label: "Must-haves they explicitly stated", placeholder: "Cyber Vision-grade DPI, IEC 62443 cert, multi-vendor support, NDAA compliance…", multiline: true },
      { id: "tie-breaker", label: "Likely tie-breaker if specs match", placeholder: "Price, brand familiarity, existing relationship, support response time…" }
    ]
  },
  {
    id: "decision-process",
    letter: "D",
    title: "Decision process",
    icon: Workflow,
    accent: "text-amber-700 dark:text-amber-300",
    hint: "Who reviews, who approves, what's the path from POC → PO?",
    fields: [
      { id: "stages", label: "Stages + stakeholders involved", placeholder: "OT eval (3wk) → IT security review (2wk) → Procurement RFP → Capital approval", multiline: true },
      { id: "timeline", label: "Target close timeline + key dates", placeholder: "RFP issued Q3, PO needed by FY-end" },
      { id: "poc", label: "POC required? Scope + success criteria", placeholder: "2-week POC at Plant 4 — measure throughput + Cyber Vision sensor accuracy" }
    ]
  },
  {
    id: "paper-process",
    letter: "P",
    title: "Paper process",
    icon: FileText,
    accent: "text-sky-700 dark:text-sky-300",
    hint: "Cisco-specific procurement quirks. Catch these early.",
    fields: [
      { id: "smart-account", label: "Smart Account / Enterprise Agreement status", placeholder: "Smart Account in place? On an EA? Need a new one?" },
      { id: "preferred-partner", label: "Preferred Cisco partner / reseller", placeholder: "Existing partner relationship + reseller margin?" },
      { id: "compliance", label: "Compliance gates (NDAA, TAA, IEC 62443, Cisco Secure Development Lifecycle)", placeholder: "Any export-controlled, public-sector, or covered-list constraints", multiline: true }
    ]
  },
  {
    id: "identify-pain",
    letter: "I",
    title: "Identify pain",
    icon: AlertCircle,
    accent: "text-rose-700 dark:text-rose-300",
    hint: "What's broken today? Quoted pain beats hypothetical pain.",
    fields: [
      { id: "pain-points", label: "Specific pain points they admitted", placeholder: "Direct quotes when possible — \"our SCADA goes down every Tuesday morning\"", multiline: true },
      { id: "cost-of-inaction", label: "Cost of doing nothing", placeholder: "$ / hr of downtime, audit findings, churn risk, OT/IT team friction…", multiline: true }
    ]
  },
  {
    id: "champion",
    letter: "C",
    title: "Champion",
    icon: Crown,
    accent: "text-fuchsia-700 dark:text-fuchsia-300",
    hint: "Who will defend Cisco internally when you're not in the room?",
    fields: [
      { id: "champion-name", label: "Champion name + title", placeholder: "Senior OT engineer who already uses Catalyst Center elsewhere…" },
      { id: "ammo", label: "Ammo they need from you", placeholder: "ROI calculator, customer ref call, Cisco Validated Design doc, 1-pager…", multiline: true }
    ]
  },
  {
    id: "competition",
    letter: "C",
    title: "Competition",
    icon: Shield,
    accent: "text-orange-700 dark:text-orange-300",
    hint: "Beyond the obvious — who's actually quoting and how serious is it?",
    fields: [
      { id: "incumbents", label: "Current vendor + renewal date", placeholder: "" },
      { id: "actively-quoted", label: "Other Cisco competitors actively quoting", placeholder: "Siemens, Hirschmann, Moxa, Fortinet…" },
      { id: "their-strengths", label: "What's the competitor's actual strength here?", placeholder: "Be honest. \"They've supported this plant for 12 years\" matters more than spec sheets.", multiline: true }
    ]
  }
] as const;

type FieldId = string;
type Sections = Record<string, Record<FieldId, string>>;

interface MeddpiccChecklistProps {
  competitorSlug: string;
  productSlug: string;
  competitorName: string;
  ciscoProductName: string;
  /** Optional discovery questions from the battlecard, used as inline prompts in Identify Pain. */
  discoveryQuestions?: string[];
}

const SCHEMA_VERSION = "v1";

export function MeddpiccChecklist({
  competitorSlug,
  productSlug,
  competitorName,
  ciscoProductName,
  discoveryQuestions
}: MeddpiccChecklistProps) {
  const pairKey = `${competitorSlug}/${productSlug}`;
  const [opportunityName, setOpportunityName] = useState<string>("Default");
  const [sections, setSections] = useState<Sections>({});
  const [copied, setCopied] = useState(false);
  // Single-tab UI: only one MEDDPICC section visible at a time. Drastically
  // reduces page height — the seller picks the letter they need (or follows
  // their own MEDDPICC order) instead of scrolling through 8 stacked cards.
  const [activeTabId, setActiveTabId] = useState<string>(FIELD_SCHEMA[0].id);

  // Storage key includes the opportunity name so a single SE can track
  // multiple parallel opportunities for the same competitor/product pair.
  const storageKey = useMemo(
    () => `matrix.meddpicc.${SCHEMA_VERSION}.${pairKey}::${opportunityName.trim() || "Default"}`,
    [pairKey, opportunityName]
  );

  // Load on mount + whenever the storage key changes (opportunity switch).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Sections;
        setSections(parsed);
      } else {
        // Default seed for new opportunities: prefill the competition section
        // with the competitor name so the user doesn't have to retype it.
        setSections({
          competition: { "incumbents": competitorName ? `${competitorName} (renewal date: ?)` : "" }
        });
      }
    } catch {
      setSections({});
    }
  }, [storageKey, competitorName]);

  // Persist on any change. Debounce 200ms so rapid typing doesn't thrash.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(sections));
      } catch {
        /* quota or private-mode — silently ignore */
      }
    }, 200);
    return () => clearTimeout(id);
  }, [storageKey, sections]);

  const setField = useCallback((sectionId: string, fieldId: string, value: string) => {
    setSections((prev) => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] ?? {}), [fieldId]: value }
    }));
  }, []);

  const resetAll = useCallback(() => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      `Clear all MEDDPICC notes for "${opportunityName.trim() || "Default"}" on ${competitorName} vs ${ciscoProductName}? This cannot be undone.`
    );
    if (!ok) return;
    window.localStorage.removeItem(storageKey);
    setSections({
      competition: { "incumbents": competitorName ? `${competitorName} (renewal date: ?)` : "" }
    });
  }, [storageKey, opportunityName, competitorName, ciscoProductName]);

  const copyMarkdown = useCallback(async () => {
    const md = toMarkdown(opportunityName, competitorName, ciscoProductName, sections);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied — fall back to a text-area selection */
      window.prompt("Copy the MEDDPICC summary below:", md);
    }
  }, [opportunityName, competitorName, ciscoProductName, sections]);

  // Completion = filled fields / total fields. Pure cosmetic but motivating.
  const { filled, total } = useMemo(() => {
    let f = 0;
    let t = 0;
    for (const s of FIELD_SCHEMA) {
      for (const fld of s.fields) {
        t++;
        const v = sections[s.id]?.[fld.id];
        if (v && v.trim().length > 0) f++;
      }
    }
    return { filled: f, total: t };
  }, [sections]);
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);

  return (
    <div className="space-y-5">
      {/* HEADER: opportunity name input + completion bar + actions */}
      <div className="rounded-2xl surface ring-1 ring-[rgb(var(--border))] shadow-soft p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.12em] text-cisco-700 dark:text-cisco-300 mb-1">
              <Briefcase className="h-3 w-3" />
              Opportunity
            </div>
            <input
              type="text"
              value={opportunityName}
              onChange={(e) => setOpportunityName(e.target.value)}
              placeholder="Acme Manufacturing — Plant 4 OT refresh"
              className="w-full bg-transparent text-base md:text-lg font-semibold tracking-tight outline-none border-b border-transparent focus:border-cisco-500/40 transition-colors py-1"
            />
            <p className="mt-1 text-[12px] text-[rgb(var(--fg-muted))]">
              Saved locally to your browser. Switch the name to start tracking a different deal.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={copyMarkdown}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ring-1 ring-cisco-500/40 text-cisco-700 dark:text-cisco-300 bg-cisco-500/5 hover:bg-cisco-500/15 transition-colors"
            >
              {copied ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy as markdown"}
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ring-1 ring-[rgb(var(--border))] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* COMPLETION BAR */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[rgb(var(--fg-muted))]">
              Qualification completeness
            </span>
            <span className="text-[12px] font-mono text-[rgb(var(--fg))]">{filled} / {total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.05] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cisco-500 to-cisco-400 transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* MEDDPICC TAB STRIP — clicking a chip switches the active section.
          Replaces the previous anchor-link strip + 8 stacked cards layout.
          The chip ALSO shows fill state (started / complete) so the seller can
          see at-a-glance which sections still need attention. */}
      <div role="tablist" aria-label="MEDDPICC sections" className="flex flex-wrap gap-1.5">
        {FIELD_SCHEMA.map((s) => {
          const sectionFilled = s.fields.filter((f) => (sections[s.id]?.[f.id] ?? "").trim().length > 0).length;
          const isComplete = sectionFilled === s.fields.length;
          const isStarted = sectionFilled > 0 && !isComplete;
          const isActive = activeTabId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`meddpicc-panel-${s.id}`}
              onClick={() => setActiveTabId(s.id)}
              className={[
                "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-medium ring-1 transition-colors",
                isActive
                  ? `ring-2 ${isComplete ? "ring-emerald-500" : "ring-cisco-500"} bg-[rgb(var(--bg-elev))] text-[rgb(var(--fg))]`
                  : isComplete
                    ? "ring-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
                    : isStarted
                      ? "ring-cisco-500/30 bg-cisco-500/5 text-cisco-700 dark:text-cisco-300 hover:bg-cisco-500/10"
                      : "ring-[rgb(var(--border))] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
              ].join(" ")}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-[10px] font-mono font-bold">
                {s.letter}
              </span>
              {s.title}
              {isComplete && <Check className="h-3 w-3" />}
            </button>
          );
        })}
      </div>

      {/* ACTIVE SECTION — only the selected tab renders. Same MeddpiccSection
          component, just narrowed to one entry. */}
      <div role="tabpanel" id={`meddpicc-panel-${activeTabId}`}>
        {(() => {
          const s = FIELD_SCHEMA.find((x) => x.id === activeTabId) ?? FIELD_SCHEMA[0];
          return (
            <MeddpiccSection
              schema={s}
              values={sections[s.id] ?? {}}
              onChange={(fieldId, value) => setField(s.id, fieldId, value)}
              extraHint={
                s.id === "identify-pain" && discoveryQuestions && discoveryQuestions.length > 0 ? (
                  <DiscoveryHints questions={discoveryQuestions} />
                ) : null
              }
            />
          );
        })()}
      </div>

      {/* PRIVACY FOOTER */}
      <div className="rounded-2xl ring-1 ring-[rgb(var(--border))] bg-black/[0.02] dark:bg-white/[0.02] p-3 flex items-start gap-2.5">
        <Sparkles className="h-3.5 w-3.5 mt-0.5 text-cisco-600 dark:text-cisco-300 shrink-0" />
        <div className="text-[12px] text-[rgb(var(--fg-muted))] leading-relaxed">
          Saved 100% in your browser&rsquo;s localStorage. Customer names, dollar figures, and contact info NEVER leave your machine.
          Clearing browser data or clicking <span className="font-semibold">Reset</span> wipes it.
        </div>
      </div>
    </div>
  );
}

// ---------- Internals ----------

interface SectionSchema {
  id: string;
  letter: string;
  title: string;
  icon: LucideIcon;
  accent: string;
  hint: string;
  fields: readonly { id: string; label: string; placeholder: string; multiline?: boolean }[];
}

function MeddpiccSection({
  schema,
  values,
  onChange,
  extraHint
}: {
  schema: SectionSchema;
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  extraHint?: React.ReactNode;
}) {
  const Icon = schema.icon;
  const filled = schema.fields.filter((f) => (values[f.id] ?? "").trim().length > 0).length;
  const isComplete = filled === schema.fields.length;
  return (
    <section
      id={`meddpicc-${schema.id}`}
      className="rounded-2xl surface ring-1 ring-[rgb(var(--border))] shadow-soft overflow-hidden scroll-mt-24"
    >
      <div className="px-5 md:px-6 py-3.5 border-b border-[rgb(var(--border))]/50 flex items-center gap-3 flex-wrap">
        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.04] ${schema.accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-mono uppercase tracking-[0.12em] font-semibold ${schema.accent}`}>
              {schema.letter} · {schema.title}
            </span>
            <span className="text-[11px] font-mono text-[rgb(var(--fg-muted))]">
              {filled} / {schema.fields.length}
            </span>
          </div>
          <div className="text-[12.5px] text-[rgb(var(--fg-muted))]">{schema.hint}</div>
        </div>
        {isComplete && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10.5px] font-mono">
            <Check className="h-3 w-3" />
            Complete
          </span>
        )}
      </div>
      <div className="px-5 md:px-6 py-4 space-y-3.5">
        {schema.fields.map((f) => (
          <FieldInput
            key={f.id}
            label={f.label}
            placeholder={f.placeholder}
            value={values[f.id] ?? ""}
            onChange={(v) => onChange(f.id, v)}
            multiline={f.multiline}
          />
        ))}
        {extraHint}
      </div>
    </section>
  );
}

function FieldInput({
  label,
  placeholder,
  value,
  onChange,
  multiline
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const isFilled = value.trim().length > 0;
  return (
    <div>
      <label className="block text-[11.5px] font-medium text-[rgb(var(--fg))] mb-1 flex items-center gap-1.5">
        {label}
        {isFilled && <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full rounded-lg ring-1 ring-[rgb(var(--border))] bg-black/[0.02] dark:bg-white/[0.02] focus:ring-cisco-500/40 focus:bg-[rgb(var(--bg-elev))] transition-colors px-3 py-2 text-[13px] outline-none resize-y leading-relaxed"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg ring-1 ring-[rgb(var(--border))] bg-black/[0.02] dark:bg-white/[0.02] focus:ring-cisco-500/40 focus:bg-[rgb(var(--bg-elev))] transition-colors px-3 py-2 text-[13px] outline-none"
        />
      )}
    </div>
  );
}

function DiscoveryHints({ questions }: { questions: string[] }) {
  if (questions.length === 0) return null;
  return (
    <div className="rounded-lg ring-1 ring-cisco-500/30 bg-cisco-500/[0.04] p-3">
      <div className="flex items-center gap-1.5 mb-2 text-[10.5px] font-mono uppercase tracking-[0.12em] text-cisco-700 dark:text-cisco-300 font-semibold">
        <Handshake className="h-3 w-3" />
        Discovery prompts from the battlecard
      </div>
      <ul className="space-y-1.5">
        {questions.slice(0, 5).map((q, i) => (
          <li key={i} className="text-[12.5px] text-[rgb(var(--fg-muted))] leading-relaxed flex gap-2">
            <span className="font-mono text-[10.5px] text-cisco-600 dark:text-cisco-300 shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Produce a Cisco-CRM-pasteable MEDDPICC summary as markdown. Used by the
 * "Copy as markdown" button. Format chosen to round-trip cleanly into
 * Salesforce custom fields, Notion, Linear, Slack, etc.
 */
function toMarkdown(
  opportunityName: string,
  competitorName: string,
  ciscoProductName: string,
  sections: Sections
): string {
  const lines: string[] = [];
  lines.push(`# MEDDPICC \u2014 ${opportunityName.trim() || "Default"}`);
  lines.push(``);
  lines.push(`**Compete context:** ${competitorName} \u2192 Cisco ${ciscoProductName}`);
  lines.push(`**Captured:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push(``);
  for (const s of FIELD_SCHEMA) {
    const fieldValues = s.fields
      .map((f) => ({ label: f.label, value: (sections[s.id]?.[f.id] ?? "").trim() }))
      .filter((f) => f.value.length > 0);
    if (fieldValues.length === 0) continue;
    lines.push(`## ${s.letter} \u00B7 ${s.title}`);
    for (const f of fieldValues) {
      lines.push(`- **${f.label}:** ${f.value.replace(/\n/g, " ")}`);
    }
    lines.push(``);
  }
  if (lines.length <= 5) {
    lines.push(`_No qualification notes captured yet._`);
  }
  return lines.join("\n");
}
