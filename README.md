# Matrix — Cisco Industrial IoT Compete

> When a customer says **&ldquo;they do it better,&rdquo;** show them why Cisco does it best.

Matrix is a sales-enablement web app for Cisco Industrial IoT (IIoT) sellers. Pick the competitor a customer brought up, choose the product, and get a polished battlecard — recommended Cisco counter-product, side-by-side specs, talk track, proof points, known competitor issues, and reference wins.

**v1 (this repo): UI-first.** Battlecards are authored as mocked JSON so the look and flow are finalized before wiring live data sources. The orchestrator + MCP clients are stubbed and ready to drop in.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a custom design system (Apple-like surfaces, glass, soft shadows)
- **Framer Motion** for entrance animations
- **lucide-react** icons
- No external CMS — battlecards live in `src/data/battlecards.ts` (mocked in v1)

## Quick start

```bash
# 1. install
npm install

# 2. dev server
npm run dev
# → http://localhost:3000

# 3. type-check / build
npm run typecheck
npm run build
```

## Project tour

```
src/
  app/
    layout.tsx                          # Theme provider, top nav, footer
    page.tsx                            # Landing: hero + competitor grid
    competitor/[slug]/page.tsx          # Competitor lineup picker
    compare/[competitor]/[product]/page.tsx  # The battlecard
    portfolio/page.tsx                  # Cisco IIoT product catalog
    about/page.tsx                      # How Matrix builds a battlecard
    api/battlecard/route.ts             # GET /api/battlecard?competitor=&product=
  components/                           # Reusable UI (cards, table, talk track, ...)
  data/
    competitors.ts                      # 8 competitors + their key product lines
    cisco-iiot.ts                       # Cisco IIoT product catalog
    battlecards.ts                      # Mocked battlecards (authored)
  lib/
    orchestrator.ts                     # Fan-out + Circuit synthesizer (mock vs live)
    mcp/
      circuit.ts                        # Cisco Circuit (Chat + RAG) client stub
      cisco-docs.ts                     # Cisco Docs MCP client stub
      cdets.ts                          # CDETS MCP client stub
      webex.ts                          # Webex MCP client stub
      public-web.ts                     # Competitor public web fetcher stub
    types.ts                            # `Battlecard` and friends
```

## Wiring live data (v2)

1. Copy `.env.example` to `.env.local` and fill in the variables you have access to.
2. Set `USE_MOCK_BATTLECARDS=false`.
3. Implement the TODOs in each `src/lib/mcp/*.ts` — each function already has the signature the orchestrator expects. The UI does **not** change.

### Cisco Circuit AI (already wired)

The general Cisco Circuit chat API is wired in [src/lib/mcp/circuit.ts](src/lib/mcp/circuit.ts) (OAuth2 client_credentials → Bearer → OpenAI-compatible `/chat/completions`). Required env vars in `.env.local`:

```bash
CIRCUIT_CLIENT_ID=...
CIRCUIT_CLIENT_SECRET=...
CIRCUIT_APP_KEY=...
CIRCUIT_MODEL=gpt-5-nano
CIRCUIT_TOKEN_URL=https://id.cisco.com/oauth2/default/v1/token
CIRCUIT_BASE_URL=https://chat-ai.cisco.com/openai/deployments
USE_MOCK_BATTLECARDS=false
```

Behavior with `USE_MOCK_BATTLECARDS=false`:

- Authored mocks (the 8 in `data/battlecards.ts`) still serve **instantly** — no network call.
- The other competitor:product pairs are synthesized live by Circuit on demand and the UI shows a **&ldquo;Synthesized live · Cisco Circuit&rdquo;** badge so the seller can see it&rsquo;s AI-generated.
- Cisco internal search / RAG is awaiting access approval; `circuitRagQuery()` returns `[]` for now and the synthesis runs on model knowledge plus whatever MCP grounding is plumbed.

### Recommended order for the remaining sources

| Order | Source | Why |
| --- | --- | --- |
| 1 | **Cisco Circuit** | The synthesizer. Without it the orchestrator just returns retrieval hits. |
| 2 | **Cisco Docs MCP** | Authoritative spec + datasheet grounding. Highest signal. |
| 3 | **Public Web fetcher** | Competitor datasheets and PSIRT feeds. Cache 24h. |
| 4 | **Webex MCP** | Win wires and tribal knowledge from Compete spaces. |
| 5 | **CDETS MCP** | Optional, used to flag known Cisco-side issues so we don't pitch into a bug. |

### Schema contract

Every source path — mock or live — must return objects that conform to the `Battlecard` interface in [src/lib/types.ts](src/lib/types.ts). If you change the schema, add a `zod` validator in `orchestrator.ts` before returning Circuit-generated cards.

## Adding a battlecard manually

1. Add the competitor product to `src/data/competitors.ts` if it isn&rsquo;t there yet.
2. Append a new entry to `BATTLECARDS` in `src/data/battlecards.ts`, keyed `"${competitorSlug}:${productSlug}"`.
3. Pick the Cisco recommendation from `src/data/cisco-iiot.ts` (`primarySlug` + `bundleSlugs`).
4. Reload — the lineup card on the competitor page will flip from &ldquo;Stub&rdquo; to &ldquo;Battlecard ready.&rdquo;

## Design notes

- **Apple-like surfaces**: rounded-3xl, soft shadows, glass nav, light/dark with system follow.
- **Cisco accent only** at the recommendation side of the split hero and on win signals (badges, pillar icons).
- Competitor product imagery is rendered as a stylized SVG (`components/product-glyph.tsx`) instead of shipping vendor assets. Swap to real images by replacing `<ProductGlyph />` with `<Image>` and dropping files into `public/products/`.

## Security and IP

- No vendor logos or trademarked artwork ship with this repo — only a short text mark per competitor.
- Public-web fetcher (when wired) must respect robots.txt and cache rather than scrape on every request.
- Internal MCP responses (Circuit, CDETS, Webex) must never be cached to disk in production builds.

## Roadmap

- [x] Wire Cisco Circuit Chat (general AI synthesizer)
- [ ] Wire Cisco Circuit RAG (internal search — pending access approval)
- [ ] Wire Cisco Docs MCP (datasheet grounding)
- [ ] Wire CDETS MCP (Cisco-side defect awareness)
- [ ] Wire Webex MCP (Compete-space win wires)
- [ ] Public-web fetcher with per-vendor adapters + 24h cache
- [ ] PDF export of a battlecard (one click → leave-behind)
- [ ] Customer-context inputs (industry, region, deal size) to bias the recommendation
- [ ] Salesforce / CCW integration to drop the recommended bundle straight into a quote
