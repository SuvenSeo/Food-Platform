"""
Runner for official government / IGO market price sources.

Usage:
  python run_official_market_sync.py --sources wfp dcs cbsl doa harti fisheries
  python run_official_market_sync.py --sources wfp
  python run_official_market_sync.py               # runs all official sources
"""

import json
import logging
from argparse import ArgumentParser

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


def parse_args():
    parser = ArgumentParser(
        description="Sync market quotes from official Sri Lankan data sources."
    )
    parser.add_argument(
        "--sources",
        nargs="*",
        default=["all"],
        help="Sources to run: wfp, dcs, cbsl, doa, harti, fisheries, or 'all' (default).",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=45.0,
        help="HTTP timeout in seconds for each source request.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    sources = args.sources or ["all"]

    from app.services.market_quotes import ingest_official_market_quotes

    logger.info("Running official market sync for sources: %s", sources)
    result = ingest_official_market_quotes(sources=sources, timeout=args.timeout)

    print(json.dumps(result, indent=2, default=str))

    # Non-zero exit if all sources errored
    all_sources_results = result.get("results", {})
    if all_sources_results and all(
        v.get("status") == "error" for v in all_sources_results.values()
    ):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
