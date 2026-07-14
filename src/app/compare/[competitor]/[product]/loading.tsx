/**
 * Loading skeleton for /compare/[competitor]/[product].
 * Renders the page's silhouette while battlecard + Cisco Docs prefetch resolve.
 * Next.js shows this automatically during navigation; on the second visit
 * (cached) it flashes briefly then disappears.
 */
export default function Loading() {
  return (
    <>
      {/* Breadcrumb skeleton */}
      <div className="container pt-10">
        <div className="h-3 w-64 rounded bg-[rgb(var(--border))]/40 animate-pulse" />
      </div>

      {/* Split hero skeleton */}
      <section className="container pt-6 pb-10">
        <div className="rounded-[2.25rem] surface shadow-soft overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Competitor side */}
            <div className="p-8 md:p-10 space-y-5">
              <div className="h-3 w-20 rounded bg-[rgb(var(--border))]/50 animate-pulse" />
              <div className="h-9 w-3/4 rounded-lg bg-[rgb(var(--border))]/40 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-[rgb(var(--border))]/30 animate-pulse" />
              <div className="pt-8">
                <div className="aspect-[16/9] rounded-2xl bg-[rgb(var(--border))]/25 animate-pulse" />
                <div className="mt-5 flex gap-2">
                  <div className="h-6 w-24 rounded-full bg-[rgb(var(--border))]/30 animate-pulse" />
                  <div className="h-6 w-32 rounded-full bg-[rgb(var(--border))]/30 animate-pulse" />
                </div>
              </div>
            </div>
            {/* Cisco side */}
            <div className="p-8 md:p-10 space-y-5 bg-gradient-to-br from-cisco-500/5 via-transparent to-indigo-500/5">
              <div className="h-3 w-32 rounded bg-cisco-500/20 animate-pulse" />
              <div className="h-9 w-3/4 rounded-lg bg-cisco-500/15 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-cisco-500/10 animate-pulse" />
              <div className="pt-8">
                <div className="aspect-[16/9] rounded-2xl bg-cisco-500/10 animate-pulse" />
                <div className="mt-5 flex gap-2">
                  <div className="h-6 w-24 rounded-full bg-cisco-500/15 animate-pulse" />
                  <div className="h-6 w-32 rounded-full bg-cisco-500/10 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          {/* Recommendation strip */}
          <div className="border-t border-[rgb(var(--border))] p-6 md:p-8 flex items-center gap-4">
            <div className="h-6 w-32 rounded-full bg-[rgb(var(--border))]/30 animate-pulse" />
            <div className="flex-1 h-4 rounded bg-[rgb(var(--border))]/20 animate-pulse" />
            <div className="h-10 w-36 rounded-full bg-cisco-500/30 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Content blocks skeleton */}
      <section className="container py-12 space-y-8">
        <div className="space-y-3">
          <div className="h-3 w-32 rounded bg-cisco-500/20 animate-pulse" />
          <div className="h-7 w-1/3 rounded bg-[rgb(var(--border))]/40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl surface shadow-soft p-6 space-y-3">
              <div className="h-9 w-9 rounded-xl bg-cisco-500/15 animate-pulse" />
              <div className="h-5 w-2/3 rounded bg-[rgb(var(--border))]/40 animate-pulse" />
              <div className="h-4 w-full rounded bg-[rgb(var(--border))]/25 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-[rgb(var(--border))]/25 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
