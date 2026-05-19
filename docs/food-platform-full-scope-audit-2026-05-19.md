# Mandiya Food Platform Full-Scope Audit

Date: 2026-05-19
Scope: Food Platform frontend, backend, scraper pipeline, local data path, and reference-platform patterns from PropertyLK, AutoLens LK, and Octane.

## Executive Status

The Food Platform has the right product direction for a food price intelligence hub: it already has public API surfaces, retail offers, market quotes, category views, compare tools, basket workflows, methods/pipeline pages, and a trust/freshness layer.

The critical gap was data reliability. The main source set is now live end to end locally: Spar2U, Glomark, Keells, Cargills, WFP, CBSL, DCS, DOA, and HARTI all return nonzero rows in live smoke checks, and the official market sources write tracked scrape runs through the platform sync paths. The platform can now power pages from scraped retail offers plus official market quotes, with scheduled GitHub Actions configured to run the repaired source set.

There is also a real normalization bug visible in live data: `Chinese Cabbage Per 100g(s)` is normalized as brand `Chinese`, canonical `cabbage per (s)`, and unit price `72`, when it should be treated as a produce item with comparable price per kg, likely `720 LKR/kg`.

Update from the same audit pass: the normalization bug above has been fixed and covered by regression tests. The live Glomark cabbage row now normalizes as canonical `chinese cabbage`, no brand, unit `kg`, unit amount `0.1`, and unit price `720 LKR/kg`.

Final implementation update: Keells now uses the current public guest data-collection API, Cargills uses the current JSON dynamic/category endpoints with a browser-context fallback for category product data, DCS resolves current weekly report wrappers to PDFs and parses table rows, DOA/SHEP is wired as an official vegetable-price source, HARTI is wired as an official daily food commodities bulletin source, and WFP uses browser-like request headers to avoid HDX connection resets.

Additional UI/verification update: routed pages now expose real page-level `h1` headings, nested section headers can opt down to `h2`, and paper-mode trust surfaces now keep readable ink colors when rendered on night-theme routes.

## Verification Summary

Backend environment:

| Check | Result |
| --- | --- |
| Backend requirements installed into `.venv` | Fixed during audit |
| `pip check` | Passed |
| `pytest` | 65 passed |
| Local API `/health` | `{"status":"ok"}` |

Frontend environment from the prior verification pass:

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run build` | Passed |
| `npm run test` | Passed, 12 tests |
| Dev server | Running on `http://127.0.0.1:5173` during verification |
| Browser route audit | 24 route/viewport checks passed: no console errors, no horizontal overflow, one `h1` per route |
| Live scraper smoke | Spar2U, Glomark, WFP, CBSL, DCS, DOA, HARTI, Keells, and Cargills returned rows |

Local data after running known-working sources:

| Table / Surface | Count |
| --- | ---: |
| `food_offers` | 213 |
| `price_aggregates` | 156 |
| `market_quotes` | 59,554 |
| Retail sources with normalized offers | 4 |
| Market sources with quotes | 5 |

Retail source distribution:

| Source | Status | Evidence |
| --- | --- | --- |
| Spar2U | Working | Latest sync stored 60 offers |
| Glomark | Working | Latest sync fetched 42 offers and retained 34 normalized current offers |
| Keells | Working | Guest API data-collection scraper fetched 58 offers |
| Cargills | Working | JSON/browser category scraper fetched 60 offers with the current cap |

Market source distribution:

| Source | Status | Evidence |
| --- | --- | --- |
| WFP | Working | Official sync inserted 28,484 market quote rows |
| CBSL | Working | Latest PDF parsed; official sync inserted 35 rows, latest report dated 2026-05-18 |
| DCS | Working | Weekly wrapper/PDF parser inserted 114 Colombo District retail rows |
| DOA/SHEP | Working | Official InfoHub JSON scraper inserted 30,696 vegetable wholesale/retail rows |
| HARTI | Working | Latest daily food commodities bulletin parsed 225 multi-market vegetable and fruit quote rows |

## Food Platform Findings

### Data Pipeline

Current flow:

