import { MessageCircle, Search, Sparkles, Handshake } from "lucide-react";
import type { TalkTrack as T } from "@/lib/types";

export function TalkTrack({ talk }: { talk: T }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Block icon={<MessageCircle className="h-4 w-4" />} title="Opener" tone="cisco">
        <p className="text-base leading-relaxed">&ldquo;{talk.opener}&rdquo;</p>
      </Block>
      <Block icon={<Search className="h-4 w-4" />} title="Discovery questions">
        <ol className="space-y-2 text-sm">
          {talk.discovery.map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-mono text-xs text-[rgb(var(--fg-muted))] pt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{d}</span>
            </li>
          ))}
        </ol>
      </Block>
      <Block icon={<Sparkles className="h-4 w-4" />} title="Proof points">
        <ul className="space-y-2 text-sm">
          {talk.proofPoints.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cisco-500 shrink-0" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Block>
      <Block icon={<Handshake className="h-4 w-4" />} title="Closer" tone="cisco">
        <p className="text-base leading-relaxed">&ldquo;{talk.closer}&rdquo;</p>
      </Block>
    </div>
  );
}

function Block({
  icon,
  title,
  children,
  tone
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  tone?: "cisco";
}) {
  return (
    <div
      className={`rounded-3xl surface shadow-soft p-6 ${
        tone === "cisco" ? "ring-1 ring-cisco-500/20" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-cisco-600 dark:text-cisco-300">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cisco-500/10">
          {icon}
        </span>
        <span className="text-xs uppercase tracking-wider font-semibold">{title}</span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
