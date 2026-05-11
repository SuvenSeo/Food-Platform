from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db.migrate import run_upgrade
from app.db.session import SessionLocal
from app.main import app
from app.api.v1.endpoints import admin as admin_endpoint
from app.models.tables import (
    FairPriceScoreRecord,
    FoodOfferRecord,
    MarketQuoteRecord,
    PriceAggregateRecord,
    RawOfferRecord,
    ScrapeRun,
)

client = TestClient(app)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


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
            started_at=utc_now() - timedelta(minutes=5),
            finished_at=utc_now(),
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
            first_seen_at=utc_now() - timedelta(days=3),
            last_seen_at=utc_now(),
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
                calculated_at=utc_now(),
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
                calculated_at=utc_now(),
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
                    source="seed-colombo",
                    quoted_at=utc_now(),
                    notes=None,
                ),
                MarketQuoteRecord(
                    district="Kandy",
                    market_name="Kandy Central",
                    item_name="Tomato",
                    category="vegetables",
                    unit="kg",
                    price_lkr=340.0,
                    source="seed-kandy",
                    quoted_at=utc_now(),
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


def test_admin_trigger_rejects_insecure_default_key_in_non_dev(monkeypatch) -> None:
    seed_api_data()
    original_env = admin_endpoint.settings.app_env
    original_key = admin_endpoint.settings.admin_api_key
    monkeypatch.setattr(admin_endpoint.settings, "app_env", "production")
    monkeypatch.setattr(admin_endpoint.settings, "admin_api_key", "change-me")

    response = client.post(
        "/api/v1/admin/trigger/aggregate",
        headers={"x-admin-key": "change-me"},
    )

    assert response.status_code == 503
    assert "not securely configured" in response.json()["detail"]

    monkeypatch.setattr(admin_endpoint.settings, "app_env", original_env)
    monkeypatch.setattr(admin_endpoint.settings, "admin_api_key", original_key)


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
    assert manifest["routes"]["intelligence"] == "/intelligence"
    assert manifest["routes"]["watchlists"] == "/watchlists"
    assert "market_quotes" in manifest["datasets"]
    assert "basket_estimate" in manifest["datasets"]
    assert manifest["linked_platforms"]["vehicle"]["url"].startswith("https://")


def test_hub_summary_exposes_pages_and_utilities() -> None:
    seed_api_data()

    response = client.get("/api/v1/hub/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["platform"] == "food"
    assert payload["coverage"]["offers_count"] == 1
    assert payload["coverage"]["market_quotes_count"] == 2
    assert "categories" in payload["available_pages"]
    assert "watchlists" in payload["available_pages"]
    assert payload["utility_surfaces"]["basket_preset"] == "essentials"


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


def test_categories_summary_combines_retail_and_market_coverage() -> None:
    seed_api_data()

    response = client.get("/api/v1/categories/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["items"][0]["category"] == "grocery"
    assert payload["items"][0]["retail_offers_count"] == 1
    assert payload["items"][1]["category"] == "vegetables"
    assert payload["items"][1]["market_quotes_count"] == 2


def test_district_compare_summary_exposes_price_delta() -> None:
    seed_api_data()

    response = client.get("/api/v1/compare/districts", params={"left": "Colombo", "right": "Kandy"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "district"
    assert payload["items"][0]["item_name"] == "Tomato"
    assert payload["items"][0]["left_price_lkr"] == 320.0
    assert payload["items"][0]["right_price_lkr"] == 340.0
    assert payload["items"][0]["cheaper_side"] == "left"


def test_basket_estimate_returns_total_for_essentials_preset() -> None:
    seed_api_data()

    response = client.get("/api/v1/basket/estimate", params={"preset": "essentials"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["preset"]["id"] == "essentials"
    assert any(item["id"] == "smart-saver" for item in payload["available_presets"])
    assert payload["summary"]["available_items"] == 2
    assert payload["summary"]["total_lkr"] == 1920.0
    assert payload["summary"]["totals_by_kind"]["offer"]["count"] == 1
    assert payload["summary"]["totals_by_kind"]["market_quote"]["count"] == 1
    assert payload["summary"]["totals_by_kind"]["offer"]["total_lkr"] == 1600.0
    assert payload["summary"]["totals_by_kind"]["market_quote"]["total_lkr"] == 320.0
    assert payload["items"][0]["availability_status"] == "available"
    assert payload["items"][0]["availability_reason"] == "best_match_found"
    assert isinstance(payload["items"][0]["alternatives"], list)


def test_basket_estimate_supports_multiple_presets() -> None:
    seed_api_data()

    response = client.get("/api/v1/basket/estimate", params={"preset": "smart-saver"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["preset"]["id"] == "smart-saver"
    assert payload["summary"]["available_items"] == 1
    assert payload["summary"]["total_lkr"] == 1600.0


def test_compare_sources_summary_exposes_price_delta() -> None:
    seed_api_data()

    response = client.get("/api/v1/compare/sources", params={"left": "seed-colombo", "right": "seed-kandy"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "source"
    assert payload["left"] == "seed-colombo"
    assert payload["right"] == "seed-kandy"
    assert payload["items"][0]["item_name"] == "Tomato"
    assert payload["items"][0]["left_price_lkr"] == 320.0
    assert payload["items"][0]["right_price_lkr"] == 340.0
    assert payload["items"][0]["cheaper_side"] == "left"


def test_retention_subscription_schema_and_preview() -> None:
    seed_api_data()

    schema_response = client.get("/api/v1/retention/subscriptions/schema")
    preview_response = client.post(
        "/api/v1/retention/subscriptions/preview",
        json={
            "email": "foodwatch@example.com",
            "cadence": "weekly",
            "channels": ["email"],
            "districts": ["Colombo"],
            "categories": ["vegetables"],
            "compare_mode": "source",
        },
    )

    assert schema_response.status_code == 200
    schema_payload = schema_response.json()
    assert "cadence" in schema_payload["fields"]
    assert "weekly" in schema_payload["fields"]["cadence"]["allowed"]
    assert "source" in schema_payload["fields"]["compare_mode"]["allowed"]

    assert preview_response.status_code == 200
    preview_payload = preview_response.json()
    assert preview_payload["accepted"] is True
    assert preview_payload["subscription"]["email"] == "foodwatch@example.com"
    assert preview_payload["subscription"]["compare_mode"] == "source"
    assert preview_payload["preview"]["signals"]["matching_market_quotes"] == 1


def test_offer_detail_returns_404_when_missing() -> None:
    seed_api_data()

    response = client.get("/api/v1/offers/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Offer not found"
