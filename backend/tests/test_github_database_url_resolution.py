from scripts.resolve_github_database_url import resolve_database_url


def test_direct_supabase_database_url_is_rewritten_to_ipv4_pooler() -> None:
    resolved = resolve_database_url(
        "postgresql://postgres:p%40ss@db.sostboclgybttmeafvkb.supabase.co:5432/postgres"
    )

    assert resolved == (
        "postgresql+psycopg://postgres.sostboclgybttmeafvkb:p%40ss"
        "@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
    )


def test_pooler_database_url_keeps_host_and_normalizes_scheme() -> None:
    resolved = resolve_database_url(
        "postgresql://postgres.sostboclgybttmeafvkb:p%40ss"
        "@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
    )

    assert resolved == (
        "postgresql+psycopg://postgres.sostboclgybttmeafvkb:p%40ss"
        "@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
    )
