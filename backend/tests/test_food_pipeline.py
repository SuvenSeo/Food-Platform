from app.schemas.domain import ClusterAggregate, NormalizedOffer, RawOffer
from app.scrapers.cargills import parse_cargills_dynamic_sections
from app.scrapers.glomark import parse_glomark_category
from app.scrapers.keells import parse_keells_initial_data, parse_keells_page
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


def test_parse_cargills_dynamic_sections_extracts_product_modules() -> None:
    payload = [
        {
            "SectionName": "Best Of Fruit & Veg",
            "DataType": "Product",
            "Data": [
                {
                    "Id": 1225,
                    "SKUCODE": "VGE0197",
                    "ItemName": "Good Harvest Spine Gourd",
                    "Price": 144.0,
                    "Mrp": 150.0,
                    "UnitSize": 300.0,
                    "UOM": "g",
                    "WebImage": "/VendorItems/MenuItems/VGE0197_2.jpg",
                    "CategoryCode": "VGE",
                    "IsSaleable": "1",
                }
            ],
        }
    ]

    offers = parse_cargills_dynamic_sections(payload)

    assert offers == [
        RawOffer(
            source="cargills",
            source_item_id="1225",
            source_group_id="1225",
            category="Vegetables",
            title="Good Harvest Spine Gourd",
            variant_title="Per 300g",
            price_lkr=144.0,
            currency="LKR",
            available=True,
            sku="VGE0197",
            url="https://cargillsonline.com/Product?productID=1225",
            image_url="https://cargillsonline.com/VendorItems/MenuItems/VGE0197_2.jpg",
        )
    ]


def test_parse_keells_initial_data_extracts_api_product_lists() -> None:
    payload = {
        "result": {
            "departmentList": [
                {"departmentCode": "V", "departmentName": "Vegetables"},
            ],
            "categoryList": [
                {"categoryCode": "VWB66", "categoryName": "Onions"},
            ],
            "bestSellersList": [
                {
                    "itemID": 40549,
                    "itemCode": "914006",
                    "name": "Big Onions",
                    "amount": 270.0,
                    "imageUrl": "https://essstr.blob.core.windows.net/essimg/350x/Small/Pic914006.jpg",
                    "uom": "KG",
                    "isAvailable": True,
                    "isSellingToday": True,
                    "departmentCode": "V",
                    "categoryCode": "VWB66",
                }
            ],
        }
    }

    offers = parse_keells_initial_data(payload)

    assert offers == [
        RawOffer(
            source="keells",
            source_item_id="40549",
            source_group_id="40549",
            category="Onions",
            title="Big Onions",
            variant_title="Per 1kg",
            price_lkr=270.0,
            currency="LKR",
            available=True,
            sku="914006",
            url="https://keellssuper.com/productDetail?itemId=40549",
            image_url="https://essstr.blob.core.windows.net/essimg/350x/Small/Pic914006.jpg",
        )
    ]


def test_parse_keells_page_fallback_extracts_rendered_product_cards() -> None:
    html = """
    <article class="product-card">
      <a href="/product/samba-rice">
        <h3 class="product-title">Samba Rice 1Kg</h3>
        <span class="price">Rs. 420.00</span>
        <img src="/images/samba.jpg" />
      </a>
    </article>
    """

    offers = parse_keells_page(html, category="Rice & Grains")

    assert offers == [
        RawOffer(
            source="keells",
            source_item_id="samba-rice",
            source_group_id="samba-rice",
            category="Rice & Grains",
            title="Samba Rice 1Kg",
            variant_title=None,
            price_lkr=420.0,
            currency="LKR",
            available=True,
            sku=None,
            url="https://keellssuper.com/product/samba-rice",
            image_url="https://keellssuper.com/images/samba.jpg",
        )
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


def test_normalize_offer_uses_variant_measurement_before_title_measurement() -> None:
    normalized = normalize_offer(
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
        )
    )

    assert normalized.unit == "l"
    assert normalized.unit_amount == 0.5
    assert normalized.price_per_unit_lkr == 1650.0
    assert normalized.cluster_key == "spar|local coconut oil|l|0.500"


def test_normalize_offer_handles_fresh_produce_per_100g() -> None:
    normalized = normalize_offer(
        RawOffer(
            source="glomark",
            source_item_id="9001",
            source_group_id="9001",
            category="Vegetables",
            title="Chinese Cabbage Per 100g(s)",
            variant_title=None,
            price_lkr=72.0,
            currency="LKR",
            available=True,
            sku=None,
            url="https://glomark.lk/chinese-cabbage/p/9001",
        )
    )

    assert normalized.brand is None
    assert normalized.canonical_name == "chinese cabbage"
    assert normalized.display_name == "Chinese Cabbage"
    assert normalized.unit == "kg"
    assert normalized.unit_amount == 0.1
    assert normalized.price_per_unit_lkr == 720.0
    assert normalized.cluster_key == "generic|chinese cabbage|kg|0.100"


def test_normalize_offer_infers_small_yoghurt_pack_from_weight_slash() -> None:
    normalized = normalize_offer(
        RawOffer(
            source="cargills",
            source_item_id="yoghurt-80",
            source_group_id="yoghurt",
            category="Dairy",
            title="Newdale Set Plain Yoghurt",
            variant_title="WT / 80",
            price_lkr=72.0,
            currency="LKR",
            available=True,
            sku=None,
            url="https://example.com/yoghurt",
        )
    )

    assert normalized.unit == "kg"
    assert normalized.unit_amount == 0.08
    assert normalized.price_per_unit_lkr == 900.0
    assert normalized.cluster_key == "newdale|set plain yoghurt|kg|0.080"


def test_normalize_offer_does_not_guess_weight_for_unknown_slash_variant() -> None:
    normalized = normalize_offer(
        RawOffer(
            source="spar2u",
            source_item_id="unknown-80",
            source_group_id="unknown",
            category="Grocery",
            title="Sample Pantry Item",
            variant_title="WT / 80",
            price_lkr=72.0,
            currency="LKR",
            available=True,
            sku=None,
            url="https://example.com/sample",
        )
    )

    assert normalized.unit is None
    assert normalized.unit_amount is None
    assert normalized.price_per_unit_lkr == 72.0
    assert normalized.cluster_key == "sample|pantry item|unit|0.000"


def test_normalize_offer_handles_glomark_unit_variant_without_polluting_name() -> None:
    normalized = normalize_offer(
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
        )
    )

    assert normalized.brand == "Vichy"
    assert normalized.canonical_name == "biscuit butter cookies tin"
    assert normalized.unit == "unit"
    assert normalized.unit_amount == 1.0
    assert normalized.price_per_unit_lkr == 875.0


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
