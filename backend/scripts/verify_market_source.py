#!/usr/bin/env python3
"""Verify market quotes exist for a source after an ingestion job."""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import func, select  # noqa: E402

from app.db.session import SessionLocal  # noqa: E402
from app.models.tables import MarketQuoteRecord  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify market quote rows for a source.")
    parser.add_argument("--source", required=True)
    parser.add_argument("--min-rows", type=int, default=1)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    with SessionLocal() as db:
        count = db.scalar(
            select(func.count(MarketQuoteRecord.id)).where(MarketQuoteRecord.source == args.source)
        ) or 0
        latest = db.scalar(
            select(func.max(MarketQuoteRecord.quoted_at)).where(MarketQuoteRecord.source == args.source)
        )

    if count < args.min_rows:
        print(
            f"Market source {args.source} has {count} rows, expected at least {args.min_rows}",
            file=sys.stderr,
        )
        raise SystemExit(1)

    print(f"OK market_source={args.source} rows={count} latest={latest}")


if __name__ == "__main__":
    main()
