#!/usr/bin/env bash
# Quick API smoke checks for FoodLK (local or staging).
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"

check() {
  local path="$1"
  echo "GET ${BASE_URL}${path}"
  curl -fsS "${BASE_URL}${path}" | head -c 200
  echo ""
}

check "/health"
check "/api/v1/health"
check "/api/v1/stats/summary"
check "/api/v1/platform/freshness"
check "/api/v1/trends/summary"
check "/api/v1/trends/market?item=Tomato"
check "/api/v1/changes?limit=5"
check "/api/v1/embed/summary?kind=basket&preset=essentials"

echo "smoke-api: ok"