1. Retail sync runs through `backend/run_sync.py`.
2. `app.services.source_sync.sync_sources` calls per-source fetchers.
3. Raw offers are stored in `raw_offers`.
4. `rebuild_normalized_views` rebuilds `food_offers`, `price_aggregates`, and `fair_price_scores`.
5. Official market sync stores WFP/CBSL/DCS/DOA/HARTI rows in `market_quotes`.

Strengths:

- The raw-to-normalized split is the right foundation.
- Per-source scrape runs are persisted.
- API pages can read directly from the database after sync.
- The trust/freshness service already distinguishes stale, missing, healthy, degraded, and empty data.

Gaps:

- A zero-item completed scrape can look operationally successful unless the pipeline health is inspected.
- Source sync has no strong per-source timeout guard like the Vehicle Platform.
- `test_scrapers_live.py` now tests Cargills as well as Spar2U, Glomark, Keells, WFP, CBSL, DCS, DOA, and HARTI.
- Playwright package install is not enough; Chromium/headless shell installation must be part of setup and deployment.
- The confidence score now penalizes stale/missing datasets and degraded pipeline sources more strongly.

Implemented during this pass:

- `sync_sources` now returns per-source `source_results`.
- A configured retail source returning zero offers is recorded as a failed source result.
- The live scraper test script now includes Cargills.
- Keells, Cargills, DCS, DOA, HARTI, and WFP scraper repairs/additions are implemented and verified with live runs.

### Normalization

Current normalization is too narrow for food retail titles:

- Measurement extraction only recognizes `kg`, `g`, `l`, and `ml`.
- It does not handle `Per 100g(s)`, `100G`, `1Kg`, `unit(s)`, `piece`, `pcs`, `dozen`, pack counts, or retailer-specific display text robustly.
- Brand extraction treats the first word as a brand, which is wrong for many fresh produce titles.

This is a P0 issue because the product depends on comparable unit prices. Without strong normalization, trend charts, fair-price scores, compare views, and basket costs can all be misleading.

### Backend / API

Strengths:

- The backend has a broad set of public product endpoints: home, offers, categories, markets, compare, basket, intelligence, pipeline, freshness, changes, alerts, and API metadata.
- Unit/API tests are already present and now pass locally.
- Public trust and method surfaces exist.

Gaps:

- The backend should expose a stricter source-readiness model: expected source count, live source count, source age, rows stored, and minimum viable data threshold by product surface.
- Pipeline endpoints should make zero-row completed runs explicit as warnings or failures.
- Admin sync endpoints should return or store a richer job summary, not only schedule work.
- API consumers need original package/unit plus normalized unit side by side.
- The public confidence algorithm should penalize stale market quotes and missing expected retailers more aggressively.

### Frontend / UX

Strengths:

- The frontend already feels like an information product instead of a plain ecommerce catalog.
- It has visible trust pages: Pipeline and Methods.
- It has useful workflow surfaces: Retail, Markets, Categories, Compare, Basket, Watchlists, Intelligence, Changes.
- The masthead displays freshness signals and source counts.

Gaps:

- The homepage copy currently claims all four retail chains are scraped even when only two are actually live.
- Source health is visible, but not prominent enough at the moment of decision on offer, compare, and basket pages.
- Offer detail shows normalized values, but not enough original-vs-normalized explanation to catch questionable conversions.
- Category and item drill-down should become the primary path for an informational platform: category -> item -> source comparison -> history -> alerts/watchlist.
- Mobile data views need special attention for charts and tables, especially compare and market quote tables.
- Some UI is visually polished but can overstate data confidence when the underlying source coverage is incomplete.

## Reference Platform Patterns To Port

### PropertyLK

Useful patterns:

- Snapshot history model for each listing.
- Separate job-run tracking for non-scraper tasks like geocoding and aggregation.
- Public pipeline endpoint with expected freshness windows.
- Heatmap and district-level data surfaces.
- Deal scoring tied to market medians.
- Clear scraper operation docs with scheduler and run-all scripts.

Food equivalent:

