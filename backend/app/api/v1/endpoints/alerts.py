from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import alerts as alerts_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


class AlertSubscribeIn(BaseModel):
    email: EmailStr
    scope: str = Field(default="basket", description="basket | category | district")
    scope_value: str | None = Field(default=None, max_length=128)
    cadence: str = Field(default="weekly", description="daily | weekly")


@router.post("/subscribe")
def subscribe_alert(
    payload: AlertSubscribeIn,
    db: Session = Depends(get_db),
) -> JSONResponse:
    try:
        result = alerts_service.subscribe(
            db,
            email=str(payload.email),
            scope=payload.scope,
            scope_value=payload.scope_value,
            cadence=payload.cadence,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    status_code = 202 if result["preview_mode"] else 201
    body = {
        "id": result["id"],
        "ok": True,
        "preview_mode": result["preview_mode"],
        "email_sent": result["email_sent"],
        "message": (
            "Subscription saved in preview mode; confirmation email was not sent."
            if result["preview_mode"]
            else "Subscription saved; check your inbox to confirm."
        ),
    }
    return JSONResponse(status_code=status_code, content=body)


@router.get("/manage/{token}")
def manage_alert(token: str, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        return {"ok": True, "subscription": alerts_service.manage(db, token)}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/confirm/{token}")
def confirm_alert(token: str, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        record = alerts_service.confirm(db, token)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {
        "ok": True,
        "id": record.id,
        "active": record.active,
        "confirmed": record.confirmed,
        "message": "Alert subscription confirmed.",
    }


@router.post("/unsubscribe/{token}")
def unsubscribe_alert(token: str, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        record = alerts_service.unsubscribe(db, token)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {
        "ok": True,
        "id": record.id,
        "active": record.active,
        "confirmed": record.confirmed,
        "message": "Alert subscription disabled.",
    }
