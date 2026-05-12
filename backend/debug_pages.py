"""Debug script to inspect DCS and CBSL page structures."""
import httpx
from bs4 import BeautifulSoup

def check_dcs():
    print("=== DCS page ===")
    r = httpx.get(
        "https://www.statistics.gov.lk/InflationAndPrices/StaticalInformation/RetailPrices",
        timeout=20, follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    print(f"Status: {r.status_code}")
    soup = BeautifulSoup(r.text, "lxml")
    links = soup.find_all("a", href=True)
    print(f"Total links: {len(links)}")
    for a in links[:40]:
        href = str(a["href"])
        text = a.get_text(strip=True)[:40]
        if href and href not in ("#", "/"):
            print(f"  {text!r:45s} -> {href[:90]}")

def check_cbsl():
    print("\n=== CBSL page ===")
    r = httpx.get(
        "https://www.cbsl.gov.lk/en/statistics/economic-indicators/price-report",
        timeout=20, follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    print(f"Status: {r.status_code}")
    soup = BeautifulSoup(r.text, "lxml")
    links = soup.find_all("a", href=True)
    print(f"Total links: {len(links)}")
    for a in links[:40]:
        href = str(a["href"])
        text = a.get_text(strip=True)[:40]
        if href and href not in ("#", "/"):
            print(f"  {text!r:45s} -> {href[:90]}")

def check_wfp_csv():
    print("\n=== WFP CSV sample ===")
    r = httpx.get(
        "https://data.humdata.org/api/3/action/package_show?id=wfp-food-prices-for-sri-lanka",
        timeout=25
    )
    data = r.json()
    resources = data.get("result", {}).get("resources", [])
    for res in resources:
        name = res.get("name", "")
        fmt = res.get("format", "")
        url = res.get("url") or res.get("download_url", "")
        print(f"  name={name!r} format={fmt!r} url={url[:100]}")

if __name__ == "__main__":
    check_dcs()
    check_cbsl()
    check_wfp_csv()
