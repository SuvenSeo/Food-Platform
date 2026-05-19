"""
Live connectivity tests for all scrapers.
Run: python test_scrapers_live.py
"""
import sys, logging
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
logging.basicConfig(level=logging.WARNING)  # quiet pdfplumber

import httpx

UA = "FoodLensBot/1.0-test"

def test_spar2u():
    print("=== Spar2u ===")
    try:
        from app.scrapers.spar2u import fetch_spar2u_catalog
        offers = fetch_spar2u_catalog(max_items=5, user_agent=UA)
        print(f"  OK — {len(offers)} offers fetched")
        if offers:
            o = offers[0]
            print(f"  Sample: {o.title[:60]} | Rs {o.price_lkr} | img={bool(o.image_url)}")
            if o.image_url:
                print(f"  Image: {o.image_url[:80]}")
        return len(offers) > 0
    except Exception as exc:
        print(f"  FAILED: {exc}")
        return False

def test_glomark():
    print("=== Glomark ===")
    try:
        from app.scrapers.glomark import fetch_glomark_catalog
        offers = fetch_glomark_catalog(max_items=10, user_agent=UA)
        print(f"  OK — {len(offers)} offers fetched")
        if offers:
            o = offers[0]
            print(f"  Sample: {o.title[:60]} | Rs {o.price_lkr} | img={bool(o.image_url)}")
        return len(offers) > 0
    except Exception as exc:
        print(f"  FAILED: {exc}")
        return False

def test_wfp():
    print("=== WFP (official market data) ===")
    try:
        from app.scrapers.wfp import fetch_wfp_market_quotes
        quotes = fetch_wfp_market_quotes(max_rows=20, months_back=12)
        print(f"  OK — {len(quotes)} market quotes (last 12 months)")
        if quotes:
            q = quotes[-1]
            print(f"  Sample: {q['item_name']} | {q['district']} | Rs {q['price_lkr']}/{q['unit']} | {q['quoted_at'][:10]}")
        return len(quotes) > 0
    except Exception as exc:
        print(f"  FAILED: {exc}")
        return False

def test_cbsl():
    print("=== CBSL Daily Price Report ===")
    try:
        from app.scrapers.cbsl import fetch_cbsl_market_quotes
        quotes = fetch_cbsl_market_quotes(timeout=30.0)
        print(f"  OK — {len(quotes)} market quotes parsed from PDF")
        for q in quotes[:3]:
            print(f"  {q['item_name'][:30]:30s} | Rs {q['price_lkr']}/{q['unit']} | {q['market_name']}")
        return len(quotes) > 0
    except Exception as exc:
        print(f"  FAILED: {exc}")
        return False

def test_dcs():
    print("=== DCS Weekly Retail Prices ===")
    try:
        from app.scrapers.dcs import fetch_dcs_market_quotes
        quotes = fetch_dcs_market_quotes(timeout=25.0)
        print(f"  OK — {len(quotes)} market quotes")
        for q in quotes[:3]:
            print(f"  {q['item_name'][:30]:30s} | Rs {q['price_lkr']}/{q['unit']}")
        if not quotes:
            print("  (0 quotes — DCS may use JS rendering for download links)")
        return len(quotes) > 0
    except Exception as exc:
        print(f"  FAILED: {exc}")
        return False

def test_doa():
    print("=== DOA SHEP Vegetable Prices ===")
    try:
        from app.scrapers.doa import fetch_doa_market_quotes
        quotes = fetch_doa_market_quotes(timeout=25.0)
        print(f"  OK — {len(quotes)} market quotes")
        for q in quotes[-3:]:
            print(f"  {q['item_name'][:30]:30s} | {q['market_name'][:25]:25s} | Rs {q['price_lkr']}/{q['unit']} | {q['quoted_at'][:10]}")
        if not quotes:
            print("  (0 quotes — DOA endpoint may have changed)")
        return len(quotes) > 0
    except Exception as exc:
        print(f"  FAILED: {exc}")
        return False

def test_keells():
    print("=== Keells (guest API scrape) ===")
    try:
        from app.scrapers.keells import fetch_keells_catalog
        offers = fetch_keells_catalog(max_items=10, user_agent=UA)
        print(f"  {len(offers)} offers (0 = site structure changed or auth required)")
        if offers:
            o = offers[0]
            print(f"  Sample: {o.title[:60]} | Rs {o.price_lkr}")
        return len(offers) > 0
    except Exception as exc:
        print(f"  FAILED: {exc}")
        return False

def test_cargills():
    print("=== Cargills (JSON/browser scrape) ===")
    try:
        from app.scrapers.cargills import fetch_cargills_catalog
        offers = fetch_cargills_catalog(max_items=10, user_agent=UA)
        print(f"  {len(offers)} offers (0 = site structure changed or auth required)")
        if offers:
            o = offers[0]
            print(f"  Sample: {o.title[:60]} | Rs {o.price_lkr}")
        return len(offers) > 0
    except Exception as exc:
        print(f"  FAILED: {exc}")
        return False

if __name__ == "__main__":
    results = []
    results.append(test_spar2u())
    print()
    results.append(test_glomark())
    print()
    results.append(test_wfp())
    print()
    results.append(test_cbsl())
    print()
    results.append(test_dcs())
    print()
    results.append(test_doa())
    print()
    results.append(test_keells())
    print()
    results.append(test_cargills())
    if not all(results):
        raise SystemExit(1)
