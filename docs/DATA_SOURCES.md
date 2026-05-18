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

### 3. `keells.com` / `stores.keellssuper.com`

- Status: **Playwright** (headless Chromium in Docker)
- Why: SPA catalog; server HTML insufficient for product cards
- Ingestion: navigate category URLs, wait for product selectors, parse rendered DOM
- Config: `KEELLS_ENABLED` (when added to `source_sync.py`)

### 4. `cargillsonline.com` / Cargills Food City

- Status: **Playwright** (same stack as Keells)
- Why: JS-driven product grid
- Ingestion: category URLs + DOM selectors after render
- Config: `CARGILLS_ENABLED` (when added to `source_sync.py`)

See also: [`backend/README.md`](../backend/README.md) for sync commands and Docker browser install.

## Official market quotes

- **WFP** — historical and current commodity quotes
- **CBSL** — Department of Economic Research bulletins (monthly patterns)
- **DCS** — Department of Census and Statistics weekly prices

Synced via `run_official_market_sync.py` / `run_market_sync.py`. Remote override: `MARKET_QUOTES_URL`.

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
