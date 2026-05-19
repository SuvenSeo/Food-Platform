"""Resolve DATABASE_URL for GitHub-hosted scraper runners.

Supabase direct database hosts can resolve to IPv6-only addresses. GitHub-hosted
Linux runners do not reliably have IPv6 egress, so CI scraper jobs should use
the Supabase transaction pooler instead.
"""

from __future__ import annotations

import os
import sys
from urllib.parse import urlsplit, urlunsplit


POOLER_HOST_BY_PROJECT_REF = {
    "sostboclgybttmeafvkb": "aws-1-ap-southeast-1.pooler.supabase.com",
}


def _normalized_scheme(scheme: str) -> str:
    if scheme in {"postgres", "postgresql"}:
        return "postgresql+psycopg"
    return scheme


def _split_userinfo(netloc: str) -> tuple[str, str]:
    if "@" not in netloc:
        return "", netloc
    return netloc.rsplit("@", 1)


def resolve_database_url(database_url: str, pooler_host_override: str = "") -> str:
    parsed = urlsplit(database_url.strip())
    if not parsed.scheme or not parsed.netloc:
        raise ValueError("DATABASE_URL must be a full Postgres URL.")

    scheme = _normalized_scheme(parsed.scheme)
    host = parsed.hostname or ""
    userinfo, _hostport = _split_userinfo(parsed.netloc)
    netloc = parsed.netloc

    if host.startswith("db.") and host.endswith(".supabase.co"):
        project_ref = host.split(".", 2)[1]
        pooler_host = pooler_host_override or POOLER_HOST_BY_PROJECT_REF.get(project_ref)
        if not pooler_host:
            raise ValueError(
                "Direct Supabase DATABASE_URL detected, but no pooler host is configured "
                f"for project '{project_ref}'. Set SUPABASE_POOLER_HOST in the workflow."
            )

        username, separator, password = userinfo.partition(":")
        if username in {"", "postgres"}:
            username = f"postgres.{project_ref}"
        userinfo = username + (separator + password if separator else "")
        netloc = f"{userinfo}@{pooler_host}:6543"

    return urlunsplit((scheme, netloc, parsed.path or "/postgres", parsed.query, parsed.fragment))


def main() -> int:
    database_url = os.environ.get("DATABASE_URL", "")
    if not database_url.strip():
        print("DATABASE_URL is not set.", file=sys.stderr)
        return 1

    try:
        resolved_url = resolve_database_url(
            database_url,
            pooler_host_override=os.environ.get("SUPABASE_POOLER_HOST", ""),
        )
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(f"DATABASE_URL={resolved_url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
