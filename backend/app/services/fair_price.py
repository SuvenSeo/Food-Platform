from statistics import median

from app.schemas.domain import FairPriceScore, NormalizedOffer


def _band_for_delta(delta_pct: float) -> str:
    if delta_pct >= 5:
        return "good-value"
    if delta_pct <= -5:
        return "premium"
    return "fair"


def score_offers_by_cluster(offers: list[NormalizedOffer]) -> dict[tuple[str, str], FairPriceScore]:
    grouped: dict[str, list[NormalizedOffer]] = {}
    for offer in offers:
        grouped.setdefault(offer.cluster_key, []).append(offer)

    scores: dict[tuple[str, str], FairPriceScore] = {}
    for cluster_key, cluster_offers in grouped.items():
        median_price = float(median([offer.price_lkr for offer in cluster_offers]))
        for offer in cluster_offers:
            delta_pct = ((median_price - offer.price_lkr) / median_price) * 100 if median_price else 0.0
            scores[(offer.source, offer.source_item_id)] = FairPriceScore(
                source_item_id=offer.source_item_id,
                cluster_key=cluster_key,
                median_price_lkr=median_price,
                delta_vs_median_pct=delta_pct,
                price_band=_band_for_delta(delta_pct),
            )
    return scores
