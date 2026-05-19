import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db.migrate import run_upgrade
from app.db.session import SessionLocal
from app.main import app
from app.models.tables import MarketQuoteRecord, ScrapeRun
from app.scrapers.glomark import parse_glomark_category
from app.scrapers.spar2u import parse_spar2u_catalog

client = TestClient(app)
FIXTURES = Path(__file__).parent / "fixtures"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def test_trust_counts_zero_yield_completed_run_as_unhealthy() -> None:
    run_upgrade()
    with SessionLocal() as db:
        db.execute(delete(MarketQuoteRecord))
        db.execute(delete(ScrapeRun))
        db.commit()

        db.add(
            ScrapeRun(
                source="keells",
                status="completed",
                started_at=utc_now() - timedelta(minutes=10),
                finished_at=utc_now(),
                items_seen=0,
                items_stored=0,
            )
        )
        db.commit()

    response = client.get("/api/v1/platform/freshness")
    assert response.status_code == 200
    pipeline = response.json()["pipeline"]
    assert pipeline["healthy_sources"] == 0
    assert pipeline["total_sources"] >= 8
    source_row = next(row for row in pipeline["sources"] if row["source"] == "keells")
    assert source_row["source"] == "keells"
    assert source_row["health"] in {"empty", "degraded"}


def test_trust_marks_degraded_after_three_consecutive_zero_runs() -> None:
    run_upgrade()
    with SessionLocal() as db:
        db.execute(delete(ScrapeRun))
        db.commit()
        for offset in range(3):
            db.add(
                ScrapeRun(
                    source="cargills",
                    status="completed",
                    started_at=utc_now() - timedelta(hours=offset + 1),
                    finished_at=utc_now() - timedelta(hours=offset),
                    items_seen=0,
                    items_stored=0,
                )
            )
        db.commit()

    response = client.get("/api/v1/platform/freshness")
    assert response.status_code == 200
    pipeline = response.json()["pipeline"]
    assert pipeline["degraded_sources"] == 1
    cargills = next(row for row in pipeline["sources"] if row["source"] == "cargills")
    assert cargills["health"] == "degraded"


def test_trust_uses_daily_cadence_for_market_quote_freshness() -> None:
    run_upgrade()
    with SessionLocal() as db:
        db.execute(delete(MarketQuoteRecord))
        db.commit()
        db.add(
            MarketQuoteRecord(
                district="Colombo",
                market_name="Pettah",
                item_name="Tomato",
                category="vegetables",
                unit="kg",
                price_lkr=320.0,
                source="harti",
                quoted_at=utc_now() - timedelta(hours=12),
            )
        )
        db.commit()

    response = client.get("/api/v1/platform/freshness")

    assert response.status_code == 200
    market_dataset = response.json()["datasets"]["market_quotes"]
    assert market_dataset["freshness_status"] == "fresh"
    assert market_dataset["reliability"]["grade"] == "high"


def test_trends_market_contract() -> None:
    run_upgrade()
    with SessionLocal() as db:
        db.execute(delete(MarketQuoteRecord))
        db.commit()
        quoted = utc_now() - timedelta(days=30)
        db.add_all(
            [
                MarketQuoteRecord(
                    district="Colombo",
                    market_name="Pettah",
                    item_name="Rice (red nadu)",
                    category="grains",
                    unit="kg",
                    price_lkr=220.0,
                    source="wfp",
                    quoted_at=quoted,
                ),
                MarketQuoteRecord(
                    district="Colombo",
                    market_name="Pettah",
                    item_name="Rice (red nadu)",
                    category="grains",
                    unit="kg",
                    price_lkr=225.0,
                    source="wfp",
                    quoted_at=utc_now(),
                ),
            ]
        )
        db.commit()

    response = client.get(
        "/api/v1/trends/market",
        params={"item": "Rice", "district": "Colombo", "granularity": "monthly"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["item"] == "Rice"
    assert payload["district"] == "Colombo"
    assert payload["granularity"] == "monthly"
    assert isinstance(payload["series"], list)
    assert payload["total_data_points"] >= 1
    assert "date_range" in payload
    if payload["series"]:
        point = payload["series"][0]
        assert {"period", "avg_price", "min_price", "max_price", "data_points"} <= set(point.keys())


def test_trends_market_route_not_shadowed_by_category_catchall() -> None:
    summary = client.get("/api/v1/trends/summary")
    market = client.get("/api/v1/trends/market", params={"item": "Tomato"})
    category = client.get("/api/v1/trends/grocery")

    assert summary.status_code == 200
    assert "total_market_data_points" in summary.json()
    assert market.status_code == 200
    assert "series" in market.json()
    assert category.status_code == 200
    assert "items" in category.json()


def test_retention_preview_rejects_invalid_email() -> None:
    response = client.post(
        "/api/v1/retention/subscriptions/preview",
        json={
            "email": "not-an-email",
            "cadence": "weekly",
            "channels": ["email"],
            "districts": [],
            "categories": [],
            "compare_mode": "district",
        },
    )
    assert response.status_code == 422


def test_fixture_spar2u_catalog_parses() -> None:
    payload = json.loads((FIXTURES / "spar2u_products.json").read_text(encoding="utf-8"))
    offers = parse_spar2u_catalog(payload)
    assert len(offers) == 1
    assert offers[0].source == "spar2u"
    assert offers[0].price_lkr == 450.0


def test_fixture_glomark_category_parses() -> None:
    html = (FIXTURES / "glomark_category.html").read_text(encoding="utf-8")
    offers = parse_glomark_category(html, category="Grocery")
    assert len(offers) == 1
    assert offers[0].source_item_id == "50001"
    assert offers[0].price_lkr == 460.0
