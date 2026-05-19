from datetime import datetime, timezone

import pytest
from sqlalchemy import delete, select

from app.db.migrate import run_upgrade
from app.db.session import SessionLocal
from app.models.tables import MarketQuoteRecord
from app.services import market_quotes
from app.scrapers.dcs import _parse_dcs_table_rows
from app.scrapers.doa import parse_doa_item_rows


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


def test_parse_doa_item_rows_emits_wholesale_and_retail_quotes() -> None:
    rows = [
        {
            "Date": "2026-05-18",
            "Item": "Beans",
            "Unit": "kg",
            "Pettah_Today_Wholesale": "650.000",
            "Dambulla_Today_Wholesale": "500.000",
            "Pettah_Today_Retail": "700.000",
            "Dambulla_Today_Retail": "530.000",
        }
    ]

    quotes = parse_doa_item_rows(rows, item="Beans")

    assert len(quotes) == 4
    assert quotes[0] == {
        "district": "Colombo",
        "market_name": "Manning Market (DOA)",
        "item_name": "Beans",
        "category": "vegetables",
        "unit": "kg",
        "price_lkr": 650.0,
        "source": "doa",
        "quoted_at": "2026-05-18T00:00:00+00:00",
        "notes": "DOA SHEP wholesale vegetable price.",
    }
    assert {quote["market_name"] for quote in quotes} == {
        "Manning Market (DOA)",
        "Dambulla Economic Centre (DOA)",
    }
    assert {quote["price_lkr"] for quote in quotes} == {650.0, 500.0, 700.0, 530.0}


def test_parse_dcs_table_rows_uses_current_week_average_price() -> None:
    quoted_at = datetime(2026, 5, 14, tzinfo=timezone.utc)
    rows = [
        ["Item", "Unit", "Avg.Price (Rs.cts.)", "% Change", "Price range"],
        ["Ash Plantain", "1 kg.", "271.97 274.81 281.43", "3.5% 2.4%", "240.00 320.00"],
        ["Gotukola", "Bunch", "60.78 57.50 55.56", "-8.6% -3.4%", "40.00 80.00"],
    ]

    quotes = _parse_dcs_table_rows(rows, quoted_at)

    assert quotes == [
        {
            "district": "Colombo",
            "market_name": "Colombo District (DCS)",
            "item_name": "Ash Plantain",
            "category": "vegetables",
            "unit": "kg",
            "price_lkr": 281.43,
            "source": "dcs",
            "quoted_at": "2026-05-14T00:00:00+00:00",
            "notes": "DCS weekly open market retail price survey, Colombo District.",
        },
        {
            "district": "Colombo",
            "market_name": "Colombo District (DCS)",
            "item_name": "Gotukola",
            "category": "vegetables",
            "unit": "bunch",
            "price_lkr": 55.56,
            "source": "dcs",
            "quoted_at": "2026-05-14T00:00:00+00:00",
            "notes": "DCS weekly open market retail price survey, Colombo District.",
        },
    ]
