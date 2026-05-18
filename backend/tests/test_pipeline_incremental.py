from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select

from app.db.migrate import run_upgrade
from app.db.session import SessionLocal
from app.models.tables import FairPriceScoreRecord, FoodOfferRecord, PriceAggregateRecord, RawOfferRecord, ScrapeRun
from app.schemas.domain import RawOffer
from app.services.pipeline import rebuild_normalized_views, store_raw_offers


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def test_rebuild_normalized_views_preserves_first_seen_at() -> None:
    run_upgrade()
    first_seen = utc_now() - timedelta(days=10)

    with SessionLocal() as db:
        db.execute(delete(FairPriceScoreRecord))
        db.execute(delete(PriceAggregateRecord))
        db.execute(delete(FoodOfferRecord))
        db.execute(delete(RawOfferRecord))
        db.execute(delete(ScrapeRun))
        db.commit()

        run = ScrapeRun(source="spar2u", status="completed", started_at=first_seen, finished_at=first_seen)
        db.add(run)
        db.flush()

        store_raw_offers(
            db,
            source="spar2u",
            raw_offers=[
                RawOffer(
                    source="spar2u",
                    source_item_id="fixture-1",
                    source_group_id="fixture-1",
                    category="grocery",
                    title="Fixture Rice 1kg",
                    variant_title=None,
                    price_lkr=400.0,
                    currency="LKR",
                    available=True,
                    sku=None,
                    url="https://example.com/rice",
                )
            ],
            run=run,
        )
        db.commit()
        rebuild_normalized_views(db)
        db.commit()

        offer = db.scalar(
            select(FoodOfferRecord).where(
                FoodOfferRecord.source == "spar2u",
                FoodOfferRecord.source_item_id == "fixture-1",
            )
        )
        assert offer is not None
        preserved_first_seen = offer.first_seen_at
        assert offer.price_lkr == 400

        run2 = ScrapeRun(source="spar2u", status="completed", started_at=utc_now(), finished_at=utc_now())
        db.add(run2)
        db.flush()
        store_raw_offers(
            db,
            source="spar2u",
            raw_offers=[
                RawOffer(
                    source="spar2u",
                    source_item_id="fixture-1",
                    source_group_id="fixture-1",
                    category="grocery",
                    title="Fixture Rice 1kg",
                    variant_title=None,
                    price_lkr=420.0,
                    currency="LKR",
                    available=True,
                    sku=None,
                    url="https://example.com/rice",
                )
            ],
            run=run2,
        )
        db.commit()
        rebuild_normalized_views(db)
        db.commit()

        updated = db.scalar(
            select(FoodOfferRecord).where(
                FoodOfferRecord.source == "spar2u",
                FoodOfferRecord.source_item_id == "fixture-1",
            )
        )
        assert updated is not None
        assert updated.first_seen_at == preserved_first_seen
        assert float(updated.price_lkr) == 420.0
        assert db.scalar(select(func.count(FoodOfferRecord.id))) == 1
