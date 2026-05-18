#!/usr/bin/env python3
"""Verify the latest finished scrape run for a retail source (CI helper)."""

from __future__ import annotations

import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select  # noqa: E402

from app.db.session import SessionLocal  # noqa: E402
from app.models.tables import ScrapeRun  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Poll latest ScrapeRun for a source.")
    parser.add_argument("--source", required=True)
    parser.add_argument("--max-wait-seconds", type=int, default=60)
    parser.add_argument("--poll-interval", type=float, default=5.0)
    parser.add_argument("--require-items", action="store_true", default=True)
    return parser.parse_args()


def latest_run(source: str) -> ScrapeRun | None:
    with SessionLocal() as db:
        return db.scalar(
            select(ScrapeRun)
            .where(ScrapeRun.source == source)
            .order_by(ScrapeRun.started_at.desc())
            .limit(1)
        )


def main() -> None:
    args = parse_args()
    deadline = time.time() + args.max_wait_seconds

    while time.time() < deadline:
        run = latest_run(args.source)
        if run and run.finished_at is not None:
            if run.status == "failed":
                print(f"Scrape failed: {run.error_message}", file=sys.stderr)
                raise SystemExit(1)
            if args.require_items and run.items_seen <= 0:
                print(
                    f"Scrape completed with zero items (items_seen={run.items_seen})",
                    file=sys.stderr,
                )
                raise SystemExit(1)
            print(
                f"OK source={args.source} status={run.status} "
                f"items_seen={run.items_seen} items_stored={run.items_stored}"
            )
            return
        time.sleep(args.poll_interval)

    print(f"Timed out waiting for scrape run: {args.source}", file=sys.stderr)
    raise SystemExit(1)


if __name__ == "__main__":
    main()
