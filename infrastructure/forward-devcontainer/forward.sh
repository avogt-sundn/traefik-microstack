#!/usr/bin/env sh
set -eu

if [ -z "${TARGET_HOST:-}" ]; then
  echo "TARGET_HOST must be set (container name on docker network)" >&2
  exit 1
fi

LISTEN_PORT="${LISTEN_PORT:-80}"
TARGET_PORT="${TARGET_PORT:-$LISTEN_PORT}"

echo "Forwarding 0.0.0.0:${LISTEN_PORT} -> ${TARGET_HOST}:${TARGET_PORT}"

exec socat TCP-LISTEN:${LISTEN_PORT},fork,reuseaddr TCP:${TARGET_HOST}:${TARGET_PORT}
