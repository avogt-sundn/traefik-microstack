#!/usr/bin/env bash
# Maps a Compose service name to its source domain directory.
# Usage: service-domain.sh <service-name>
# Prints the domain path and exits 0, or prints "unknown" and exits 1.
set -euo pipefail

service="${1:?service name required}"

case "$service" in
  app-spring-partner-search|app-quarkus-partner-search|partner-search|elasticsearch-partner-search)
    echo "partner-search" ;;
  app-spring-partner-edit|partner-edit)
    echo "partner-edit" ;;
  shell)
    echo "platform" ;;
  app-one|app-two|app-three|app-three-native)
    echo "greeting" ;;
  forward)
    echo "infrastructure/forward-devcontainer" ;;
  *)
    echo "unknown"; exit 1 ;;
esac
