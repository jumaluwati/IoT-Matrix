import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40">
      <div className="glass border-b border-[rgb(var(--border))]">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="group inline-flex items-center gap-2">
            <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-cisco-400 to-indigo-500 shadow-glow">
              <span className="text-[11px] font-bold text-white">M</span>
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Matrix <span className="text-[rgb(var(--fg-muted))] font-normal">· IIoT Compete</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link className="px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]" href="/">
              Competitors
            </Link>
            <Link className="px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]" href="/portfolio">
              Cisco Portfolio
            </Link>
            <Link className="px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]" href="/use-cases">
              Use Cases
            </Link>
            <Link className="px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]" href="/about">
              About
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
