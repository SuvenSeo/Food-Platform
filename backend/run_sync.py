import argparse
import json

from app.core.sources import default_retail_sources_csv
from app.services.source_sync import sync_sources


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync retail food sources into the normalized database views.")
    parser.add_argument(
        "--sources",
        default=default_retail_sources_csv(),
        help=f"Comma-separated source names. Supported: {default_retail_sources_csv()}",
    )
    parser.add_argument(
        "--max-items",
        type=int,
        default=None,
        help="Optional cap per source for safer manual or CI runs.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    sources = [source.strip() for source in args.sources.split(",") if source.strip()]
    result = sync_sources(sources=sources, max_items=args.max_items)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
