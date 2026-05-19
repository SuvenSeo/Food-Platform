from datetime import datetime, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db.sequences import sync_postgres_id_sequence
from app.models.tables import FairPriceScoreRecord, FoodOfferRecord, PriceAggregateRecord, RawOfferRecord, ScrapeRun
from app.schemas.domain import RawOffer
from app.services.aggregator import aggregate_offer_clusters
from app.services.fair_price import score_offers_by_cluster
from app.services.normalization import normalize_offer


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def start_scrape_run(db: Session, source: str) -> ScrapeRun:
    sync_postgres_id_sequence(db, ScrapeRun.__tablename__)
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
    if raw_offers:
        sync_postgres_id_sequence(db, RawOfferRecord.__tablename__)
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
            image_url=offer.image_url,
            raw_payload={
                "title": offer.title,
                "variant_title": offer.variant_title,
                "price_lkr": offer.price_lkr,
                "currency": offer.currency,
                "available": offer.available,
                "sku": offer.sku,
                "url": offer.url,
                "image_url": offer.image_url,
            },
            scraped_at=now,
        )
        db.add(record)
        records.append(record)
    db.flush()
    return records


def _latest_raw_offer_rows(db: Session) -> list[RawOfferRecord]:
    """One snapshot per (source, source_item_id) — most recent scrape wins."""
    latest = (
        select(
            RawOfferRecord.source,
            RawOfferRecord.source_item_id,
            func.max(RawOfferRecord.scraped_at).label("max_scraped_at"),
        )
        .group_by(RawOfferRecord.source, RawOfferRecord.source_item_id)
        .subquery()
    )
    return list(
        db.scalars(
            select(RawOfferRecord)
            .join(
                latest,
                (RawOfferRecord.source == latest.c.source)
                & (RawOfferRecord.source_item_id == latest.c.source_item_id)
                & (RawOfferRecord.scraped_at == latest.c.max_scraped_at),
            )
            .order_by(RawOfferRecord.source.asc(), RawOfferRecord.source_item_id.asc())
        ).all()
    )


def rebuild_normalized_views(db: Session) -> None:
    """Upsert food offers from latest raw snapshots; rebuild derived aggregates and scores."""
    sync_postgres_id_sequence(db, FoodOfferRecord.__tablename__)
    db.execute(delete(FairPriceScoreRecord))
    db.execute(delete(PriceAggregateRecord))
    db.flush()

    raw_records = _latest_raw_offer_rows(db)
    existing_by_key = {
        (row.source, row.source_item_id): row
        for row in db.scalars(select(FoodOfferRecord)).all()
    }

    normalized_rows: list[FoodOfferRecord] = []
    normalized_domain = []
    seen_keys: set[tuple[str, str]] = set()

    for raw_record in raw_records:
        key = (raw_record.source, raw_record.source_item_id)
        if key in seen_keys:
            continue
        seen_keys.add(key)

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
                image_url=raw_record.image_url,
            )
        )
        normalized_domain.append(normalized)

        existing = existing_by_key.get(key)
        if existing:
            existing.raw_offer_id = raw_record.id
            existing.source_group_id = normalized.source_group_id
            existing.category = normalized.category
            existing.brand = normalized.brand
            existing.canonical_name = normalized.canonical_name
            existing.display_name = normalized.display_name
            existing.unit = normalized.unit
            existing.unit_amount = normalized.unit_amount
            existing.pack_descriptor = normalized.pack_descriptor
            existing.price_lkr = normalized.price_lkr
            existing.price_per_unit_lkr = normalized.price_per_unit_lkr
            existing.currency = normalized.currency
            existing.available = normalized.available
            existing.sku = normalized.sku
            existing.url = normalized.url
            existing.image_url = normalized.image_url
            existing.cluster_key = normalized.cluster_key
            existing.last_seen_at = raw_record.scraped_at
            normalized_rows.append(existing)
        else:
            row = FoodOfferRecord(
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
                image_url=normalized.image_url,
                cluster_key=normalized.cluster_key,
                first_seen_at=raw_record.scraped_at,
                last_seen_at=raw_record.scraped_at,
            )
            db.add(row)
            normalized_rows.append(row)

    stale_keys = set(existing_by_key) - seen_keys
    for key in stale_keys:
        db.delete(existing_by_key[key])

    db.flush()

    aggregates = aggregate_offer_clusters(normalized_domain)
    sync_postgres_id_sequence(db, PriceAggregateRecord.__tablename__)
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
    sync_postgres_id_sequence(db, FairPriceScoreRecord.__tablename__)
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
