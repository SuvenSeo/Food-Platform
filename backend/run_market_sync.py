import json
from pathlib import Path

from app.services.market_quotes import ingest_market_quotes_from_file


def main() -> None:
    seed_path = Path(__file__).resolve().parent / "data" / "market_quotes_seed.json"
    result = ingest_market_quotes_from_file(seed_path)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
