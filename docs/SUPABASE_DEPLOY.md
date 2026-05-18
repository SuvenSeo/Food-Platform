# Supabase production cutover (FoodLK)

A Supabase project **food-platform** (`sostboclgybttmeafvkb`, `ap-southeast-1`) exists with the full schema applied via migrations.

## 1. Set the database password

In [Supabase Dashboard](https://supabase.com/dashboard/project/sostboclgybttmeafvkb/settings/database), reset the **database password** and copy the connection string (Transaction pooler, port **6543**).

Use this format for the API (SQLAlchemy + psycopg):

```text
postgresql+psycopg://postgres.sostboclgybttmeafvkb:<PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## 2. Fly.io secrets

```bash
cd backend
fly secrets set \
  DATABASE_URL="postgresql+psycopg://postgres.sostboclgybttmeafvkb:<PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres" \
  ALLOW_SQLITE_FALLBACK="false" \
  APP_ENV="production"
```

Optional (alert emails; without these, subscriptions stay in preview mode):

```bash
fly secrets set RESEND_API_KEY="re_..." ALERT_FROM_EMAIL="alerts@foodlk.lk" SITE_URL="https://food-platform-one.vercel.app"
```

Redeploy after secrets change:

```bash
fly deploy --remote-only
```

Verify:

```bash
curl -s https://food-platform-backend.fly.dev/api/v1/ops/database/provider
# expect: "provider": "supabase-postgres"
```

## 3. Migrate SQLite volume data (optional)

If you need existing Fly SQLite data in Postgres:

```bash
# Download /data/food_platform.db from the Fly machine, then:
cd backend
set DATABASE_URL=postgresql+psycopg://...
python scripts/migrate_sqlite_to_postgres.py --sqlite-path ./food_platform.db
```

## 4. GitHub Actions

```bash
gh secret set DATABASE_URL --repo SuvenSeo/Food-Platform --body "postgresql+psycopg://..."
```

The **Unified Data Scraper** workflow uses this secret for retail and market sync jobs.
