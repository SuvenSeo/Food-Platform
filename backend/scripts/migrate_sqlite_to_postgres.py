#!/usr/bin/env python3
"""
One-time migration: copy FoodLK tables from a SQLite file into Postgres (Supabase).

Usage:
  export SQLITE_DATABASE_URL="sqlite:///./food_platform.db"
  export DATABASE_URL="postgresql+psycopg://user:pass@host:5432/postgres"
  python scripts/migrate_sqlite_to_postgres.py

Run Alembic against the Postgres target before importing:
  python -c "from app.db.migrate import run_upgrade; run_upgrade()"
"""

from __future__ import annotations

import os
import sys

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

# Allow `python scripts/migrate_sqlite_to_postgres.py` from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.tables import (  # noqa: E402
    FairPriceScoreRecord,
    FoodOfferRecord,
    MarketQuoteRecord,
    PriceAggregateRecord,
    RawOfferRecord,
    ScrapeRun,
)

TABLE_MODELS = (
    ScrapeRun,
    RawOfferRecord,
    FoodOfferRecord,
    PriceAggregateRecord,
    FairPriceScoreRecord,
    MarketQuoteRecord,
)


def _copy_table(source: Session, target: Session, model) -> int:
    rows = source.scalars(select(model)).all()
    if not rows:
        return 0
    for row in rows:
        data = {column.name: getattr(row, column.name) for column in model.__table__.columns}
        target.merge(model(**data))
    target.flush()
    return len(rows)


def main() -> None:
    sqlite_url = os.environ.get("SQLITE_DATABASE_URL", "sqlite:///./food_platform.db").strip()
    postgres_url = os.environ.get("DATABASE_URL", "").strip()
    if not postgres_url.startswith("postgresql"):
        raise SystemExit("DATABASE_URL must be a postgresql+psycopg:// URL for the import target.")

    source_engine = create_engine(sqlite_url)
    target_engine = create_engine(postgres_url)
    SourceSession = sessionmaker(bind=source_engine)
    TargetSession = sessionmaker(bind=target_engine)

    totals: dict[str, int] = {}
    with SourceSession() as source_db, TargetSession() as target_db:
        for model in TABLE_MODELS:
            count = _copy_table(source_db, target_db, model)
            totals[model.__tablename__] = count
            print(f"  {model.__tablename__}: {count} rows")
        target_db.commit()

    print("Migration complete:", totals)


if __name__ == "__main__":
    main()
