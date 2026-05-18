from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.price_changes import list_price_changes

router = APIRouter(tags=["changes"])


@router.get("/changes")
def get_price_changes(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Recent retail and market price movement events."""
    return list_price_changes(db, limit=limit)
