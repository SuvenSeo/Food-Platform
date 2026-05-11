from statistics import mean, median

from app.schemas.domain import ClusterAggregate, NormalizedOffer


def aggregate_offer_clusters(offers: list[NormalizedOffer]) -> list[ClusterAggregate]:
    clusters: dict[str, list[NormalizedOffer]] = {}
    for offer in offers:
        clusters.setdefault(offer.cluster_key, []).append(offer)

    aggregates: list[ClusterAggregate] = []
    for cluster_key, items in clusters.items():
        prices = [item.price_lkr for item in items]
        first = items[0]
        aggregates.append(
            ClusterAggregate(
                cluster_key=cluster_key,
                canonical_name=first.canonical_name,
                brand=first.brand,
                category=first.category,
                unit=first.unit,
                unit_amount=first.unit_amount,
                offers_count=len(items),
                min_price_lkr=min(prices),
                max_price_lkr=max(prices),
                median_price_lkr=float(median(prices)),
                average_price_lkr=float(mean(prices)),
            )
        )

    return sorted(aggregates, key=lambda item: item.cluster_key)
