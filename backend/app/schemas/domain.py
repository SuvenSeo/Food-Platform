from dataclasses import dataclass, field


@dataclass(slots=True)
class RawOffer:
    source: str
    source_item_id: str
    source_group_id: str
    category: str
    title: str
    variant_title: str | None
    price_lkr: float
    currency: str
    available: bool
    sku: str | None
    url: str
    image_url: str | None = None


@dataclass(slots=True)
class NormalizedOffer:
    source: str
    source_item_id: str
    source_group_id: str
    category: str
    brand: str | None
    canonical_name: str
    display_name: str
    unit: str | None
    unit_amount: float | None
    pack_descriptor: str | None
    price_lkr: float
    price_per_unit_lkr: float | None
    currency: str
    available: bool
    sku: str | None
    url: str
    cluster_key: str
    image_url: str | None = None


@dataclass(slots=True)
class ClusterAggregate:
    cluster_key: str
    canonical_name: str
    brand: str | None
    category: str
    unit: str | None
    unit_amount: float | None
    offers_count: int
    min_price_lkr: float
    max_price_lkr: float
    median_price_lkr: float
    average_price_lkr: float


@dataclass(slots=True)
class FairPriceScore:
    source_item_id: str
    cluster_key: str
    median_price_lkr: float
    delta_vs_median_pct: float
    price_band: str
