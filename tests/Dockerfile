# Containerised Playwright e2e test runner (headless CI).
#
# Uses the official Playwright image which ships Chromium, Firefox,
# WebKit, and all Linux dependencies pre-installed.
#
# CI usage:
#   docker compose run --rm e2e-tests
FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /tests

# Install dependencies (@playwright/test)
COPY package.json package-lock.json ./
RUN npm ci

# Copy Playwright config and test files
COPY tsconfig.json playwright.config.ts ./
COPY playwright/ playwright/

# Copy legacy curl smoke script (still useful for fast API-only checks)
COPY partner-search.sh ./

# Self-signed TLS certs on the gateway — handled by ignoreHTTPSErrors in config
ENV BASE_URL=https://gateway

# PW_PROJECT controls which project runs: api (default), browser, or all.
ENV PW_PROJECT=api

CMD ["sh", "-c", "if [ \"$PW_PROJECT\" = 'all' ]; then npx playwright test; else npx playwright test --project=$PW_PROJECT; fi"]
