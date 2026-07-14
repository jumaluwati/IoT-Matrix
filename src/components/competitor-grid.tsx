import { COMPETITORS } from "@/data/competitors";
import { CompetitorCard } from "./competitor-card";

export function CompetitorGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {COMPETITORS.map((c, i) => (
        <CompetitorCard key={c.slug} competitor={c} index={i} />
      ))}
    </div>
  );
}
