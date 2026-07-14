import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "Matrix · Cisco IIoT Compete",
  description:
    "Instant, source-grounded battlecards for Cisco Industrial IoT sales. Pick a competitor — get the Cisco win story in seconds.",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <div className="relative min-h-screen">
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 -z-10 bg-grid-fade"
            />
            <TopNav />
            <main>{children}</main>
            <footer className="border-t border-[rgb(var(--border))] mt-24">
              <div className="container py-8 text-xs text-[rgb(var(--fg-muted))] flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
                <span>
                  Matrix is an internal sales enablement prototype. Hand-authored battlecards are
                  blended live with Cisco Circuit, Cisco Docs AI, and Cisco RAG content over VPN.
                </span>
                <span className="font-mono">v0.1.0 · prototype</span>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
