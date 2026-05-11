#!/usr/bin/env bash
# Installs Playwright test tooling. The Chromium binary is baked into the image
# at /ms-playwright (PLAYWRIGHT_BROWSERS_PATH).

set -e

cd /workspaces/traefik-microstack/tests
npm install
