# Data Sources

## Phase 1 MVP sources

### 1. `spar2u.lk`

- Status: approved for Phase 1 implementation
- Why:
  - Public grocery catalog with item names and prices on category pages.
  - Public `products.json` feed is accessible, which makes ingestion more reliable than brittle DOM scraping.
  - `robots.txt` allows catalog crawling and mainly blocks checkout, account, cart, search, and policy paths.
- Ingestion approach:
  - Prefer `https://spar2u.lk/products.json?limit=250&page=N` style pulls where possible.
  - Fall back to collection pages only for category discovery or enrichment.
- Compliance notes:
  - Do not touch checkout, cart, account, or payment flows.
  - Use a descriptive user agent and conservative rate limiting.
  - Cache responses and run on a schedule rather than aggressive polling.

### 2. `glomark.lk`

- Status: approved for Phase 1 implementation
- Why:
  - Public category and product pages expose product titles, units, and prices in server-rendered HTML.
  - `robots.txt` currently allows crawling.
  - Product pages look stable enough for a second source adapter.
- Ingestion approach:
  - Start from high-signal category pages.
  - Parse listing cards and follow product links only when detail enrichment is needed.
- Compliance notes:
  - Respect low request concurrency.
  - Avoid authenticated or checkout paths.
  - Keep source kill-switch support in config so the scraper can be disabled quickly if site policy changes.

## Shortlisted but deferred

### `cargillsonline.com`

- Status: deferred
- Reason:
  - The public product page appears JS-template driven in raw fetches, so extraction will likely require browser/network reverse engineering.
  - `robots.txt` was not present at the expected URL during review.
- Future path:
  - Revisit after MVP if a stable public product API or rendered feed is confirmed.

### `stores.keellssuper.com`

- Status: deferred
- Reason:
  - `robots.txt` contains Cloudflare-managed bot restrictions and explicit blocks for several AI-related user agents.
  - The public pages inspected during planning did not expose enough catalog detail for a low-risk first implementation.
- Future path:
  - Revisit only after manual policy review and a safer non-fragile ingestion path are confirmed.

### `arpicostore.com`

- Status: deferred
- Reason:
  - Initial fetches were unreliable and timed out during planning.
  - Not enough evidence yet for a stable Phase 1 adapter.

## Source selection rule

The platform must support per-source feature flags so any source can be disabled without code changes if:

- `robots.txt` changes
- terms materially change
- the scraper becomes unstable
- the site owner asks for reduced or stopped access

## Operational guardrails

- Use a custom user agent string that identifies the project.
- Add per-source timeout, retry, and max-page settings.
- Store raw payloads for traceability, then normalize into canonical offers.
- Keep scrape cadence low and explicit. Daily refresh is enough for MVP.
- Never automate cart, checkout, login, or payment workflows.
