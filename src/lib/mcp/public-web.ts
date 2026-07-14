/**
 * Public-web fetcher (stub).
 *
 * For competitor datasheets, advisories, and analyst snippets.
 * Real implementation should:
 *   - Use a server-side fetcher (no client browser scraping)
 *   - Respect robots.txt
 *   - Cache aggressively (24h) — competitor datasheets don't change daily
 *   - Strip HTML to clean text before sending to Circuit
 */

export interface PublicWebHit {
  title: string;
  url: string;
  snippet: string;
  publishedISO?: string;
}

export async function fetchCompetitorContext(competitorSlug: string, productSlug: string): Promise<PublicWebHit[]> {
  // TODO: implement scheduled fetcher with per-vendor adapters
  return [];
}
