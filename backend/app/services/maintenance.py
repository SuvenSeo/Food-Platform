from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.tables import ScrapeRun


def prune_scrape_runs_older_than(db: Session, *, days: int = 90) -> int:
    """Delete scrape run rows older than ``days``. Returns rows removed."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    result = db.execute(
        delete(ScrapeRun).where(ScrapeRun.started_at < cutoff)
    )
    db.flush()
    return int(result.rowcount or 0)
