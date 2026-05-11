#!/bin/sh
set -e

# if [  -f /app/configuration.cdn ]; then
#   echo "Injecting initial configuration.cdn  into volume..."
#   mkdir -p /app/data
#   touch /app/data/configuration
#   cat /app/configuration.cdn  >> /app/data/configuration.cdn
#   rm /configuration.cdn
# fi

# cat /app/data/configuration.cdn

exec /app/entrypoint.sh "$@"