#!/usr/bin/env bash
# Builds a Compose service only when its source domain's git tree-hash changed.
# Usage: build-if-changed.sh <service> [--force]
#   --force  skip hash check and always build
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_STATE_DIR=".build-state"

service="${1:?service name required}"
force="${2:-}"

domain="$("$SCRIPT_DIR/service-domain.sh" "$service")"
cur="$(git rev-parse "HEAD:$domain" 2>/dev/null || true)"
prev="$(cat "$BUILD_STATE_DIR/$service" 2>/dev/null || true)"

# Treat any uncommitted changes in the domain folder as a forced rebuild
dirty="$(git status --porcelain "$domain" 2>/dev/null)"
[ -n "$dirty" ] && force="--dirty"

if [ -z "$force" ] && [ -n "$cur" ] && [ "$cur" = "$prev" ]; then
  # Hash matches — only skip if the image actually exists in Docker.
  # If the image was pruned the hash guard would silently skip the build,
  # leaving docker compose up with no image to start the container.
  image_name="$(docker compose config 2>/dev/null | awk "/^  ${service}:/{found=1} found && /^    image:/{print \$2; exit}")"
  if [ -n "$image_name" ] && docker image inspect "$image_name" > /dev/null 2>&1; then
    echo "[skip]  $service — $domain unchanged ($cur)"
    exit 0
  fi
  echo "[rebuild] $service — image missing, rebuilding ($cur)"
fi

echo "[build] $service — $domain"
docker compose build "$service"
mkdir -p "$BUILD_STATE_DIR"
echo "$cur" > "$BUILD_STATE_DIR/$service"
