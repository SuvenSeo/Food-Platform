import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import delete, func, select

from app.db.session import SessionLocal
from app.models.tables import MarketQuoteRecord


def ingest_market_quotes_from_file(path: Path) -> dict[str, int]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    with SessionLocal() as db:
        db.execute(delete(MarketQuoteRecord))
        db.add_all(
            [
                MarketQuoteRecord(
                    district=item["district"],
                    market_name=item["market_name"],
                    item_name=item["item_name"],
                    category=item["category"],
                    unit=item.get("unit", "kg"),
                    price_lkr=float(item["price_lkr"]),
                    source=item.get("source", "seed"),
                    quoted_at=datetime.fromisoformat(item["quoted_at"].replace("Z", "+00:00")),
                    notes=item.get("notes"),
                )
                for item in payload
            ]
        )
        db.commit()
        return {
            "market_quotes_count": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
        }
