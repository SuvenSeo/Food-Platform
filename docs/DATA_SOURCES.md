# Data Sources

## Retail (grocery)

### 1. `spar2u.lk`

- Status: **active** (httpx + `products.json` feed)
- Ingestion: paginated JSON catalog; category discovery fallback
- Config: `SPAR2U_ENABLED` (default `true`)

### 2. `glomark.lk`

- Status: **active** (httpx + HTML listing parse)
- Ingestion: category pages, product cards
- Config: `GLOMARK_ENABLED` (default `true`)

### 3. `keellssuper.com`

- Status: **active** (guest JSON data collection endpoint)
- Why: current SPA hydrates public product modules via `zebraliveback.keellssuper.com`
- Ingestion: guest session, preferred outlet, homepage product modules with rendered HTML fallback
- Config: `KEELLS_ENABLED` (default `true`)

### 4. `cargillsonline.com` / Cargills Food City

- Status: **active** (JSON dynamic section endpoint)
- Why: current site exposes homepage product modules via `/Web/GetDynamicSection/`
- Ingestion: dynamic product sections with rendered HTML fallback
- Config: `CARGILLS_ENABLED` (default `true`)

See also: [`backend/README.md`](../backend/README.md) for sync commands and Docker browser install.

## Official market quotes

- **WFP** — historical and current commodity quotes
- **CBSL** — Central Bank daily price reports for selected commodities
- **DOA / SHEP** — Department of Agriculture InfoHub daily vegetable prices for Manning and Dambulla wholesale/retail series
- **DCS** — Department of Census and Statistics weekly prices
- **HARTI** — daily food commodities bulletin with multi-market vegetable and fruit tables

Synced via `run_official_market_sync.py` / `run_market_sync.py`. Remote override: `MARKET_QUOTES_URL`.

### Current official source health

| Source | Status | Notes |
| --- | --- | --- |
| `wfp` | Active | HDX CSV; strongest historical coverage. |
| `cbsl` | Active | Latest daily PDF parser; good for selected commodities. |
| `doa` | Active | WordPress JSON endpoint behind the public SHEP charts; vegetable-focused. |
| `dcs` | Active | Weekly DCS wrapper/PDF discovery with table extraction for Colombo District open-market retail prices. |
| `harti` | Active | Daily English HARTI food commodities bulletin PDF; strong multi-market vegetable and fruit coverage. |

## Candidate sources to evaluate next

These are not wired into production sync yet. They need terms/robots review, schema probing, and source-quality scoring before ingestion.

| Source | Candidate value | Initial technical note |
| --- | --- | --- |
| `vegeservice.lk` | Daily vegetable prices and history | Has public `/api/prices?date=...`; current probe returned empty for today, so needs date-range probing. |
| `thambuttegamadec.lk` / `app.thambuttegamadec.lk` | Official Thambuttegama Dedicated Economic Centre daily prices | Public site links to a digital price app; needs route/API discovery. |
| `welandapola.com` | Retail and market price index across food categories | Next.js app exposes rendered current vegetable rows; verify data provenance before using. |
| Other dedicated economic centres | Market-level wholesale quotes | The Thambuttegama site lists Dambulla, Nuwara Eliya, Narahenpita, Welisara, Veyangoda, Ratmalana, Meegoda, Kandehandiya, and Keppetipola contacts/links; each needs discovery. |

## Source selection rule

Per-source feature flags must allow disabling a source without code deploy if robots, terms, or stability change.

## Operational guardrails

- Descriptive user agent (`SCRAPER_USER_AGENT`)
- Per-source timeouts and item caps (`SCRAPE_MAX_ITEMS_PER_SOURCE`)
- Raw payload retention → normalized `food_offers` / `market_quotes`
- Daily (or lower) scrape cadence; no checkout/login automation

## Compliance

- Do not automate cart, checkout, or payment flows
- Respect `robots.txt` and site terms; stop on owner request
