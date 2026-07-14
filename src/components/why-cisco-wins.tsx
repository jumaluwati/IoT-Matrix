"use client";

import { motion } from "framer-motion";
import { PillarIcon } from "@/components/pillar-icon";
import type { WinPillar } from "@/lib/types";

interface Props {
  pillars: WinPillar[];
}

export function WhyCiscoWinsGrid({ pillars }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pillars.map((p, i) => (
        <motion.div
          key={p.title}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
          className="group relative overflow-hidden rounded-3xl surface shadow-soft p-6"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(closest-side, rgba(4,159,217,0.18), transparent)"
            }}
          />
          <div className="relative">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cisco-500/10 text-cisco-600 dark:text-cisco-300 ring-1 ring-cisco-500/20">
              <PillarIcon name={p.icon} className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">{p.title}</h3>
            <p className="mt-2 text-sm text-[rgb(var(--fg-muted))] leading-relaxed">{p.body}</p>
            {p.proof && (
              <div className="mt-4 rounded-xl border border-dashed border-[rgb(var(--border))] px-3 py-2 text-xs text-[rgb(var(--fg-muted))]">
                <span className="font-mono uppercase tracking-wider text-[10px] text-cisco-600 dark:text-cisco-300 mr-2">
                  Proof
                </span>
                {p.proof}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
