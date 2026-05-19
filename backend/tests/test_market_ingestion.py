from datetime import datetime, timezone

from sqlalchemy import delete, select

from app.db.migrate import run_upgrade
from app.db.session import SessionLocal
from app.models.tables import MarketQuoteRecord, ScrapeRun
from app.services import market_quotes


def reset_market_tables() -> None:
    run_upgrade()
    with SessionLocal() as db:
        db.execute(delete(MarketQuoteRecord))
        db.execute(delete(ScrapeRun))
        db.commit()


def _quote(price: float) -> dict[str, object]:
    return {
        "district": "Colombo",
        "market_name": "Pettah",
        "item_name": "Tomato",
        "category": "vegetables",
        "unit": "kg",
        "price_lkr": price,
        "source": "wfp",
        "quoted_at": "2026-05-19T00:00:00+00:00",
        "notes": "retail",
    }


def test_official_market_ingestion_creates_scrape_run_and_upserts(monkeypatch) -> None:
    reset_market_tables()

    monkeypatch.setitem(market_quotes.OFFICIAL_MARKET_FETCHERS, "wfp", lambda timeout=30.0: [_quote(320.0)])
    first = market_quotes.ingest_official_market_quotes(sources=["wfp"])
    monkeypatch.setitem(market_quotes.OFFICIAL_MARKET_FETCHERS, "wfp", lambda timeout=30.0: [_quote(330.0)])
    second = market_quotes.ingest_official_market_quotes(sources=["wfp"])

    assert first["results"]["wfp"]["status"] == "ok"
    assert second["results"]["wfp"]["source_quotes_added"] == 0
    assert second["results"]["wfp"]["source_quotes_updated"] == 1

    with SessionLocal() as db:
        runs = db.scalars(select(ScrapeRun).where(ScrapeRun.source == "wfp").order_by(ScrapeRun.id.asc())).all()
        rows = db.scalars(select(MarketQuoteRecord).where(MarketQuoteRecord.source == "wfp")).all()

    assert [run.status for run in runs] == ["completed", "completed"]
    assert runs[-1].items_seen == 1
    assert runs[-1].items_stored == 1
    assert len(rows) == 1
    assert float(rows[0].price_lkr) == 330.0


def test_official_market_ingestion_marks_zero_row_source_failed(monkeypatch) -> None:
    reset_market_tables()
    with SessionLocal() as db:
        db.add(
            MarketQuoteRecord(
                district="Colombo",
                market_name="Pettah",
                item_name="Tomato",
                category="vegetables",
                unit="kg",
                price_lkr=320.0,
                source="doa",
                quoted_at=datetime.now(timezone.utc),
            )
        )
        db.commit()

    monkeypatch.setitem(market_quotes.OFFICIAL_MARKET_FETCHERS, "doa", lambda timeout=30.0: [])

    result = market_quotes.ingest_official_market_quotes(sources=["doa"])

    assert result["results"]["doa"]["status"] == "error"
    with SessionLocal() as db:
        run = db.scalar(select(ScrapeRun).where(ScrapeRun.source == "doa"))
        row_count = len(db.scalars(select(MarketQuoteRecord).where(MarketQuoteRecord.source == "doa")).all())

    assert run is not None
    assert run.status == "failed"
    assert run.items_seen == 0
    assert row_count == 1
