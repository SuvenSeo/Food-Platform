import json
from argparse import ArgumentParser, Namespace
from pathlib import Path

from app.core.config import get_settings
from app.services.market_quotes import ingest_market_quotes_from_file, ingest_market_quotes_from_url

settings = get_settings()


def parse_args() -> Namespace:
    parser = ArgumentParser(description="Sync market quotes from a remote source with optional seed fallback.")
    parser.add_argument(
        "--url",
        default="",
        help="Override MARKET_QUOTES_URL for this run.",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=None,
        help="Override MARKET_QUOTES_TIMEOUT_SECONDS for this run.",
    )
    parser.add_argument(
        "--format",
        default="",
        help="Override MARKET_QUOTES_FORMAT for this run (currently supports 'json').",
    )
    parser.add_argument(
        "--seed-path",
        default="",
        help="Override local seed file path fallback.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    seed_path = (
        Path(args.seed_path).resolve()
        if args.seed_path
        else Path(__file__).resolve().parent / "data" / "market_quotes_seed.json"
    )
    timeout_seconds = args.timeout_seconds or settings.market_quotes_timeout_seconds
    payload_format = args.format or settings.market_quotes_format
    source_url = (args.url or settings.market_quotes_url).strip()

    if source_url:
        try:
            result = ingest_market_quotes_from_url(
                source_url,
                timeout_seconds=timeout_seconds,
                payload_format=payload_format,
            )
            print(
                json.dumps(
                    {
                        "mode": "remote",
                        "source_url": source_url,
                        "timeout_seconds": timeout_seconds,
                        **result,
                    },
                    indent=2,
                )
            )
            return
        except Exception as exc:
            if not settings.market_quotes_seed_fallback_enabled:
                raise RuntimeError(
                    f"Remote market quote ingestion failed and seed fallback is disabled: {exc}"
                ) from exc

            fallback_result = ingest_market_quotes_from_file(seed_path)
            print(
                json.dumps(
                    {
                        "mode": "seed-fallback",
                        "seed_path": str(seed_path),
                        "warning": f"Remote market quote fetch failed: {exc}",
                        **fallback_result,
                    },
                    indent=2,
                )
            )
            return

    result = ingest_market_quotes_from_file(seed_path)
    print(
        json.dumps(
            {
                "mode": "seed",
                "seed_path": str(seed_path),
                **result,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
