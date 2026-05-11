from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.tables import FairPriceScoreRecord, FoodOfferRecord, PriceAggregateRecord, RawOfferRecord, ScrapeRun
from app.schemas.domain import RawOffer
from app.services.aggregator import aggregate_offer_clusters
from app.services.fair_price import score_offers_by_cluster
from app.services.normalization import normalize_offer


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def start_scrape_run(db: Session, source: str) -> ScrapeRun:
    run = ScrapeRun(source=source, status="running", started_at=utc_now())
    db.add(run)
    db.flush()
    return run


def finish_scrape_run(db: Session, run: ScrapeRun, *, items_seen: int, items_stored: int, error_message: str | None = None) -> None:
    run.finished_at = utc_now()
    run.items_seen = items_seen
    run.items_stored = items_stored
    run.status = "failed" if error_message else "completed"
    run.error_message = error_message


def store_raw_offers(db: Session, source: str, raw_offers: list[RawOffer], run: ScrapeRun | None = None) -> list[RawOfferRecord]:
    now = utc_now()
    records: list[RawOfferRecord] = []
    for offer in raw_offers:
        record = RawOfferRecord(
            scrape_run_id=run.id if run else None,
            source=source,
            source_item_id=offer.source_item_id,
            source_group_id=offer.source_group_id,
            category=offer.category,
            title=offer.title,
            variant_title=offer.variant_title,
            price_lkr=offer.price_lkr,
            currency=offer.currency,
            available=offer.available,
            sku=offer.sku,
            url=offer.url,
            raw_payload={
                "title": offer.title,
                "variant_title": offer.variant_title,
                "price_lkr": offer.price_lkr,
                "currency": offer.currency,
                "available": offer.available,
                "sku": offer.sku,
                "url": offer.url,
            },
            scraped_at=now,
        )
        db.add(record)
        records.append(record)
    db.flush()
    return records


def rebuild_normalized_views(db: Session) -> None:
    db.execute(delete(FairPriceScoreRecord))
    db.execute(delete(PriceAggregateRecord))
    db.execute(delete(FoodOfferRecord))
    db.flush()

    raw_records = db.scalars(select(RawOfferRecord).order_by(RawOfferRecord.scraped_at.desc())).all()
    normalized_rows: list[FoodOfferRecord] = []
    normalized_domain = []

    for raw_record in raw_records:
        normalized = normalize_offer(
            RawOffer(
                source=raw_record.source,
                source_item_id=raw_record.source_item_id,
                source_group_id=raw_record.source_group_id,
                category=raw_record.category,
                title=raw_record.title,
                variant_title=raw_record.variant_title,
                price_lkr=float(raw_record.price_lkr),
                currency=raw_record.currency,
                available=raw_record.available,
                sku=raw_record.sku,
                url=raw_record.url,
            )
        )
        normalized_domain.append(normalized)
        normalized_rows.append(
            FoodOfferRecord(
                raw_offer_id=raw_record.id,
                source=normalized.source,
                source_item_id=normalized.source_item_id,
                source_group_id=normalized.source_group_id,
                category=normalized.category,
                brand=normalized.brand,
                canonical_name=normalized.canonical_name,
                display_name=normalized.display_name,
                unit=normalized.unit,
                unit_amount=normalized.unit_amount,
                pack_descriptor=normalized.pack_descriptor,
                price_lkr=normalized.price_lkr,
                price_per_unit_lkr=normalized.price_per_unit_lkr,
                currency=normalized.currency,
                available=normalized.available,
                sku=normalized.sku,
                url=normalized.url,
                cluster_key=normalized.cluster_key,
                first_seen_at=raw_record.scraped_at,
                last_seen_at=raw_record.scraped_at,
            )
        )

    db.add_all(normalized_rows)
    db.flush()

    aggregates = aggregate_offer_clusters(normalized_domain)
    db.add_all(
        [
            PriceAggregateRecord(
                cluster_key=item.cluster_key,
                canonical_name=item.canonical_name,
                brand=item.brand,
                category=item.category,
                unit=item.unit,
                unit_amount=item.unit_amount,
                offers_count=item.offers_count,
                min_price_lkr=item.min_price_lkr,
                max_price_lkr=item.max_price_lkr,
                median_price_lkr=item.median_price_lkr,
                average_price_lkr=item.average_price_lkr,
                calculated_at=utc_now(),
            )
            for item in aggregates
        ]
    )

    by_offer_key = {
        (item.source, item.source_item_id): row for item, row in zip(normalized_domain, normalized_rows, strict=False)
    }
    scores = score_offers_by_cluster(normalized_domain)
    db.add_all(
        [
            FairPriceScoreRecord(
                food_offer_id=by_offer_key[(source, source_item_id)].id,
                source_item_id=score.source_item_id,
                cluster_key=score.cluster_key,
                median_price_lkr=score.median_price_lkr,
                delta_vs_median_pct=score.delta_vs_median_pct,
                price_band=score.price_band,
                calculated_at=utc_now(),
            )
            for (source, source_item_id), score in scores.items()
        ]
    )

    db.flush()
