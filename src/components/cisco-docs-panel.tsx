"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, ChevronDown, ChevronUp, ExternalLink, Loader2, Sparkles } from "lucide-react";

export interface CiscoDocsAnswerPayload {
  answer: string;
  sources: string[];
  confidence?: number;
}

interface CiscoDocsPanelProps {
  productName: string;
  /** Pre-fetched server-side answer so the panel is populated on first paint. */
  initialAnswer?: CiscoDocsAnswerPayload | null;
  initialError?: string | null;
  /** Suggested follow-up prompts shown as one-click chips. */
  suggestions?: string[];
}

// Collapse the answer body when it exceeds this many characters.
const COLLAPSE_THRESHOLD = 700;

export function CiscoDocsPanel({
  productName,
  initialAnswer = null,
  initialError = null,
  suggestions
}: CiscoDocsPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<CiscoDocsAnswerPayload | null>(initialAnswer);
  const [error, setError] = useState<string | null>(initialError);
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const defaultSuggestions = suggestions ?? [
    `Top configuration gotchas for ${productName}`,
    `${productName} licensing tiers`,
    `${productName} certifications and compliance`
  ];

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setError(null);
    setExpanded(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/docs-ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed, product: productName })
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setAnswer(null);
          setError((json && json.error) || `HTTP ${res.status}`);
          return;
        }
        setAnswer(json as CiscoDocsAnswerPayload);
        setQuestion("");
      } catch (e) {
        setAnswer(null);
        setError(e instanceof Error ? e.message : "Network error reaching Cisco Docs.");
      }
    });
  }

  return (
    <div className="rounded-3xl surface shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-6 md:px-8 py-5 flex items-center gap-3 border-b border-[rgb(var(--border))] bg-gradient-to-r from-cisco-500/10 via-transparent to-indigo-500/5">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cisco-500/10 ring-1 ring-cisco-500/30 text-cisco-600 dark:text-cisco-300">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono">
            Cisco Docs · live
          </div>
          <div className="text-sm font-medium truncate">
            Grounded answers about {productName}
          </div>
        </div>
        {typeof answer?.confidence === "number" && (
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 font-mono">
            <Sparkles className="h-3 w-3" />
            {(answer.confidence * 100).toFixed(0)}% confidence
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 space-y-5">
        <div className="min-h-[6rem]">
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--fg-muted))]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Querying Cisco Docs…
            </div>
          )}
          {!isPending && error && (
            <div className="text-sm rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/30 text-amber-700 dark:text-amber-300 p-4">
              <span className="font-semibold mr-1">Couldn&rsquo;t reach Cisco Docs —</span>
              {error}
            </div>
          )}
          {!isPending && !error && answer && answer.answer && (
            <AnimatePresence mode="wait">
              <motion.div
                key={answer.answer.slice(0, 30)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="text-sm leading-relaxed text-[rgb(var(--fg))] space-y-3"
              >
                <CollapsibleAnswer
                  text={answer.answer}
                  expanded={expanded}
                  onToggle={() => setExpanded((v) => !v)}
                />
              </motion.div>
            </AnimatePresence>
          )}
          {!isPending && !error && (!answer || !answer.answer) && (
            <div className="text-sm text-[rgb(var(--fg-muted))]">
              Ask anything about {productName} — configuration, licensing, compatibility,
              release notes. Answers are grounded in current Cisco product documentation.
            </div>
          )}
        </div>

        {/* Sources */}
        {answer && answer.sources && answer.sources.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[rgb(var(--fg-muted))] font-mono">
              Sources
            </span>
            {answer.sources.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full bg-cisco-500/10 ring-1 ring-cisco-500/30 px-2.5 py-1 text-[11px] font-medium text-cisco-700 dark:text-cisco-300"
              >
                <ExternalLink className="h-3 w-3" />
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Follow-up form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask a follow-up about ${productName}…`}
              maxLength={500}
              className="w-full rounded-full bg-[rgb(var(--bg-elev))] border border-[rgb(var(--border))] pl-4 pr-10 py-2.5 text-sm placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-cisco-500/40"
              disabled={isPending}
            />
            <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cisco-500/60 pointer-events-none" />
          </div>
          <button
            type="submit"
            disabled={isPending || !question.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-cisco-500 text-white px-5 py-2.5 text-sm font-medium shadow-glow hover:bg-cisco-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Ask
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Suggested quick-asks */}
        {!isPending && defaultSuggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[rgb(var(--fg-muted))] font-mono">
              Try
            </span>
            {defaultSuggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="text-[12px] rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.10] px-3 py-1.5 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders a Cisco Docs answer with collapse/expand. Cisco Docs returns markdown
 * with **bold**, [text](url) links, and `- ` bullet lists; we render them with
 * a small inline parser (no extra dependency).
 */
function CollapsibleAnswer({
  text,
  expanded,
  onToggle
}: {
  text: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isLong = text.length > COLLAPSE_THRESHOLD;
  const shown = !isLong || expanded ? text : text.slice(0, COLLAPSE_THRESHOLD).trimEnd() + "…";

  return (
    <div className="relative">
      <div className={isLong && !expanded ? "relative max-h-[15rem] overflow-hidden" : ""}>
        {renderMarkdown(shown)}
        {isLong && !expanded && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[rgb(var(--bg-elev))] via-[rgb(var(--bg-elev))]/80 to-transparent"
          />
        )}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cisco-700 dark:text-cisco-300 hover:text-cisco-500"
        >
          {expanded ? (
            <>
              Collapse
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Show full answer
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  // Split into blocks on blank lines.
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, bi) => {
    const lines = block.split("\n");
    const allBullets = lines.length > 0 && lines.every((l) => /^\s*-\s+/.test(l));
    if (allBullets) {
      return (
        <ul key={bi} className="list-disc pl-5 space-y-1.5">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\s*-\s+/, ""))}</li>
          ))}
        </ul>
      );
    }
    return <p key={bi}>{renderInline(block)}</p>;
  });
}

// Match either [text](url) OR **bold** in one pass.
const INLINE_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\*\*([^*]+)\*\*/g;

function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  // Reset regex state (it's a module-level RegExp).
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > lastIndex) out.push(text.slice(lastIndex, m.index));
    if (m[1] && m[2]) {
      out.push(
        <a
          key={key++}
          href={m[2]}
          target="_blank"
          rel="noreferrer noopener"
          className="text-cisco-700 dark:text-cisco-300 underline underline-offset-2 hover:text-cisco-500 break-words"
        >
          {m[1]}
        </a>
      );
    } else if (m[3]) {
      out.push(
        <strong key={key++} className="font-semibold">
          {m[3]}
        </strong>
      );
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}