- Add `OfferSnapshot` or preserve historical raw offer revisions by source/product fingerprint.
- Add `JobRun` for normalization rebuild, market quote ingestion, source discovery, and data quality checks.
- Build district heatmaps for official market quotes.
- Add category/item price history pages with export.

### AutoLens LK / Vehicle Platform

Useful patterns:

- Source registry with aliases, profiles, max-pages, and env-driven timeouts.
- Independent source execution with `asyncio.wait_for`.
- Structured logging through `structlog`.
- Pipeline trigger/status endpoints with expected source order.
- Aggregator with p25, median, p75, and deal score fallback logic.
- Daily sync scheduler with bounded runtime.

Food equivalent:

- Give each retailer and market source a profile: enabled, expected frequency, timeout, minimum rows, and max pages.
- Run every source independently with hard timeouts.
- Let failed or empty sources degrade only their own status, not the whole job.
- Add structured logs and source-level metrics.

### Octane

Useful patterns:

- Clean router boundaries for prices, comparison, calculator, alerts, digest, embed, and meta.
- Idempotent scraper writes using unique keys and UPSERT.
- Admin notification when a core scraper returns 0 rows.
- Public CSV/JSON export for history.
- Alerts and digest are first-class product loops.
- Rate limiting is applied globally.

Food equivalent:

- Add admin notification for zero-row or stale core food scrapers.
- Add CSV/JSON export for item history and market quotes.
- Build price alerts for item/source/category thresholds.
- Add API rate limiting before making the public API prominent.

## Priority Roadmap

### P0: Make Data Trustworthy

1. Fix unit normalization and commodity naming.
   - Handle `Per 100g(s)`, `Per 1 unit(s)`, `100G`, `1Kg`, `litre`, `pcs`, `piece`, `pack`, `dozen`.
   - Preserve `original_title`, `original_unit_text`, `normalized_unit`, `normalized_amount`, and `price_per_kg_or_litre`.
   - Add tests using real Spar2U and Glomark examples.

2. Repair scraper verification.
   - Cargills is included in `test_scrapers_live.py`.
   - Zero-row core sources now fail or warn loudly through `source_results`.
   - Add per-source timeout around every fetch.
   - Store sample title/price/source in scrape run metadata for debugging.

3. Keep repaired sources stable.
   - Keells: current guest API source is wired; next improvement is deeper catalogue pagination if exposed safely.
   - Cargills: current category endpoint is wired via browser context; next improvement is reducing browser overhead if plain HTTP access becomes reliable.
   - DCS: wrapper/PDF discovery is wired; keep Excel fallback for older archive patterns.

4. Tighten public confidence.
   - Expected retail sources should be 4 and latest local coverage is 4.
   - Confidence should continue to drop when core expected sources are stale, empty, or broken.
   - UI copy should reflect partial coverage until all key sources work.

### P1: Build the Intelligence Product

1. Add item pages built around history, source comparison, districts, and alerts.
2. Add category drill-down: category -> canonical item -> retailer/source -> trend.
3. Add source comparison tables that show raw package and normalized unit together.
4. Add price history export as CSV/JSON.
5. Add watchlist/alert flows backed by server-side storage and notifications.
6. Add district heatmap for WFP/CBSL market quotes.

### P2: Operational Maturity

1. Add `JobRun` records for rebuilds, market sync, quality checks, and exports.
2. Add structured logs and scraper metrics.
3. Add scheduled jobs with source profiles and bounded runtimes.
4. Add API rate limiting.
5. Add admin notifications for zero-row scrapes and stale datasets.
6. Add a public data methods page that documents source limitations and normalization rules dynamically from real source status.

## Recommended Implementation Sequence

1. Normalization tests and fixes.
2. Source timeout and zero-row failure semantics.
3. Continue monitoring Keells and Cargills.
4. Continue monitoring DCS wrapper/PDF discovery.
5. Re-run full sync and confirm all expected data sources populate the DB.
6. Adjust confidence scoring and frontend copy to match real source coverage.
7. Build item history and alert/watchlist features on top of the now-reliable data model.

This sequence matters because frontend intelligence features will only be useful if unit normalization and source coverage are correct first.
