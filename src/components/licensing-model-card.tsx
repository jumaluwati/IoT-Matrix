import { CheckCircle2, Gift, Info, Layers } from "lucide-react";
import type { LicensingModel } from "@/data/licensing-models";

/**
 * Static, honest licensing-model card for products that don't fit the
 * Network Essentials / Advantage tiering (APs, Cyber Vision, Catalyst
 * Center, IoT OPS, Secure Firewall). Used in place of the dynamic
 * LicenseTiers component for those categories so we don't render
 * RAG-hallucinated tier data that doesn't exist in real life.
 */
export function LicensingModelCard({
  productName,
  model
}: {
  productName: string;
  model: LicensingModel;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl surface ring-1 ring-[rgb(var(--border))] shadow-soft overflow-hidden">
        <div className="px-5 md:px-6 pt-5 pb-4 border-b border-[rgb(var(--border))]/50 flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-mono uppercase tracking-wider bg-cisco-500/10 text-cisco-700 dark:text-cisco-300 ring-1 ring-cisco-500/30">
              <Layers className="h-3 w-3" />
              {model.modelLabel}
            </div>
            <h3 className="mt-2 text-lg md:text-xl font-semibold tracking-tight">
              How {productName} is licensed
            </h3>
            <p className="mt-1 text-[13px] text-[rgb(var(--fg-muted))] leading-relaxed max-w-3xl">
              {model.description}
            </p>
          </div>
          {model.unit && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium bg-black/5 dark:bg-white/5 text-[rgb(var(--fg-muted))] ring-1 ring-[rgb(var(--border))]">
              {model.unit}
            </span>
          )}
        </div>

        {model.facts.length > 0 && (
          <ul className="divide-y divide-[rgb(var(--border))]/40">
            {model.facts.map((f, i) => (
              <li
                key={i}
                className="px-5 md:px-6 py-3 text-[13px] text-[rgb(var(--fg))] leading-relaxed flex items-start gap-2.5"
              >
                <Info className="h-3.5 w-3.5 mt-0.5 text-cisco-600 dark:text-cisco-300 shrink-0" />
                <span className="break-words">{f}</span>
              </li>
            ))}
          </ul>
        )}

        {model.factsNote && (
          <div className="border-t border-[rgb(var(--border))]/50 px-5 md:px-6 py-3 bg-amber-500/5">
            <div className="flex items-start gap-2.5">
              <Info className="h-3.5 w-3.5 mt-0.5 text-amber-700 dark:text-amber-300 shrink-0" />
              <span className="text-[12.5px] text-[rgb(var(--fg-muted))] leading-relaxed italic">
                {model.factsNote}
              </span>
            </div>
          </div>
        )}

        {(model.included?.length || model.addOns?.length) && (
          <div className="border-t border-[rgb(var(--border))]/50 px-5 md:px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {model.included && model.included.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                  <span className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300 font-semibold">
                    Included
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {model.included.map((x, i) => (
                    <li key={i} className="text-[12.5px] text-[rgb(var(--fg-muted))] leading-relaxed flex gap-2">
                      <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-emerald-500 shrink-0" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {model.addOns && model.addOns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-3.5 w-3.5 text-cisco-600 dark:text-cisco-300" />
                  <span className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-cisco-700 dark:text-cisco-300 font-semibold">
                    Add-ons
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {model.addOns.map((x, i) => (
                    <li key={i} className="text-[12.5px] text-[rgb(var(--fg-muted))] leading-relaxed flex gap-2">
                      <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-cisco-500 shrink-0" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {model.references && model.references.length > 0 && (
        <div className="text-[11.5px] text-[rgb(var(--fg-muted))] flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono uppercase tracking-wider text-[10.5px]">References</span>
          {model.references.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2 decoration-[rgb(var(--border))] hover:text-cisco-600 dark:hover:text-cisco-300 hover:decoration-current"
            >
              {r.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
