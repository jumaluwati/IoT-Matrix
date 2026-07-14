import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { CISCO_LIST } from "@/data/cisco-iiot";
import { ProductGlyph } from "@/components/product-glyph";
import { Badge } from "@/components/ui/badge";

export default function PortfolioPage() {
  const grouped = CISCO_LIST.reduce<Record<string, typeof CISCO_LIST>>((acc, p) => {
    (acc[p.category] ||= []).push(p);
    return acc;
  }, {});

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
        <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-2">
              Cisco · IIoT Portfolio
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              The products you&rsquo;ll quote.
            </h1>
            <p className="mt-3 text-[rgb(var(--fg-muted))] max-w-2xl">
              Curated reference of the Cisco Industrial IoT line. Click any product for the full
              data sheet, license tiers, and what to lead with against each competitor.
            </p>
          </div>
          <Link
            href="/portfolio/compare"
            className="inline-flex items-center gap-1.5 self-start md:self-auto rounded-full bg-cisco-500 text-white shadow-glow hover:bg-cisco-600 px-4 py-2 text-sm font-medium"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Compare two Cisco products
          </Link>
        </div>
      </section>

      <section className="container pb-24 space-y-12">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-xl font-semibold tracking-tight">{category}</h2>
              <span className="text-xs text-[rgb(var(--fg-muted))]">
                {items.length} product{items.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((p) => (
                <Link
                  key={p.slug}
                  href={`/portfolio/${p.slug}`}
                  className="group rounded-3xl surface shadow-soft overflow-hidden ring-1 ring-transparent hover:ring-cisco-500/40 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="aspect-[16/9] relative">
                    <ProductGlyph category={p.category} brand="#049fd9" />
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[rgb(var(--bg-elev))]/90 ring-1 ring-[rgb(var(--border))] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--fg-muted))] opacity-0 group-hover:opacity-100 transition-opacity">
                      View details
                      <ArrowUpRight className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[11px] uppercase tracking-wider text-[rgb(var(--fg-muted))]">
                      {p.family}
                    </div>
                    <div className="mt-1 text-lg font-semibold tracking-tight group-hover:text-cisco-600 dark:group-hover:text-cisco-300 transition-colors">
                      {p.name}
                    </div>
                    <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">{p.oneLiner}</p>
                    <ul className="mt-4 space-y-1.5">
                      {p.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="text-xs text-[rgb(var(--fg-muted))] flex gap-2"
                        >
                          <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-cisco-500 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge tone="cisco">{p.category}</Badge>
                      <span className="text-[11px] text-[rgb(var(--fg-muted))] inline-flex items-center gap-1 group-hover:text-cisco-600 dark:group-hover:text-cisco-300 transition-colors">
                        Open
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
