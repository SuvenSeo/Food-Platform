# Backend Database Setup

## Environment Variables

The backend reads configuration from environment variables (or a local `.env` file).

- `DATABASE_URL`
  - Expected format for Supabase/Postgres:
    - `postgresql+psycopg://<user>:<password>@<host>:5432/<database>`
  - In `development`/`test`, this can be left empty only if `ALLOW_SQLITE_FALLBACK=true`.
  - In `staging`/`production`, this must be set (Fly secrets — not committed in `fly.toml`).
- `ALLOW_SQLITE_FALLBACK`
  - Recommended `true` for `development` and `test`.
  - Recommended `false` for `staging` and `production`.
  - When `false`, SQLite URLs are rejected.
- `APP_ENV`
  - Use `development`, `test`, `staging`, or `production`.
  - `staging` and `production` are treated as production-like environments.
- `SPAR2U_ENABLED`, `GLOMARK_ENABLED`, `KEELLS_ENABLED`, `CARGILLS_ENABLED`
  - Toggle retail scrapers (default `true`).
- `MARKET_QUOTES_URL`
  - Remote JSON feed URL for market quotes.
- `MARKET_QUOTES_TIMEOUT_SECONDS`
  - HTTP timeout (seconds) for remote market quote fetches.
- `MARKET_QUOTES_FORMAT`
  - Payload format for market quote ingestion (`json`).
- `MARKET_QUOTES_SEED_FALLBACK_ENABLED`
  - When `true`, `run_market_sync.py` can fallback to `data/market_quotes_seed.json` if remote fetch fails.
- `RESEND_API_KEY`
  - When set, `POST /api/v1/alerts/subscribe` sends a confirmation email via Resend. When unset, subscriptions are stored and the API returns **202** preview mode.
- `ALERT_FROM_EMAIL`
  - Sender for alert emails (default `alerts@foodlk.lk`).
- `SITE_URL`
  - Public site base URL for links in alert emails (default Vercel production URL).

## Public API (Phase 6)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/changes` | Recent retail + market price movements |
| `GET /api/v1/embed/summary` | Embeddable HTML badge (`kind=basket\|category`) |
| `POST /api/v1/alerts/subscribe` | Price watch signup (`EmailStr` body) |
| `GET /api/v1/basket/estimate?preset=` | Presets: `essentials`, `protein`, `smart-saver`, `festive` |

Related docs: [`docs/DATA_SOURCES.md`](../docs/DATA_SOURCES.md), [`docs/redesign-phased-roadmap.md`](../docs/redesign-phased-roadmap.md), root [`scripts/smoke-api.sh`](../scripts/smoke-api.sh).

## Canonical retail sources

`app/core/sources.py` defines:

```python
DEFAULT_RETAIL_SOURCES = ("spar2u", "glomark", "keells", "cargills")
```

Used by `run_sync.py`, admin triggers, and `.github/workflows/unified-scraper.yml`.

## Runtime Safety Rules

- The app will fail fast at startup if:
  - `DATABASE_URL` is missing in non-development environments.
  - a SQLite URL is used in `staging`/`production`.
  - `ALLOW_SQLITE_FALLBACK=false` and the configured URL is SQLite.
- A DB connection probe (`SELECT 1`) runs during app startup before migrations.

## Supabase production path

1. Create a Supabase Postgres project and copy the connection string.
2. Set Fly secrets (do not put credentials in `fly.toml`):
   - `fly secrets set DATABASE_URL="postgresql+psycopg://..." --app food-platform-backend`
   - `fly secrets set ALLOW_SQLITE_FALLBACK=false ADMIN_API_KEY="<strong-key>" --app food-platform-backend`
3. Run Alembic against Supabase:
   - `python -c "from app.db.migrate import run_upgrade; run_upgrade()"`
4. One-time SQLite → Postgres migration (if you have existing Fly volume data):
   - `export SQLITE_DATABASE_URL="sqlite:////data/food_platform.db"`
   - `export DATABASE_URL="postgresql+psycopg://..."`
   - `python scripts/migrate_sqlite_to_postgres.py`
5. Verify: `GET /api/v1/ops/database/provider` → `supabase-postgres`.

**Scaling:** Do not run more than one Fly machine without Postgres connection pooling.

## Local Development (SQLite fallback)

- `APP_ENV=development`
- `ALLOW_SQLITE_FALLBACK=true`
- Leave `DATABASE_URL` unset or empty

The app will fallback to `sqlite:///./food_platform.db`.

## Retail sync (CLI)

```bash
cd backend
pip install -r requirements.txt
playwright install chromium   # required for keells + cargills
python run_sync.py            # all DEFAULT_RETAIL_SOURCES
python run_sync.py --sources spar2u,glomark --max-items 100
```

Keells and Cargills use Playwright headless Chromium (`app/scrapers/browser.py`).

## Market quote sync

- `python run_market_sync.py`
- `python run_official_market_sync.py --sources wfp dcs cbsl doa harti`

## Maintenance

Prune `scrape_runs` older than 90 days:

```python
from app.db.session import SessionLocal
from app.services.maintenance import prune_scrape_runs_older_than

with SessionLocal() as db:
    removed = prune_scrape_runs_older_than(db, days=90)
    db.commit()
```

## GitHub Actions (unified scraper)

Workflow `.github/workflows/unified-scraper.yml` runs retail scrapers **in CI** against `DATABASE_URL` (no Fly background sleep). Required secret:

- `DATABASE_URL` — Supabase Postgres URL

Optional: `ADMIN_API_KEY` for manual Fly admin triggers only.

## DB Provider Runtime Indicator

- `GET /api/v1/ops/database/provider`

Returns `sqlite`, `supabase-postgres`, or `postgres-compatible` without exposing credentials.
