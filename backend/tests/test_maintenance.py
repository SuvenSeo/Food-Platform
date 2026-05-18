from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select

from app.db.migrate import run_upgrade
from app.db.session import SessionLocal
from app.models.tables import ScrapeRun
from app.services.maintenance import prune_scrape_runs_older_than


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def test_prune_scrape_runs_older_than_removes_stale_rows() -> None:
    run_upgrade()
    with SessionLocal() as db:
        db.execute(delete(ScrapeRun))
        db.commit()
        db.add_all(
            [
                ScrapeRun(
                    source="spar2u",
                    status="completed",
                    started_at=utc_now() - timedelta(days=120),
                    finished_at=utc_now() - timedelta(days=120),
                    items_seen=1,
                    items_stored=1,
                ),
                ScrapeRun(
                    source="spar2u",
                    status="completed",
                    started_at=utc_now() - timedelta(days=1),
                    finished_at=utc_now() - timedelta(days=1),
                    items_seen=1,
                    items_stored=1,
                ),
            ]
        )
        db.commit()
        removed = prune_scrape_runs_older_than(db, days=90)
        db.commit()
        remaining = db.scalar(select(func.count(ScrapeRun.id))) or 0

    assert removed == 1
    assert remaining == 1
