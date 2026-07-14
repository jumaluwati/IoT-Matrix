import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
  {
    variants: {
      tone: {
        neutral: "bg-black/[0.06] text-[rgb(var(--fg-muted))] dark:bg-white/[0.06]",
        cisco: "bg-cisco-500/10 text-cisco-700 dark:text-cisco-300 ring-1 ring-cisco-500/30",
        win: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30",
        warn: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30",
        risk: "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30"
      }
    },
    defaultVariants: { tone: "neutral" }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
