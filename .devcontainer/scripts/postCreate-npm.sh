#!/usr/bin/env bash

# npm v9+ requires a token entry before it will send a publish request.
# Verdaccio accepts any token because @traefik-microstack/* has publish: $all.
npm config set "//${NPM_MIRROR}/:_authToken" dummy-token

echo "npm mirror token set for ${NPM_MIRROR}"
