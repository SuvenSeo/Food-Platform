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
