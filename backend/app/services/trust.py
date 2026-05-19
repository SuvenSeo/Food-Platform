from datetime import datetime, timezone

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.models.tables import FoodOfferRecord, MarketQuoteRecord, PriceAggregateRecord, ScrapeRun


def _to_iso(value: datetime | None) -> str | None:
    if not value:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc).isoformat()
    return value.isoformat()


def _minutes_since(value: datetime | None) -> int | None:
    if not value:
        return None
    reference = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return int((datetime.now(timezone.utc) - reference).total_seconds() // 60)


def _grade(score: int) -> str:
    return "high" if score >= 80 else "medium" if score >= 60 else "low"


def _confidence_note(grade: str) -> str:
    if grade == "high":
        return "Fresh multi-source coverage"
    if grade == "medium":
        return "Use with caution while feeds stabilize"
    return "Freshness lag detected; verify critical decisions"


def _dataset_reliability(
    *,
    dataset: str,
    record_count: int,
    last_updated_at: datetime | None,
    total_sources: int | None = None,
    active_sources: int | None = None,
    stale_after_minutes: int = 180,
    warning_after_minutes: int = 60,
    missing_penalty: int = 30,
) -> dict[str, object]:
    lag_minutes = _minutes_since(last_updated_at)
    score = 100

    if record_count == 0:
        score -= missing_penalty
    if lag_minutes is None:
        score -= 35
    elif lag_minutes > stale_after_minutes:
        score -= 25
    elif lag_minutes > warning_after_minutes:
        score -= 10

    source_ratio = None
    if total_sources is not None and active_sources is not None:
        source_ratio = active_sources / total_sources if total_sources > 0 else None
        if source_ratio is not None:
            if source_ratio < 0.6:
                score -= 20
            elif source_ratio < 0.85:
                score -= 10

    score = max(0, min(score, 100))
    grade = _grade(score)

    freshness_status = "fresh"
    if lag_minutes is None:
        freshness_status = "missing"
    elif lag_minutes > stale_after_minutes:
        freshness_status = "stale"
    elif lag_minutes > warning_after_minutes:
        freshness_status = "aging"

    return {
        "dataset": dataset,
        "records_count": record_count,
        "last_updated_at": _to_iso(last_updated_at),
        "freshness_lag_minutes": lag_minutes,
        "freshness_status": freshness_status,
        "reliability": {
            "score": score,
            "grade": grade,
            "source_health_ratio": round(source_ratio, 2) if source_ratio is not None else None,
        },
    }


def _compute_source_pipeline_health(db: Session) -> dict[str, object]:
    """Per-source latest-run quality: healthy only when the last run stored items."""
    sources = db.scalars(select(distinct(ScrapeRun.source))).all()
    per_source: list[dict[str, object]] = []
    healthy_count = 0
    degraded_count = 0

    for source in sources:
        recent_runs = db.scalars(
            select(ScrapeRun)
            .where(ScrapeRun.source == source, ScrapeRun.finished_at.is_not(None))
            .order_by(ScrapeRun.finished_at.desc())
            .limit(3)
        ).all()
        latest = recent_runs[0] if recent_runs else None

        if not latest:
            health = "unknown"
        elif latest.status != "completed":
            health = "failed"
        elif latest.items_seen > 0 or latest.items_stored > 0:
            health = "healthy"
            healthy_count += 1
        elif len(recent_runs) >= 3 and all(run.items_seen == 0 for run in recent_runs):
            health = "degraded"
            degraded_count += 1
        else:
            health = "empty"

        per_source.append(
            {
                "source": source,
                "health": health,
                "latest_status": latest.status if latest else None,
                "latest_items_seen": latest.items_seen if latest else 0,
                "latest_finished_at": _to_iso(latest.finished_at) if latest else None,
            }
        )

    total_sources = len(sources)
    source_health_ratio = healthy_count / total_sources if total_sources > 0 else 0.0

    return {
        "healthy_sources": healthy_count,
        "degraded_sources": degraded_count,
        "total_sources": total_sources,
        "source_health_ratio": round(source_health_ratio, 2) if total_sources else None,
        "sources": per_source,
    }


def compute_platform_trust_snapshot(db: Session) -> dict[str, object]:
    offers_count = db.scalar(select(func.count(FoodOfferRecord.id))) or 0
    market_quotes_count = db.scalar(select(func.count(MarketQuoteRecord.id))) or 0
    sources_count = db.scalar(select(func.count(distinct(FoodOfferRecord.source)))) or 0
    categories_count = db.scalar(select(func.count(distinct(FoodOfferRecord.category)))) or 0

    latest_scrape_at = db.scalar(select(func.max(ScrapeRun.finished_at)))
    latest_offer_seen_at = db.scalar(select(func.max(FoodOfferRecord.last_seen_at)))
    latest_market_quote_at = db.scalar(select(func.max(MarketQuoteRecord.quoted_at)))
    latest_aggregate_at = db.scalar(select(func.max(PriceAggregateRecord.calculated_at)))
    latest_pipeline_status = db.scalar(select(ScrapeRun.status).order_by(ScrapeRun.finished_at.desc()).limit(1))

    pipeline_health = _compute_source_pipeline_health(db)
    healthy_pipeline_sources = int(pipeline_health["healthy_sources"])
    total_pipeline_sources = int(pipeline_health["total_sources"])
    source_health_ratio = pipeline_health["source_health_ratio"] or 0.0

    scrape_latency_minutes = _minutes_since(latest_scrape_at)
    confidence_score = 100
    if scrape_latency_minutes is None:
        confidence_score -= 35
    elif scrape_latency_minutes > 720:
        confidence_score -= 25
    elif scrape_latency_minutes > 180:
        confidence_score -= 15
    if source_health_ratio < 0.6:
        confidence_score -= 20
    elif source_health_ratio < 0.85:
        confidence_score -= 10
    if latest_pipeline_status not in {"completed", None}:
        confidence_score -= 10
    confidence_score = max(0, min(confidence_score, 100))
    confidence_grade = _grade(confidence_score)

    offers_dataset = _dataset_reliability(
        dataset="offers",
        record_count=offers_count,
        last_updated_at=latest_offer_seen_at,
        total_sources=total_pipeline_sources if total_pipeline_sources else None,
        active_sources=sources_count if total_pipeline_sources else None,
        stale_after_minutes=360,
        warning_after_minutes=120,
    )
    offers_dataset["dimensions"] = {
        "sources_count": sources_count,
        "categories_count": categories_count,
    }

    market_dataset = _dataset_reliability(
        dataset="market_quotes",
        record_count=market_quotes_count,
        last_updated_at=latest_market_quote_at,
        stale_after_minutes=300,
        warning_after_minutes=90,
    )
    market_dataset["dimensions"] = {
        "districts_count": db.scalar(select(func.count(distinct(MarketQuoteRecord.district)))) or 0,
        "sources_count": db.scalar(select(func.count(distinct(MarketQuoteRecord.source)))) or 0,
    }

    aggregates_count = db.scalar(select(func.count(PriceAggregateRecord.id))) or 0
    aggregates_dataset = _dataset_reliability(
        dataset="price_aggregates",
        record_count=aggregates_count,
        last_updated_at=latest_aggregate_at,
        stale_after_minutes=360,
        warning_after_minutes=120,
        missing_penalty=20,
    )
    aggregates_dataset["dimensions"] = {
        "categories_count": db.scalar(select(func.count(distinct(PriceAggregateRecord.category)))) or 0,
    }

    dataset_rows = [offers_dataset, market_dataset, aggregates_dataset]
    if any(row.get("freshness_status") in {"stale", "missing"} for row in dataset_rows):
        confidence_score -= 15
    min_dataset_score = min(
        (int(row.get("reliability", {}).get("score", 100)) for row in dataset_rows),
        default=100,
    )
    if min_dataset_score < 80:
        confidence_score -= 10
    confidence_score = max(0, min(confidence_score, 100))
    confidence_grade = _grade(confidence_score)

    return {
        "generated_at": _to_iso(datetime.now(timezone.utc)),
        "freshness": {
            "last_scrape_at": _to_iso(latest_scrape_at),
            "last_offer_seen_at": _to_iso(latest_offer_seen_at),
            "last_market_quote_at": _to_iso(latest_market_quote_at),
            "scrape_latency_minutes": scrape_latency_minutes,
        },
        "coverage": {
            "offers_count": offers_count,
            "market_quotes_count": market_quotes_count,
            "sources_count": sources_count,
            "categories_count": categories_count,
        },
        "pipeline": {
            "healthy_sources": healthy_pipeline_sources,
            "degraded_sources": int(pipeline_health["degraded_sources"]),
            "total_sources": total_pipeline_sources,
            "latest_status": latest_pipeline_status,
            "source_health_ratio": pipeline_health["source_health_ratio"],
            "sources": pipeline_health["sources"],
        },
        "confidence": {
            "score": confidence_score,
            "grade": confidence_grade,
            "note": _confidence_note(confidence_grade),
        },
        "datasets": {
            "offers": offers_dataset,
            "market_quotes": market_dataset,
            "price_aggregates": aggregates_dataset,
        },
    }


def build_reliability_summary(snapshot: dict[str, object]) -> dict[str, object]:
    datasets = snapshot.get("datasets", {})
    offers = datasets.get("offers", {})
    market_quotes = datasets.get("market_quotes", {})
    price_aggregates = datasets.get("price_aggregates", {})
    pipeline = snapshot.get("pipeline", {})
    confidence = snapshot.get("confidence", {})

    dataset_rows = [offers, market_quotes, price_aggregates]
    stale_datasets = [
        row.get("dataset")
        for row in dataset_rows
        if row and row.get("freshness_status") in {"stale", "missing"}
    ]
    min_dataset_score = min((row.get("reliability", {}).get("score", 100) for row in dataset_rows if row), default=100)

    status = "ok"
    if confidence.get("grade") == "low" or min_dataset_score < 60 or stale_datasets:
        status = "degraded"
    if min_dataset_score < 45 or len(stale_datasets) >= 2:
        status = "critical"

    return {
        "generated_at": snapshot.get("generated_at"),
        "status": status,
        "confidence": confidence,
        "pipeline": {
            "latest_status": pipeline.get("latest_status"),
            "healthy_sources": pipeline.get("healthy_sources"),
            "degraded_sources": pipeline.get("degraded_sources"),
            "total_sources": pipeline.get("total_sources"),
            "source_health_ratio": pipeline.get("source_health_ratio"),
        },
        "stale_datasets": stale_datasets,
        "datasets": [
            {
                "dataset": row.get("dataset"),
                "records_count": row.get("records_count"),
                "freshness_status": row.get("freshness_status"),
                "freshness_lag_minutes": row.get("freshness_lag_minutes"),
                "last_updated_at": row.get("last_updated_at"),
                "reliability": row.get("reliability"),
            }
            for row in dataset_rows
            if row
        ],
    }
