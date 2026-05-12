"""Debug CBSL and DCS link structures."""
import httpx, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from bs4 import BeautifulSoup

def debug_cbsl():
    print("=== CBSL links ===")
    r = httpx.get(
        "https://www.cbsl.gov.lk/en/statistics/economic-indicators/price-report",
        timeout=20, follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0"}
    )
    soup = BeautifulSoup(r.text, "lxml")
    links = soup.find_all("a", href=True)
    print(f"Total links: {len(links)}")
    for a in links:
        href = str(a["href"])
        text = a.get_text(strip=True)[:50]
        if any(kw in href.lower() for kw in ["pdf", "sites", "files", "daily", "download", "price"]):
            print(f"  {text!r:50s} | {href[:100]}")

def debug_dcs():
    print("\n=== DCS Resource links ===")
    r = httpx.get(
        "https://www.statistics.gov.lk/InflationAndPrices/StaticalInformation/RetailPrices",
        timeout=20, follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0"}
    )
    soup = BeautifulSoup(r.text, "lxml")
    links = soup.find_all("a", href=True)
    for a in links:
        href = str(a["href"])
        text = a.get_text(strip=True)[:50]
        if any(kw in href for kw in ["Resource", "resource", "Retail", "retail", "xlsx", "xls", "pdf", "download"]):
            print(f"  {text!r:50s} | {href[:100]}")
    
    # Also show first 20 non-nav links
    print("\nAll non-empty hrefs (first 20):")
    count = 0
    for a in links:
        href = str(a["href"])
        text = a.get_text(strip=True)[:50]
        if href and href not in ("#", "/") and not href.startswith("javascript"):
            if "statistics.gov.lk" in href or href.startswith("/"):
                print(f"  {text!r:50s} | {href[:100]}")
                count += 1
                if count >= 20:
                    break

debug_cbsl()
debug_dcs()
