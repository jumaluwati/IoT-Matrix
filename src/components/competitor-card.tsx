"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Competitor } from "@/lib/types";

interface Props {
  competitor: Competitor;
  index?: number;
}

export function CompetitorCard({ competitor: c, index = 0 }: Props) {
  const accent = c.color;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 + index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/competitor/${c.slug}`}
        className="group relative block h-full overflow-hidden rounded-3xl surface shadow-soft hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] transition-all duration-300"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity"
          style={{
            background: `radial-gradient(120% 80% at 100% 0%, ${accent}22 0%, transparent 60%)`
          }}
        />
        <div className="relative p-6 flex h-full flex-col gap-5">
          <div className="flex items-start justify-between">
            <span
              className="text-[10px] font-mono tracking-[0.18em] text-[rgb(var(--fg-muted))]"
              style={{ color: accent }}
            >
              {c.logoMark}
            </span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-[rgb(var(--fg-muted))] group-hover:bg-cisco-500 group-hover:text-white transition-colors">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight">{c.name}</h3>
            <p className="text-sm text-[rgb(var(--fg-muted))] leading-relaxed">{c.tagline}</p>
          </div>
          <div className="mt-auto pt-4 border-t border-dashed border-[rgb(var(--border))]">
            <div className="text-[11px] uppercase tracking-wider text-[rgb(var(--fg-muted))] mb-2">
              Product families
            </div>
            <div className="flex flex-wrap gap-1.5">
              {c.products.slice(0, 4).map((p) => (
                <span
                  key={p.slug}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.06]"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
