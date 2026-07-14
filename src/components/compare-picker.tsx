"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ArrowLeftRight, X } from "lucide-react";
import type { CiscoProduct } from "@/lib/types";

/**
 * Two-product picker for the Cisco-vs-Cisco compare route. URL is the source
 * of truth (`?a=ie3400&b=ie3500`) so the comparison is shareable + the server
 * component can fetch the RAG answer for the right pair.
 *
 * Why a client component: we want the pickers to update the URL without a
 * full page transition for snappier UX. Pure server-side dropdowns would
 * force a navigation on every change.
 */
export function ComparePicker({
  catalog,
  initialA,
  initialB
}: {
  catalog: { slug: string; name: string; category: CiscoProduct["category"]; family: string }[];
  initialA?: string;
  initialB?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const a = initialA ?? params?.get("a") ?? "";
  const b = initialB ?? params?.get("b") ?? "";

  const updateUrl = useCallback(
    (nextA: string, nextB: string) => {
      const next = new URLSearchParams();
      if (nextA) next.set("a", nextA);
      if (nextB) next.set("b", nextB);
      const q = next.toString();
      router.push(q ? `/portfolio/compare?${q}` : "/portfolio/compare");
    },
    [router]
  );

  const swap = () => updateUrl(b, a);
  const clear = (which: "a" | "b") => updateUrl(which === "a" ? "" : a, which === "b" ? "" : b);

  // Group catalog by category so the select grouping is meaningful.
  const grouped = catalog.reduce<Record<string, typeof catalog>>((acc, p) => {
    (acc[p.category] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl surface shadow-soft ring-1 ring-[rgb(var(--border))] p-4 md:p-5">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <PickerSelect
          label="Product A"
          value={a}
          grouped={grouped}
          onChange={(v) => updateUrl(v, b)}
          onClear={() => clear("a")}
        />
        <div className="flex justify-center pb-1">
          <button
            type="button"
            onClick={swap}
            disabled={!a || !b}
            title="Swap A and B"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full ring-1 ring-[rgb(var(--border))] hover:ring-cisco-500/40 hover:bg-cisco-500/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-cisco-600 dark:text-cisco-300"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <PickerSelect
          label="Product B"
          value={b}
          grouped={grouped}
          onChange={(v) => updateUrl(a, v)}
          onClear={() => clear("b")}
        />
      </div>
      {a && b && a === b && (
        <p className="mt-3 text-[12px] text-amber-700 dark:text-amber-300">
          Same product on both sides &mdash; pick a different SKU for column B.
        </p>
      )}
    </div>
  );
}

function PickerSelect({
  label,
  value,
  grouped,
  onChange,
  onClear
}: {
  label: string;
  value: string;
  grouped: Record<string, { slug: string; name: string; category: CiscoProduct["category"]; family: string }[]>;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className="block text-[10.5px] font-mono uppercase tracking-[0.12em] text-[rgb(var(--fg-muted))] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg ring-1 ring-[rgb(var(--border))] bg-black/[0.02] dark:bg-white/[0.02] focus:ring-cisco-500/40 focus:bg-[rgb(var(--bg-elev))] transition-colors px-3 py-2.5 pr-9 text-[13px] outline-none cursor-pointer"
        >
          <option value="">Select a product…</option>
          {Object.entries(grouped).map(([cat, items]) => (
            <optgroup key={cat} label={cat}>
              {items.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} {p.family ? `(${p.family})` : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {value && (
          <button
            type="button"
            onClick={onClear}
            title="Clear"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-6 w-6 rounded text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Tiny client-side "Compare" pill rendered on portfolio detail pages so the
 * seller can jump straight from one product into the A-vs-B compare with A
 * pre-filled.
 */
export function CompareThisCta({ slug }: { slug: string }) {
  return (
    <Link
      href={`/portfolio/compare?a=${slug}`}
      className="inline-flex items-center gap-1.5 rounded-full ring-1 ring-cisco-500/40 text-cisco-700 dark:text-cisco-300 hover:bg-cisco-500/5 px-3 py-1.5 text-[12px] font-medium transition-colors"
    >
      <ArrowLeftRight className="h-3.5 w-3.5" />
      Compare against another Cisco
    </Link>
  );
}
