from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.tables import FoodOfferRecord, PriceAggregateRecord
from app.services.pipeline import rebuild_normalized_views

router = APIRouter()
settings = get_settings()


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/admin/trigger/aggregate")
def trigger_aggregate(_: None = Depends(require_admin), db: Session = Depends(get_db)) -> dict[str, object]:
    rebuild_normalized_views(db)
    db.commit()
    return {
        "status": "ok",
        "offers_count": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
        "aggregates_count": db.scalar(select(func.count(PriceAggregateRecord.id))) or 0,
    }
