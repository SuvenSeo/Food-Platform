from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db.migrate import run_upgrade
from app.db.session import SessionLocal
from app.main import app
from app.models.tables import (
    FairPriceScoreRecord,
    FoodOfferRecord,
    MarketQuoteRecord,
    PriceAggregateRecord,
    RawOfferRecord,
    ScrapeRun,
)

client = TestClient(app)


def seed_api_data() -> None:
    run_upgrade()
    with SessionLocal() as db:
        db.execute(delete(FairPriceScoreRecord))
        db.execute(delete(MarketQuoteRecord))
        db.execute(delete(PriceAggregateRecord))
        db.execute(delete(FoodOfferRecord))
        db.execute(delete(RawOfferRecord))
        db.execute(delete(ScrapeRun))
        db.commit()

        run = ScrapeRun(
            source="spar2u",
            status="completed",
            started_at=datetime.utcnow() - timedelta(minutes=5),
            finished_at=datetime.utcnow(),
            items_seen=2,
            items_stored=2,
        )
        db.add(run)
        db.flush()

        offer = FoodOfferRecord(
            source="spar2u",
            source_item_id="101",
            source_group_id="1",
            category="grocery",
            brand="SPAR",
            canonical_name="local coconut oil",
            display_name="SPAR Local Coconut Oil",
            unit="l",
            unit_amount=1.0,
            pack_descriptor="WT / 1000",
            price_lkr=1600.0,
            price_per_unit_lkr=1600.0,
            currency="LKR",
            available=True,
            sku="COCO-1L",
            url="https://spar2u.lk/products/spar-local-coconut-oil-1l",
            district=None,
            city=None,
            cluster_key="spar|local coconut oil|l|1.000",
            first_seen_at=datetime.utcnow() - timedelta(days=3),
            last_seen_at=datetime.utcnow(),
        )
        db.add(offer)
        db.flush()

        db.add(
            PriceAggregateRecord(
                cluster_key="spar|local coconut oil|l|1.000",
                canonical_name="local coconut oil",
                brand="SPAR",
                category="grocery",
                unit="l",
                unit_amount=1.0,
                offers_count=2,
                min_price_lkr=1600.0,
                max_price_lkr=1700.0,
                median_price_lkr=1650.0,
                average_price_lkr=1650.0,
                calculated_at=datetime.utcnow(),
            )
        )
        db.add(
            FairPriceScoreRecord(
                food_offer_id=offer.id,
                source_item_id="101",
                cluster_key="spar|local coconut oil|l|1.000",
                median_price_lkr=1650.0,
                delta_vs_median_pct=5.88,
                price_band="good-value",
                calculated_at=datetime.utcnow(),
            )
        )
        db.add_all(
            [
                MarketQuoteRecord(
                    district="Colombo",
                    market_name="Pettah",
                    item_name="Tomato",
                    category="vegetables",
                    unit="kg",
                    price_lkr=320.0,
                    source="seed",
                    quoted_at=datetime.utcnow(),
                    notes=None,
                ),
                MarketQuoteRecord(
                    district="Kandy",
                    market_name="Kandy Central",
                    item_name="Tomato",
                    category="vegetables",
                    unit="kg",
                    price_lkr=340.0,
                    source="seed",
                    quoted_at=datetime.utcnow(),
                    notes=None,
                ),
            ]
        )
        db.commit()


def test_stats_summary_and_offer_browse() -> None:
    seed_api_data()

    summary = client.get("/api/v1/stats/summary")
    offers = client.get("/api/v1/offers", params={"category": "grocery"})

    assert summary.status_code == 200
    assert summary.json()["offers_count"] == 1
    assert summary.json()["sources_count"] == 1
    assert offers.status_code == 200
    assert offers.json()["total"] == 1
    assert offers.json()["items"][0]["price_band"] == "good-value"


def test_trends_and_pipeline_status() -> None:
    seed_api_data()

    trends = client.get("/api/v1/trends/grocery")
    pipeline = client.get("/api/v1/pipeline/status")

    assert trends.status_code == 200
    assert trends.json()["items"][0]["median_price_lkr"] == 1650.0
    assert pipeline.status_code == 200
    assert pipeline.json()["items"][0]["source"] == "spar2u"


def test_admin_trigger_requires_key_and_rebuilds_views() -> None:
    seed_api_data()

    unauthorized = client.post("/api/v1/admin/trigger/aggregate")
    authorized = client.post(
        "/api/v1/admin/trigger/aggregate",
        headers={"x-admin-key": "change-me"},
    )

    assert unauthorized.status_code == 403
    assert authorized.status_code == 200
    assert authorized.json()["status"] == "ok"


def test_market_quotes_endpoint_returns_district_focused_data() -> None:
    seed_api_data()

    response = client.get("/api/v1/market-quotes", params={"district": "Colombo"})

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["market_name"] == "Pettah"


def test_hub_manifest_exposes_life_platform_contract() -> None:
    seed_api_data()

    response = client.get("/api/v1/hub/manifest")

    assert response.status_code == 200
    manifest = response.json()
    assert manifest["platform"] == "food"
    assert manifest["summary_endpoint"] == "/api/v1/hub/summary"
    assert manifest["routes"]["explore"] == "/explore"
    assert "market_quotes" in manifest["datasets"]
    assert manifest["linked_platforms"]["vehicle"]["url"].startswith("https://")


def test_homepage_summary_exposes_market_and_retail_signals() -> None:
    seed_api_data()

    response = client.get("/api/v1/home/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["hero"]["platform"] == "Sri Lanka Food Intelligence"
    assert payload["kpis"]["offers_count"] == 1
    assert payload["kpis"]["market_quotes_count"] == 2
    assert payload["spotlights"]["cheapest_offers"][0]["display_name"] == "SPAR Local Coconut Oil"


def test_intelligence_summary_exposes_rankings_and_freshness() -> None:
    seed_api_data()

    response = client.get("/api/v1/intelligence/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["rankings"]["top_value"][0]["price_band"] == "good-value"
    assert payload["sources"][0]["source"] == "spar2u"
