#!/usr/bin/env bash
# Wipe spring-partner DB + ES, bulk-load N generated partners, trigger ES re-index.
# Usage: load-partners.sh [COUNT]   (default: 1200300)
# Note: V5 Flyway migration seeds the same 1,200,300 records on first startup
# automatically.  Use this script to reload after wiping or to change the count.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COUNT="${1:-1200300}"

PG_CONTAINER="traefik-microstack-postgres-partner-search-1"
ES_CONTAINER="traefik-microstack-elasticsearch-partner-search-1"
POSTGRES_USER="postgres"
POSTGRES_DB="app-partner-db"

echo "==> Stopping spring-partner stack..."
docker compose stop app-spring-partner-search postgres-partner-search elasticsearch-partner-search 2>/dev/null || true

echo "==> Removing containers + anonymous volumes..."
docker compose rm -v -f postgres-partner-search elasticsearch-partner-search 2>/dev/null || true

echo "==> Starting fresh postgres + elasticsearch..."
docker compose up -d --wait postgres-partner-search elasticsearch-partner-search

echo "==> Starting app to run Flyway migrations..."
docker compose up -d --wait app-spring-partner-search

echo "==> Deleting Elasticsearch index..."
docker exec "${ES_CONTAINER}" curl -sf -X DELETE http://localhost:9200/partners 2>/dev/null || true

echo "==> Deleting generated partners (partner_number >= 1000000, preserving V2/V3/V4 seed data)..."
docker exec "${PG_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
    -c "DELETE FROM partner WHERE partner_number >= 1000000;"

echo "==> Loading ${COUNT} partners into postgres..."
python3 "${SCRIPT_DIR}/generate-partners.py" --count "${COUNT}" --format copy \
    | docker exec -i "${PG_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1

docker exec "${PG_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
    -c "SELECT COUNT(*) AS total_partners FROM partner;"

echo "==> Restarting app to trigger full ES re-index..."
docker compose up -d --force-recreate app-spring-partner-search
echo "==> Done. Watch indexing: make log SERVICE=app-spring-partner-search"
