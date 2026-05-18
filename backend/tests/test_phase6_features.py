from datetime import timedelta

from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.models.tables import AlertSubscriptionRecord, MarketQuoteRecord
from tests.test_api import client, seed_api_data, utc_now


def test_changes_feed_lists_retail_and_market_events() -> None:
    seed_api_data()
    with SessionLocal() as db:
        db.add(
            MarketQuoteRecord(
                district="Colombo",
                market_name="Pettah",
                item_name="Tomato",
                category="vegetables",
                unit="kg",
                price_lkr=300.0,
                source="seed-colombo-historical",
                quoted_at=utc_now() - timedelta(days=7),
                notes=None,
            )
        )
        db.commit()

    response = client.get("/api/v1/changes", params={"limit": 20})

    assert response.status_code == 200
    payload = response.json()
    assert payload["counts"]["total"] >= 1
    kinds = {item["kind"] for item in payload["items"]}
    assert "retail_offer" in kinds or "market_quote" in kinds


def test_embed_summary_returns_html_badge() -> None:
    seed_api_data()

    response = client.get(
        "/api/v1/embed/summary",
        params={"kind": "basket", "preset": "essentials", "theme": "dark"},
    )

    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "LKR" in response.text
    assert "Essentials Basket" in response.text


def test_alerts_subscribe_preview_mode_without_resend() -> None:
    seed_api_data()
    with SessionLocal() as db:
        db.execute(delete(AlertSubscriptionRecord))
        db.commit()

    response = client.post(
        "/api/v1/alerts/subscribe",
        json={
            "email": "alerts@example.com",
            "scope": "basket",
            "scope_value": "essentials",
            "cadence": "weekly",
        },
    )

    assert response.status_code == 202
    payload = response.json()
    assert payload["ok"] is True
    assert payload["preview_mode"] is True

    with SessionLocal() as db:
        row = db.scalar(
            select(AlertSubscriptionRecord).where(AlertSubscriptionRecord.email == "alerts@example.com")
        )
        assert row is not None
        assert row.scope == "basket"
        assert row.scope_value == "essentials"


def test_basket_presets_include_four_families() -> None:
    seed_api_data()

    response = client.get("/api/v1/basket/estimate", params={"preset": "essentials"})

    assert response.status_code == 200
    preset_ids = {item["id"] for item in response.json()["available_presets"]}
    assert preset_ids == {"essentials", "protein", "smart-saver", "festive"}
