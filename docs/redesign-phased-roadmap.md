# FoodLK Redesign Roadmap (Phases 0–7)

Delivery follows the [FoodLK Full Ship Plan](https://github.com/) sequence: stabilize CI and backend, migrate data, fix scrapers, wire trends, redesign UI, ship retention features, then docs and launch verification.

## Phase 0 — CI green gate

- Backend `pytest`, frontend lint/test/build on `main`
- Root smoke script: `scripts/smoke-api.sh` (health, trends, changes, embed)

## Phase 1 — Backend correctness

- Trust: zero-yield scrapes not counted healthy
- Source feature flags and canonical `DEFAULT_RETAIL_SOURCES`
- `EmailStr` on retention payloads
- Scrape run pruning

## Phase 2 — Supabase production

- Fly `DATABASE_URL` → Postgres; `ALLOW_SQLITE_FALLBACK=false` in prod
- Alembic on Supabase; optional SQLite → Postgres migration

## Phase 3 — Playwright scrapers

- Keells + Cargills via headless Chromium in Docker
- GitHub Actions runs `run_sync.py` with poll verification (not fixed `sleep 180`)
- Incremental normalize in pipeline

## Phase 4 — Wire trends to UI

- `getMarketPriceTrend` / `getTrendsSummary` on intelligence, markets, offer detail

## Phase 5 — Premium UI/UX

- Design system v2, app shell (trust ribbon, search), page redesigns (Home → Intelligence → Retail → Markets → tools)

## Phase 6 — Retention features (v1 subset shipped)

| Feature | Status |
|--------|--------|
| `/changes` feed (retail + market revisions) | Shipped |
| `GET /api/v1/embed/summary` HTML badge | Shipped |
| `POST /api/v1/alerts/subscribe` + DB table | Shipped (preview mode without Resend) |
| Basket presets: essentials, protein, smart-saver, festive | Shipped |
| i18n EN / SI / TA (`LocaleProvider`) | Shipped (nav + hero + alerts) |
| Weekly digest email | Deferred |
| Full alert confirm/manage pages | Deferred |

## Phase 7 — Docs and launch

- This roadmap, `docs/DATA_SOURCES.md`, `backend/README.md` cross-links
- Focused API tests (`test_phase6_features.py`) and `/changes` page test
- Manual launch checklist: four retail sources, fresh market quotes, intelligence charts, a11y on Home + Retail
