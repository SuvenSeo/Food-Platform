"""Test CBSL PDF download and parsing."""
import sys, io
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import httpx
from bs4 import BeautifulSoup

# 1. Get the actual full PDF URL from the page
r = httpx.get("https://www.cbsl.gov.lk/en/statistics/economic-indicators/price-report",
              timeout=20, follow_redirects=True)
soup = BeautifulSoup(r.text, "lxml")
links = soup.find_all("a", href=True)

# Find the first Daily Price Report link
report_url = None
report_date = None
for a in links:
    href = str(a["href"])
    text = a.get_text(strip=True)
    if "pricerpt" in href and href.endswith(".pdf"):
        report_url = href if href.startswith("http") else f"https://www.cbsl.gov.lk{href}"
        report_date = text
        break

print(f"Report URL: {report_url}")
print(f"Report date text: {report_date}")

if not report_url:
    print("No PDF link found!")
    sys.exit(1)

# 2. Download the PDF
pdf_r = httpx.get(report_url, timeout=30, follow_redirects=True)
print(f"PDF status: {pdf_r.status_code}, size: {len(pdf_r.content):,} bytes")

# 3. Parse with pdfplumber
import pdfplumber
with pdfplumber.open(io.BytesIO(pdf_r.content)) as pdf:
    print(f"Pages: {len(pdf.pages)}")
    for i, page in enumerate(pdf.pages[:2]):  # first 2 pages
        text = page.extract_text()
        if text:
            print(f"\n--- Page {i+1} text (first 500 chars) ---")
            print(text[:500])
        tables = page.extract_tables()
        print(f"Tables on page {i+1}: {len(tables)}")
        for t_idx, table in enumerate(tables[:2]):
            print(f"  Table {t_idx+1} ({len(table)} rows):")
            for row in table[:5]:
                print(f"    {row}")
