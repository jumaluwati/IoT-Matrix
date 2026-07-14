import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Compass } from "lucide-react";
import { CISCO_LIST } from "@/data/cisco-iiot";
import { USE_CASES, ciscoProductsForUseCase } from "@/data/use-cases";

export const metadata = {
  title: "Use cases · Matrix",
  description: "Find the best Cisco Industrial IoT devices for each industry use case."
};

export default function UseCasesIndexPage() {
  const taggedCount = CISCO_LIST.filter((p) => (p.useCases ?? []).length > 0).length;

  return (
    <>
      <section className="container pt-12 pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <div className="mt-6">
          <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-2">
            Cisco · IIoT by use case
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            What are you deploying?
          </h1>
          <p className="mt-3 text-[rgb(var(--fg-muted))] max-w-2xl">
            Every Cisco Industrial IoT SKU is tagged by the environments it&rsquo;s built for. Pick a
            use case to see the devices to lead with &mdash; and the competitors you&rsquo;ll displace.
          </p>
          <p className="mt-2 text-xs text-[rgb(var(--fg-muted))] font-mono">
            {taggedCount} devices grouped across {USE_CASES.length} use cases
          </p>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {USE_CASES.map((u) => {
            const products = ciscoProductsForUseCase(u.label);
            const Icon = u.icon;
            return (
              <Link
                key={u.slug}
                href={`/use-cases/${u.slug}`}
                className="group rounded-3xl surface shadow-soft p-6 ring-1 ring-transparent hover:ring-cisco-500/40 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1"
                    style={{ backgroundColor: `${u.accent}1a`, color: u.accent, borderColor: `${u.accent}40` }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[rgb(var(--fg-muted))] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-tight group-hover:text-cisco-600 dark:group-hover:text-cisco-300 transition-colors">
                  {u.label}
                </h2>
                <p className="mt-2 text-sm text-[rgb(var(--fg-muted))] leading-relaxed">{u.blurb}</p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {products.slice(0, 4).map((p) => (
                    <span
                      key={p.slug}
                      className="inline-flex items-center rounded-full bg-black/[0.05] dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-[rgb(var(--fg-muted))]"
                    >
                      {p.name}
                    </span>
                  ))}
                  {products.length > 4 && (
                    <span className="text-[10px] font-mono text-[rgb(var(--fg-muted))]">
                      +{products.length - 4} more
                    </span>
                  )}
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-cisco-600 dark:text-cisco-300">
                  <Compass className="h-3.5 w-3.5" />
                  {products.length} recommended device{products.length === 1 ? "" : "s"}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
