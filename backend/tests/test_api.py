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
        market_quote_seen_at = utc_now()
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
                    quoted_at=market_quote_seen_at,
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
                    quoted_at=market_quote_seen_at,
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


def test_platform_freshness_exposes_confidence_and_provenance() -> None:
    seed_api_data()

    response = client.get("/api/v1/platform/freshness")

    assert response.status_code == 200
    payload = response.json()
    assert payload["freshness"]["last_scrape_at"] is not None
    assert payload["coverage"]["offers_count"] == 1
    assert payload["coverage"]["market_quotes_count"] == 2
    assert payload["pipeline"]["healthy_sources"] >= 1
    assert payload["pipeline"]["total_sources"] >= 8
    assert {source["source"] for source in payload["pipeline"]["sources"]} >= {
        "spar2u",
        "glomark",
        "keells",
        "cargills",
        "wfp",
        "cbsl",
        "dcs",
        "doa",
        "harti",
        "fisheries",
    }
    assert payload["pipeline"]["blocking_warnings"]
    assert payload["confidence"]["score"] >= 0
    assert payload["confidence"]["grade"] in {"high", "medium", "low"}
    assert payload["confidence"]["grade"] != "high"
    assert payload["datasets"]["offers"]["dataset"] == "offers"
    assert payload["datasets"]["offers"]["reliability"]["grade"] in {"high", "medium", "low"}
    assert payload["datasets"]["market_quotes"]["dataset"] == "market_quotes"
    assert payload["datasets"]["price_aggregates"]["dataset"] == "price_aggregates"


def test_intelligence_brief_exposes_trust_and_actions() -> None:
    seed_api_data()

    response = client.get("/api/v1/intelligence/brief")

    assert response.status_code == 200
    payload = response.json()
    assert payload["brief"]["urgency"] in {"routine", "watch", "action-needed"}
    assert len(payload["brief"]["recommendations"]) == 3
    assert payload["trust"]["confidence"]["grade"] in {"high", "medium", "low"}
    assert payload["trust"]["datasets"]["offers"]["records_count"] == 1
    assert payload["top_value_offer"]["display_name"] == "SPAR Local Coconut Oil"
    assert payload["latest_market_signal"]["item_name"] == "Tomato"


def test_ops_reliability_summary_exposes_dataset_health() -> None:
    seed_api_data()

    response = client.get("/api/v1/ops/reliability/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"ok", "degraded", "critical"}
    assert payload["confidence"]["grade"] in {"high", "medium", "low"}
    assert payload["pipeline"]["healthy_sources"] >= 1
    assert isinstance(payload["stale_datasets"], list)
    assert len(payload["datasets"]) == 3
    assert payload["datasets"][0]["dataset"] == "offers"


def test_ops_database_provider_exposes_safe_runtime_indicator() -> None:
    seed_api_data()

    response = client.get("/api/v1/ops/database/provider")

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] in {"sqlite", "supabase-postgres", "postgres-compatible"}
    assert payload["dialect"] in {"sqlite", "postgresql"}
    assert isinstance(payload["is_supabase_host"], bool)
    assert isinstance(payload["host_hint"], list)
    assert isinstance(payload["database_present"], bool)


def test_trends_and_pipeline_status() -> None:
    seed_api_data()

    trends = client.get("/api/v1/trends/grocery")
    pipeline = client.get("/api/v1/pipeline/status")
    runs = client.get("/api/v1/pipeline/runs")

    assert trends.status_code == 200
    assert trends.json()["items"][0]["median_price_lkr"] == 1650.0
    assert pipeline.status_code == 200
    assert pipeline.json()["items"][0]["source"] == "spar2u"
    assert pipeline.json()["items"][0]["source_type"] == "retail"
    assert pipeline.json()["items"][0]["health"] == "healthy"
    assert pipeline.json()["summary"]["total_sources"] >= 10
    assert runs.status_code == 200
    assert runs.json()["total"] == 1
    assert runs.json()["items"][0]["status"] == "completed"


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


