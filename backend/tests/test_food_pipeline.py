from app.schemas.domain import ClusterAggregate, NormalizedOffer, RawOffer
from app.scrapers.glomark import parse_glomark_category
from app.scrapers.spar2u import parse_spar2u_catalog
from app.services.aggregator import aggregate_offer_clusters
from app.services.fair_price import score_offers_by_cluster
from app.services.normalization import normalize_offer


def test_parse_spar2u_catalog_emits_one_raw_offer_per_variant() -> None:
    payload = {
        "products": [
            {
                "id": 1,
                "title": "SPAR Local Coconut Oil, 1L",
                "handle": "spar-local-coconut-oil-1l",
                "product_type": "Grocery",
                "vendor": "SPAR2U Sri Lanka",
                "variants": [
                    {
                        "id": 101,
                        "title": "WT / 1000",
                        "sku": "COCO-1L",
                        "available": True,
                        "price": "1600.00",
                    },
                    {
                        "id": 102,
                        "title": "WT / 500",
                        "sku": "COCO-500",
                        "available": True,
                        "price": "825.00",
                    },
                ],
            }
        ]
    }

    offers = parse_spar2u_catalog(payload)

    assert offers == [
        RawOffer(
            source="spar2u",
            source_item_id="101",
            source_group_id="1",
            category="Grocery",
            title="SPAR Local Coconut Oil, 1L",
            variant_title="WT / 1000",
            price_lkr=1600.0,
            currency="LKR",
            available=True,
            sku="COCO-1L",
            url="https://spar2u.lk/products/spar-local-coconut-oil-1l",
        ),
        RawOffer(
            source="spar2u",
            source_item_id="102",
            source_group_id="1",
            category="Grocery",
            title="SPAR Local Coconut Oil, 1L",
            variant_title="WT / 500",
            price_lkr=825.0,
            currency="LKR",
            available=True,
            sku="COCO-500",
            url="https://spar2u.lk/products/spar-local-coconut-oil-1l",
        ),
    ]


def test_parse_glomark_category_extracts_titles_prices_and_links() -> None:
    html = """
    <section>
      <a href="/vichy-biscuit-butter-cookies-tin-240g/p/11305">
        Vichy Biscuit Butter Cookies Tin 240G
        <span>Per 1unit(s)</span>
        <span>Rs 875.00</span>
      </a>
      <a href="/double-decker-corntos-bbq-70g/p/8494">
        Double Decker Corntos Bbq 70G
        <span>Per 1unit(s)</span>
        <span>Rs 240.00</span>
      </a>
    </section>
    """

    offers = parse_glomark_category(html, category="Grocery")

    assert offers == [
        RawOffer(
            source="glomark",
            source_item_id="11305",
            source_group_id="11305",
            category="Grocery",
            title="Vichy Biscuit Butter Cookies Tin 240G",
            variant_title="Per 1unit(s)",
            price_lkr=875.0,
            currency="LKR",
            available=True,
            sku=None,
            url="https://glomark.lk/vichy-biscuit-butter-cookies-tin-240g/p/11305",
        ),
        RawOffer(
            source="glomark",
            source_item_id="8494",
            source_group_id="8494",
            category="Grocery",
            title="Double Decker Corntos Bbq 70G",
            variant_title="Per 1unit(s)",
            price_lkr=240.0,
            currency="LKR",
            available=True,
            sku=None,
            url="https://glomark.lk/double-decker-corntos-bbq-70g/p/8494",
        ),
    ]


def test_normalize_offer_extracts_brand_measurement_and_cluster_key() -> None:
    normalized = normalize_offer(
        RawOffer(
            source="spar2u",
            source_item_id="101",
            source_group_id="1",
            category="Grocery",
            title="SPAR Local Coconut Oil, 1L",
            variant_title="WT / 1000",
            price_lkr=1600.0,
            currency="LKR",
            available=True,
            sku="COCO-1L",
            url="https://spar2u.lk/products/spar-local-coconut-oil-1l",
        )
    )

    assert normalized == NormalizedOffer(
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
        cluster_key="spar|local coconut oil|l|1.000",
    )


def test_aggregate_offer_clusters_builds_summary_stats() -> None:
    offers = [
        NormalizedOffer(
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
            cluster_key="spar|local coconut oil|l|1.000",
        ),
        NormalizedOffer(
            source="glomark",
            source_item_id="203",
            source_group_id="203",
            category="grocery",
            brand="SPAR",
            canonical_name="local coconut oil",
            display_name="SPAR Local Coconut Oil",
            unit="l",
            unit_amount=1.0,
            pack_descriptor="Per 1unit(s)",
            price_lkr=1700.0,
            price_per_unit_lkr=1700.0,
            currency="LKR",
            available=True,
            sku=None,
            url="https://glomark.lk/local-coconut-oil/p/203",
            cluster_key="spar|local coconut oil|l|1.000",
        ),
    ]

    aggregates = aggregate_offer_clusters(offers)

    assert aggregates == [
        ClusterAggregate(
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
        )
    ]


def test_score_offers_by_cluster_flags_cheaper_offers_as_good_value() -> None:
    offers = [
        NormalizedOffer(
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
            cluster_key="spar|local coconut oil|l|1.000",
        ),
        NormalizedOffer(
            source="glomark",
            source_item_id="203",
            source_group_id="203",
            category="grocery",
            brand="SPAR",
            canonical_name="local coconut oil",
            display_name="SPAR Local Coconut Oil",
            unit="l",
            unit_amount=1.0,
            pack_descriptor="Per 1unit(s)",
            price_lkr=1700.0,
            price_per_unit_lkr=1700.0,
            currency="LKR",
            available=True,
            sku=None,
            url="https://glomark.lk/local-coconut-oil/p/203",
            cluster_key="spar|local coconut oil|l|1.000",
        ),
        NormalizedOffer(
            source="glomark",
            source_item_id="204",
            source_group_id="204",
            category="grocery",
            brand="SPAR",
            canonical_name="local coconut oil",
            display_name="SPAR Local Coconut Oil",
            unit="l",
            unit_amount=1.0,
            pack_descriptor="Per 1unit(s)",
            price_lkr=1800.0,
            price_per_unit_lkr=1800.0,
            currency="LKR",
            available=True,
            sku=None,
            url="https://glomark.lk/local-coconut-oil/p/204",
            cluster_key="spar|local coconut oil|l|1.000",
        ),
    ]

    scores = score_offers_by_cluster(offers)

    assert scores[("spar2u", "101")].price_band == "good-value"
    assert round(scores[("spar2u", "101")].delta_vs_median_pct, 2) == 5.88
    assert scores[("glomark", "203")].price_band == "fair"
    assert scores[("glomark", "204")].price_band == "premium"
