"""Price alert subscriptions — persists to DB; email send is optional (Resend)."""

from __future__ import annotations

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.tables import AlertSubscriptionRecord

logger = logging.getLogger(__name__)

ALLOWED_SCOPES = frozenset({"basket", "category", "district"})
ALLOWED_CADENCE = frozenset({"daily", "weekly"})


def subscribe(
    db: Session,
    *,
    email: str,
    scope: str,
    scope_value: str | None,
    cadence: str,
) -> dict[str, object]:
    normalized_scope = scope.strip().lower()
    normalized_cadence = cadence.strip().lower()
    if normalized_scope not in ALLOWED_SCOPES:
        raise ValueError(f"scope must be one of: {', '.join(sorted(ALLOWED_SCOPES))}")
    if normalized_cadence not in ALLOWED_CADENCE:
        raise ValueError(f"cadence must be one of: {', '.join(sorted(ALLOWED_CADENCE))}")

    token = str(uuid.uuid4())
    record = AlertSubscriptionRecord(
        email=email.strip().lower(),
        scope=normalized_scope,
        scope_value=(scope_value or "").strip() or None,
        cadence=normalized_cadence,
        unsubscribe_token=token,
        active=True,
        confirmed=False,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    settings = get_settings()
    preview_mode = not settings.resend_api_key.strip()
    email_sent = False

    if preview_mode:
        logger.info(
            "alert subscribe preview mode email=%s scope=%s scope_value=%s id=%s",
            record.email,
            record.scope,
            record.scope_value,
            record.id,
        )
    else:
        email_sent = _send_confirmation_email(record.email, token)

    return {
        "id": record.id,
        "ok": True,
        "preview_mode": preview_mode,
        "email_sent": email_sent,
        "unsubscribe_token": token,
    }


def _send_confirmation_email(email: str, token: str) -> bool:
    settings = get_settings()
    if not settings.resend_api_key.strip():
        return False
    try:
        import httpx

        site_url = settings.site_url.rstrip("/")
        confirm_url = f"{site_url}/alerts/confirm?token={token}"
        manage_url = f"{site_url}/alerts/manage/{token}"
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.alert_from_email,
                "to": [email],
                "subject": "Confirm your FoodLK price alert",
                "html": (
                    f"<p>Confirm your FoodLK alert subscription:</p>"
                    f'<p><a href="{confirm_url}">Confirm alert</a></p>'
                    f'<p style="font-size:12px;color:#666">Manage or unsubscribe: <a href="{manage_url}">{manage_url}</a></p>'
                ),
            },
            timeout=15.0,
        )
        response.raise_for_status()
        return True
    except Exception:
        logger.exception("failed to send alert confirmation to %s", email)
        return False


def confirm(db: Session, token: str) -> AlertSubscriptionRecord:
    record = db.scalar(select(AlertSubscriptionRecord).where(AlertSubscriptionRecord.unsubscribe_token == token))
    if not record:
        raise ValueError("Alert subscription not found")
    record.confirmed = True
    record.active = True
    db.commit()
    db.refresh(record)
    return record


def manage(db: Session, token: str) -> dict[str, object]:
    record = db.scalar(select(AlertSubscriptionRecord).where(AlertSubscriptionRecord.unsubscribe_token == token))
    if not record:
        raise ValueError("Alert subscription not found")
    return {
        "id": record.id,
        "email": record.email,
        "scope": record.scope,
        "scope_value": record.scope_value,
        "cadence": record.cadence,
        "active": record.active,
        "confirmed": record.confirmed,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


def unsubscribe(db: Session, token: str) -> AlertSubscriptionRecord:
    record = db.scalar(select(AlertSubscriptionRecord).where(AlertSubscriptionRecord.unsubscribe_token == token))
    if not record:
        raise ValueError("Alert subscription not found")
    record.active = False
    db.commit()
    db.refresh(record)
    return record