def test_market_quotes_endpoint_filters_by_source_search_and_returns_facets() -> None:
    seed_api_data()

    response = client.get(
        "/api/v1/market-quotes",
        params={"source": "seed-kandy", "search": "central"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["source"] == "seed-kandy"
    assert payload["items"][0]["market_name"] == "Kandy Central"
    assert payload["facets"]["sources"] == [
        {"value": "seed-colombo", "label": "seed-colombo", "count": 1},
        {"value": "seed-kandy", "label": "seed-kandy", "count": 1},
    ]
    assert payload["facets"]["districts"] == [
        {"value": "Colombo", "label": "Colombo", "count": 1},
        {"value": "Kandy", "label": "Kandy", "count": 1},
    ]
    assert payload["facets"]["categories"] == [{"value": "vegetables", "label": "vegetables", "count": 2}]


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


def test_intelligence_value_claims_rank_by_delta_and_ignore_single_offer_clusters() -> None:
    seed_api_data()
    with SessionLocal() as db:
        strong_offer = FoodOfferRecord(
            source="glomark",
            source_item_id="501",
            source_group_id="501",
            category="grocery",
            brand="Deal",
            canonical_name="high delta coconut oil",
            display_name="High Delta Coconut Oil",
            unit="l",
            unit_amount=1.0,
            pack_descriptor="1l",
            price_lkr=1800.0,
            price_per_unit_lkr=1800.0,
            currency="LKR",
            available=True,
            sku="HD-1L",
            url="https://example.test/high-delta-coconut-oil",
            district=None,
            city=None,
            cluster_key="oil|high-delta|l|1.000",
            first_seen_at=utc_now() - timedelta(days=5),
            last_seen_at=utc_now() - timedelta(days=2),
        )
        one_offer = FoodOfferRecord(
            source="field-note",
            source_item_id="901",
            source_group_id="901",
            category="grocery",
            brand=None,
            canonical_name="single offer salt",
            display_name="Single Offer Salt",
            unit="kg",
            unit_amount=1.0,
            pack_descriptor="1kg",
            price_lkr=50.0,
            price_per_unit_lkr=50.0,
            currency="LKR",
            available=True,
            sku="SALT-1KG",
            url="https://example.test/single-offer-salt",
            district=None,
            city=None,
            cluster_key="salt|single|kg|1.000",
            first_seen_at=utc_now() - timedelta(days=1),
            last_seen_at=utc_now(),
        )
        db.add_all([strong_offer, one_offer])
        db.flush()
        db.add_all(
            [
                PriceAggregateRecord(
                    cluster_key="oil|high-delta|l|1.000",
                    canonical_name="high delta coconut oil",
                    brand="Deal",
                    category="grocery",
                    unit="l",
                    unit_amount=1.0,
                    offers_count=4,
                    min_price_lkr=1800.0,
                    max_price_lkr=2500.0,
                    median_price_lkr=2400.0,
                    average_price_lkr=2200.0,
                    calculated_at=utc_now(),
                ),
                PriceAggregateRecord(
                    cluster_key="salt|single|kg|1.000",
                    canonical_name="single offer salt",
                    brand=None,
                    category="grocery",
                    unit="kg",
                    unit_amount=1.0,
                    offers_count=1,
                    min_price_lkr=50.0,
                    max_price_lkr=50.0,
                    median_price_lkr=50.0,
                    average_price_lkr=50.0,
                    calculated_at=utc_now(),
                ),
                FairPriceScoreRecord(
                    food_offer_id=strong_offer.id,
                    source_item_id="501",
                    cluster_key="oil|high-delta|l|1.000",
                    median_price_lkr=2400.0,
                    delta_vs_median_pct=25.0,
                    price_band="good-value",
                    calculated_at=utc_now(),
                ),
                FairPriceScoreRecord(
                    food_offer_id=one_offer.id,
                    source_item_id="901",
                    cluster_key="salt|single|kg|1.000",
                    median_price_lkr=50.0,
                    delta_vs_median_pct=90.0,
                    price_band="good-value",
                    calculated_at=utc_now(),
                ),
            ]
        )
        db.commit()

    summary_response = client.get("/api/v1/intelligence/summary")
    brief_response = client.get("/api/v1/intelligence/brief")

    assert summary_response.status_code == 200
    summary_payload = summary_response.json()
    top_value_names = [item["display_name"] for item in summary_payload["rankings"]["top_value"]]
    assert top_value_names[0] == "High Delta Coconut Oil"
    assert "Single Offer Salt" not in top_value_names

    assert brief_response.status_code == 200
    assert brief_response.json()["top_value_offer"]["display_name"] == "High Delta Coconut Oil"


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


def test_district_compare_filters_stale_and_non_food_quotes() -> None:
    seed_api_data()
    old_timestamp = utc_now() - timedelta(days=800)
    with SessionLocal() as db:
        db.add_all(
            [
                MarketQuoteRecord(
                    district="Colombo",
                    market_name="Legacy Pump",
                    item_name="Diesel",
                    category="fuel",
                    unit="l",
                    price_lkr=121.0,
                    source="legacy-fuel-colombo",
                    quoted_at=old_timestamp,
                    notes=None,
                ),
                MarketQuoteRecord(
                    district="Kandy",
                    market_name="Legacy Pump",
                    item_name="Diesel",
                    category="fuel",
                    unit="l",
                    price_lkr=124.0,
                    source="legacy-fuel-kandy",
                    quoted_at=old_timestamp,
                    notes=None,
                ),
                MarketQuoteRecord(
                    district="Colombo",
                    market_name="Old Archive",
                    item_name="Wheat Flour",
                    category="grains",
                    unit="kg",
                    price_lkr=180.0,
                    source="legacy-grains-colombo",
                    quoted_at=old_timestamp,
                    notes=None,
                ),
                MarketQuoteRecord(
                    district="Kandy",
                    market_name="Old Archive",
                    item_name="Wheat Flour",
                    category="grains",
                    unit="kg",
                    price_lkr=190.0,
                    source="legacy-grains-kandy",
                    quoted_at=old_timestamp,
                    notes=None,
                ),
            ]
        )
        db.commit()

    response = client.get("/api/v1/compare/districts", params={"left": "Colombo", "right": "Kandy"})

    assert response.status_code == 200
    item_names = [item["item_name"] for item in response.json()["items"]]
    assert item_names == ["Tomato"]


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


def test_basket_estimate_prefers_recent_market_quote_over_stale_low_price() -> None:
    seed_api_data()
    with SessionLocal() as db:
        db.add(
            MarketQuoteRecord(
                district="Colombo",
                market_name="Old Archive",
                item_name="Tomato",
                category="vegetables",
                unit="kg",
                price_lkr=18.0,
                source="legacy-colombo",
                quoted_at=utc_now() - timedelta(days=800),
                notes=None,
            )
        )
        db.commit()

    response = client.get("/api/v1/basket/estimate", params={"preset": "essentials"})

    assert response.status_code == 200
    payload = response.json()
    market_item = next(item for item in payload["items"] if item["kind"] == "market_quote")
    assert market_item["price_lkr"] == 320.0
    assert payload["summary"]["totals_by_kind"]["market_quote"]["total_lkr"] == 320.0


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


def test_offer_payload_exposes_original_and_normalized_unit_metadata() -> None:
    seed_api_data()

    response = client.get("/api/v1/offers")

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["original_title"] is None
    assert item["original_unit_text"] == "WT / 1000"
    assert item["normalized_unit"] == "l"
    assert item["normalized_unit_amount"] == 1.0
    assert item["normalized_unit_price_lkr"] == 1600.0
    assert item["normalization_confidence"] > 0
    assert item["last_seen_at"] is not None


def test_offer_browse_returns_catalog_facets_and_server_filters() -> None:
    seed_api_data()

    response = client.get("/api/v1/offers", params={"source": "spar2u", "unit": "l", "sort_by": "unit-low"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["source"] == "spar2u"
    assert payload["facets"]["sources"][0]["value"] == "spar2u"
    assert payload["facets"]["sources"][0]["count"] == 1
    assert payload["facets"]["units"][0]["value"] == "l"


def test_item_intelligence_endpoints_and_exports() -> None:
    seed_api_data()

    index_response = client.get("/api/v1/items")
    detail_response = client.get("/api/v1/items/local-coconut-oil")
    history_response = client.get("/api/v1/items/tomato/history")
    csv_response = client.get("/api/v1/items/tomato/history.csv")
    json_response = client.get("/api/v1/items/tomato/history.json")

    assert index_response.status_code == 200
    assert index_response.json()["items"][0]["slug"] == "local-coconut-oil"
    assert detail_response.status_code == 200
    assert detail_response.json()["item"]["canonical_name"] == "local coconut oil"
    assert detail_response.json()["source_comparison"][0]["source"] == "spar2u"
    assert history_response.status_code == 200
    assert history_response.json()["series"][0]["period"]
    assert history_response.json()["forecast"]["direction"] in {"steady", "up", "down", "insufficient-data"}
    assert csv_response.status_code == 200
    assert "text/csv" in csv_response.headers["content-type"]
    assert "period,avg_price_lkr" in csv_response.text
    assert json_response.status_code == 200
    assert json_response.json()["item"]["slug"] == "tomato"


def test_item_search_matches_food_names_not_broad_categories() -> None:
    seed_api_data()
    with SessionLocal() as db:
        db.add_all(
            [
                PriceAggregateRecord(
                    cluster_key="market|carrot|kg|1.000",
                    canonical_name="carrot",
                    brand=None,
                    category="rice & grains",
                    unit="kg",
                    unit_amount=1.0,
                    offers_count=1,
                    min_price_lkr=260.0,
                    max_price_lkr=260.0,
                    median_price_lkr=260.0,
                    average_price_lkr=260.0,
                    calculated_at=utc_now(),
                ),
                PriceAggregateRecord(
                    cluster_key="market|red rice|kg|1.000",
                    canonical_name="red rice",
                    brand=None,
                    category="rice & grains",
                    unit="kg",
                    unit_amount=1.0,
                    offers_count=1,
                    min_price_lkr=230.0,
                    max_price_lkr=230.0,
                    median_price_lkr=230.0,
                    average_price_lkr=230.0,
                    calculated_at=utc_now(),
                ),
            ]
        )
        db.commit()

    response = client.get("/api/v1/items", params={"search": "rice"})

    assert response.status_code == 200
    names = [item["canonical_name"] for item in response.json()["items"]]
    assert "red rice" in names
    assert "carrot" not in names
