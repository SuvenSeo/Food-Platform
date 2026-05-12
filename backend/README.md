# Backend Database Setup

## Environment Variables

The backend reads configuration from environment variables (or a local `.env` file).

- `DATABASE_URL`
  - Expected format for Supabase/Postgres:
    - `postgresql+psycopg://<user>:<password>@<host>:5432/<database>`
  - In `development`/`test`, this can be left empty only if `ALLOW_SQLITE_FALLBACK=true`.
  - In `staging`/`production`, this must be set.
- `ALLOW_SQLITE_FALLBACK`
  - Recommended `true` for `development` and `test`.
  - Recommended `false` for `staging` and `production`.
  - When `false`, SQLite URLs are rejected.
- `APP_ENV`
  - Use `development`, `test`, `staging`, or `production`.
  - `staging` and `production` are treated as production-like environments.
- `MARKET_QUOTES_URL`
  - Remote JSON feed URL for market quotes.
  - Supported payloads: JSON array, or object with an `items` array.
- `MARKET_QUOTES_TIMEOUT_SECONDS`
  - HTTP timeout (seconds) for remote market quote fetches.
- `MARKET_QUOTES_FORMAT`
  - Payload format for market quote ingestion.
  - Current supported value: `json`.
- `MARKET_QUOTES_SEED_FALLBACK_ENABLED`
  - When `true`, `run_market_sync.py` can fallback to `data/market_quotes_seed.json` if remote fetch fails.
  - Recommended `true` for local dev and `false` for production automation.

## Runtime Safety Rules

- The app will fail fast at startup if:
  - `DATABASE_URL` is missing in non-development environments.
  - a SQLite URL is used in `staging`/`production`.
  - `ALLOW_SQLITE_FALLBACK=false` and the configured URL is SQLite.
- A DB connection probe (`SELECT 1`) runs during app startup before migrations.

## Supabase Setup and Migration Flow

1. Set `APP_ENV=staging` or `APP_ENV=production`.
2. Set `ALLOW_SQLITE_FALLBACK=false`.
3. Export `DATABASE_URL` in your shell/session (do not commit secrets).
4. Run migrations:
   - `python -c "from app.db.migrate import run_upgrade; run_upgrade()"`
5. Start API:
   - `uvicorn app.main:app --reload`

## Local Development (SQLite fallback)

For fast local iteration:

- `APP_ENV=development`
- `ALLOW_SQLITE_FALLBACK=true`
- Leave `DATABASE_URL` unset or empty

The app will fallback to `sqlite:///./food_platform.db`.

## Market Quote Sync

- Run default behavior:
  - `python run_market_sync.py`
- Override remote source:
  - `python run_market_sync.py --url "https://example.com/market-quotes.json"`

Behavior:

- Remote fetch/parse failures do not partially overwrite data.
- If fallback is disabled, remote failures fail the sync command.
- If fallback is enabled, failed remote fetches fallback to local seed quotes.

## DB Provider Runtime Indicator

Use this endpoint to confirm provider class without exposing credentials:

- `GET /api/v1/ops/database/provider`

It returns a safe indicator such as `sqlite`, `supabase-postgres`, or `postgres-compatible` using runtime engine metadata.

## GitHub Actions Setup (Daily Automation)

Workflow `.github/workflows/daily-scrape.yml` runs:

- Retail source sync (`spar2u`, `glomark`) on schedule
- Market quote sync on schedule

Required GitHub secrets:

- `DATABASE_URL`
- `ADMIN_API_KEY`
- `MARKET_QUOTES_URL`

Optional GitHub vars:

- `SCRAPE_MAX_ITEMS_PER_SOURCE` (default `250`)
- `MARKET_QUOTES_TIMEOUT_SECONDS` (default `20` in workflow)
- `MARKET_QUOTES_FORMAT` (default `json`)
