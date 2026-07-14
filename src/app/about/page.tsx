import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  FileText,
  Database,
  Zap,
  Layers,
  ShieldCheck,
  Sparkles,
  Clock,
  HardDrive
} from "lucide-react";
import { COMPETITORS } from "@/data/competitors";
import { CISCO_LIST } from "@/data/cisco-iiot";
import { BATTLECARDS } from "@/data/battlecards";

const competitorCount = COMPETITORS.length;
const ciscoProductCount = CISCO_LIST.length;
const authoredCount = Object.keys(BATTLECARDS).length;

export default function AboutPage() {
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
        <div className="mt-6 max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-2">
            About
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Matrix turns compete moments into closed deals.
          </h1>
          <p className="mt-4 text-[rgb(var(--fg-muted))] text-lg">
            When a customer says &ldquo;Nokia / Aruba / Fortinet does it better,&rdquo; the worst answer
            is &ldquo;let me get back to you with a presentation.&rdquo; Matrix gives Cisco IIoT sellers
            a Cisco-grounded answer in seconds.
          </p>
        </div>
      </section>

      {/* AT-A-GLANCE */}
      <section className="container pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: competitorCount, label: "competitors covered" },
            { value: ciscoProductCount, label: "Cisco SKUs in catalog" },
            { value: authoredCount, label: "hand-authored battlecards" },
            { value: "Live", label: "Cisco Docs + RAG sections" }
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl surface shadow-soft p-4 ring-1 ring-[rgb(var(--border))]"
            >
              <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
              <div className="mt-1 text-[12px] text-[rgb(var(--fg-muted))]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW A BATTLECARD IS BUILT — reflects what's actually wired today */}
      <section className="container pb-12">
        <div className="rounded-3xl surface shadow-soft p-6 md:p-8">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-3">
            <Layers className="h-3.5 w-3.5" />
            Data sources
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
            How a battlecard is built
          </h2>
          <p className="mt-2 text-sm text-[rgb(var(--fg-muted))] max-w-2xl">
            Every compare page stacks three layers of Cisco-grounded content. Hand-authored
            cards load instantly; live sources stream in over Suspense and cache to disk so the
            second visit is sub-second.
          </p>
          <ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                title: "Hand-authored battlecards",
                body: "Curated by Cisco IIoT sales engineers. Pillars, talk track, spec table, risk + wins, TCO insight. Loads instantly.",
                icon: <FileText className="h-4 w-4" />,
                status: `${authoredCount} pairs · static`
              },
              {
                step: "02",
                title: "Cisco Circuit (gpt-4 class)",
                body: "Synthesizes a full battlecard JSON when no authored card exists. OAuth via id.cisco.com, grounded with Cisco Docs context. Cached 1h on disk.",
                icon: <Brain className="h-4 w-4" />,
                status: "Live · ~60-90s cold, <1s cached"
              },
              {
                step: "03",
                title: "Cisco Docs AI + RAG",
                body: "Live highlights, competitor gaps, license tiers. docs-ai.cloudapps.cisco.com for highlights/gaps; chat-ai.cisco.com (genai-ext-rag) for licensing.",
                icon: <Database className="h-4 w-4" />,
                status: "Live · streams in · 1h disk cache"
              }
            ].map((s) => (
              <li
                key={s.step}
                className="rounded-2xl border border-[rgb(var(--border))] p-4 bg-[rgb(var(--bg-elev))]"
              >
                <div className="flex items-center gap-2 text-cisco-600 dark:text-cisco-300">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-cisco-500/10">
                    {s.icon}
                  </span>
                  <span className="font-mono text-[10px] tracking-wider">{s.step}</span>
                </div>
                <div className="mt-2 text-sm font-semibold">{s.title}</div>
                <div className="mt-1.5 text-xs text-[rgb(var(--fg-muted))] leading-relaxed">{s.body}</div>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-cisco-500/10 ring-1 ring-cisco-500/30 text-cisco-700 dark:text-cisco-300 px-2 py-0.5 text-[10px] font-mono tracking-wider">
                  {s.status}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* HOW THE PAGE LOADS */}
      <section className="container pb-12">
        <div className="rounded-3xl surface shadow-soft p-6 md:p-8">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-3">
            <Clock className="h-3.5 w-3.5" />
            Page-load envelope
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
            What to expect when you open a compare page
          </h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl ring-1 ring-[rgb(var(--border))] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-3.5 w-3.5 text-cisco-600 dark:text-cisco-300" />
                <span className="text-sm font-semibold">Cached visit (any pair you&rsquo;ve opened before)</span>
              </div>
              <ul className="text-xs text-[rgb(var(--fg-muted))] space-y-1 leading-relaxed">
                <li>· Battlecard hero + pillars + specs: instant.</li>
                <li>· Live highlights / gaps / licensing: instant from <code className="text-[10px] px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">.cache/</code>.</li>
                <li>· Total: ~0.7s.</li>
              </ul>
            </div>
            <div className="rounded-2xl ring-1 ring-amber-500/30 bg-amber-500/[0.04] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
                <span className="text-sm font-semibold">Cold visit (first time for a pair)</span>
              </div>
              <ul className="text-xs text-[rgb(var(--fg-muted))] space-y-1 leading-relaxed">
                <li>· Hand-authored pair: instant. Synthesized pair: ~60-90s for Circuit JSON.</li>
                <li>· Docs/Gaps cards: stream in independently, ~10-25s each.</li>
                <li>· Licensing tiers: ~30-60s from Cisco RAG.</li>
                <li className="text-[rgb(var(--fg))] font-medium">· Tip: run <code className="text-[10px] px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">npm run prewarm</code> overnight to pre-fill every cache.</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 rounded-2xl ring-1 ring-[rgb(var(--border))] p-4 bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-3.5 w-3.5 text-[rgb(var(--fg-muted))]" />
              <span className="text-sm font-semibold">Disk caches (gitignored, survive dev-server restarts)</span>
            </div>
            <ul className="text-xs text-[rgb(var(--fg-muted))] space-y-1 leading-relaxed font-mono">
              <li>· <code>.cache/battlecards.json</code> — Circuit-synthesized cards, 1h TTL</li>
              <li>· <code>.cache/cisco-docs.json</code> — Docs AI answers (highlights + gaps), 1h TTL</li>
              <li>· <code>.cache/cisco-rag.json</code> — RAG answers (licensing), 1h TTL</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ENV + VPN */}
      <section className="container pb-24">
        <div className="rounded-3xl surface shadow-soft p-6 md:p-8">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            Network + config
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
            What you need running
          </h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl ring-1 ring-[rgb(var(--border))] p-4">
              <div className="font-semibold mb-2">Cisco corporate VPN</div>
              <p className="text-xs text-[rgb(var(--fg-muted))] leading-relaxed">
                Required for <span className="font-mono">docs-ai.cloudapps.cisco.com</span>,{" "}
                <span className="font-mono">chat-ai.cisco.com</span> and{" "}
                <span className="font-mono">id.cisco.com</span>. Without VPN the Live highlights,
                Gaps, and Licensing sections silently render nothing (errors logged in dev terminal,
                no orphan headers shown).
              </p>
            </div>
            <div className="rounded-2xl ring-1 ring-[rgb(var(--border))] p-4">
              <div className="font-semibold mb-2"><code className="text-[12px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">.env.local</code></div>
              <p className="text-xs text-[rgb(var(--fg-muted))] leading-relaxed">
                <span className="font-mono">CIRCUIT_*</span> (7 vars) drives Circuit synthesis.{" "}
                <span className="font-mono">CISCO_DOCS_API_KEY</span> drives highlights + gaps.{" "}
                <span className="font-mono">CISCO_RAG_APP_ID</span> +{" "}
                <span className="font-mono">CISCO_RAG_USER_ID</span> drive licensing (auth reuses
                Circuit creds by default). Sections silently skip when their env block is missing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
