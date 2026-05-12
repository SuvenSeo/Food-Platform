from datetime import datetime, timezone

import pytest
from sqlalchemy import delete, select

from app.db.migrate import run_upgrade
from app.db.session import SessionLocal
from app.models.tables import MarketQuoteRecord
from app.services import market_quotes


def _reset_market_quotes() -> None:
    run_upgrade()
    with SessionLocal() as db:
        db.execute(delete(MarketQuoteRecord))
        db.commit()


def _seed_quote(item_name: str = "Tomato") -> None:
    with SessionLocal() as db:
        db.add(
            MarketQuoteRecord(
                district="Colombo",
                market_name="Pettah",
                item_name=item_name,
                category="vegetables",
                unit="kg",
                price_lkr=320.0,
                source="seed",
                quoted_at=datetime.now(timezone.utc),
                notes=None,
            )
        )
        db.commit()


class _FakeResponse:
    def __init__(self, payload: object) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> object:
        return self._payload


def test_ingest_market_quotes_from_url_replaces_rows(monkeypatch: pytest.MonkeyPatch) -> None:
    _reset_market_quotes()
    _seed_quote("Old Tomato")

    payload = [
        {
            "district": "Kandy",
            "market_name": "Kandy Central",
            "item_name": "Carrot",
            "category": "vegetables",
            "unit": "kg",
            "price_lkr": 450,
            "source": "remote-feed",
            "quoted_at": "2026-05-12T03:00:00Z",
            "notes": "remote sample",
        }
    ]
    monkeypatch.setattr(market_quotes.httpx, "get", lambda *_args, **_kwargs: _FakeResponse(payload))

    result = market_quotes.ingest_market_quotes_from_url(
        "https://example.com/quotes.json",
        timeout_seconds=5,
        payload_format="json",
    )

    assert result["market_quotes_count"] == 1
    with SessionLocal() as db:
        rows = db.scalars(select(MarketQuoteRecord).order_by(MarketQuoteRecord.id.asc())).all()
    assert len(rows) == 1
    assert rows[0].item_name == "Carrot"
    assert rows[0].source == "remote-feed"


def test_ingest_market_quotes_from_url_keeps_existing_rows_on_parse_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    _reset_market_quotes()
    _seed_quote("Tomato")

    invalid_payload = [{"district": "Colombo"}]
    monkeypatch.setattr(market_quotes.httpx, "get", lambda *_args, **_kwargs: _FakeResponse(invalid_payload))

    with pytest.raises(ValueError, match="missing required fields"):
        market_quotes.ingest_market_quotes_from_url(
            "https://example.com/invalid.json",
            timeout_seconds=5,
            payload_format="json",
        )

    with SessionLocal() as db:
        rows = db.scalars(select(MarketQuoteRecord).order_by(MarketQuoteRecord.id.asc())).all()
    assert len(rows) == 1
    assert rows[0].item_name == "Tomato"
