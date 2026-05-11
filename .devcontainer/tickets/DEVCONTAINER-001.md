---
id: DEVCONTAINER-001
status: done
domain: devcontainer
area: infrastructure
---

## Goal

Bake the Playwright Chromium browser binary into the DevContainer image so it is always present after a container start — eliminating the `npx playwright install` download that currently happens on every `postCreate`. The browser is installed once at image-build time and lives in a system-wide path readable by the `vscode` user.

## Context

`postCreate-Playwright.sh` currently runs `npx playwright install --with-deps chromium`, which downloads ~300 MB on every DevContainer rebuild. The OS-level shared libraries Playwright needs are already installed in `.devcontainer/Dockerfile` (the block labelled "Cypress Linux dependencies"). Only the browser binary itself is missing from the image.

The fix: add `ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` and a `RUN npx --yes playwright@1.58.2 install chromium && chmod -R 777 /ms-playwright` layer to the Dockerfile. The version matches `tests/package.json` (`^1.58.2`). `--with-deps` is omitted because OS deps are already in the image.

`postCreate-Playwright.sh` then only needs to install `@playwright/cli` tooling — the `install chromium` call is removed.

No named volume is introduced. The browser lives in the image layer. DEVC-4 (no bind mounts) is not relevant here — no mounts are added.

## Acceptance criteria

- [x] `.devcontainer/Dockerfile` contains `ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` before the Playwright `RUN` layer.
- [x] `.devcontainer/Dockerfile` contains `RUN npx --yes playwright@1.58.2 install chromium && chmod -R 777 /ms-playwright`.
- [x] `.devcontainer/scripts/postCreate-Playwright.sh` does **not** contain `npx playwright install`.
- [x] `.devcontainer/scripts/postCreate-Playwright.sh` still installs `@playwright/cli` and runs `playwright-cli install --skills`.
- [ ] Inside a rebuilt DevContainer, `ls /ms-playwright/chromium*/` lists a Chromium binary directory (i.e. browser is present without running any install command).
- [ ] Inside a rebuilt DevContainer, `npx playwright test` in `tests/` resolves the browser from `/ms-playwright` without downloading anything.

## Files affected

**Modified:**
- `.devcontainer/Dockerfile` — add `ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` and `RUN npx --yes playwright@1.58.2 install chromium && chmod -R 777 /ms-playwright` after the existing OS-deps block
- `.devcontainer/scripts/postCreate-Playwright.sh` — remove `npx playwright install --with-deps chromium` line; keep `npm install -g @playwright/cli@latest` and `playwright-cli install --skills`

## Deferred

- Updating the misleading `# Cypress Linux dependencies` comment in the Dockerfile — cosmetic, out of scope.
- Automating Playwright version sync between `tests/package.json` and the Dockerfile `RUN` — out of scope; update manually when upgrading.
- Installing Firefox or WebKit — project uses Chromium only.

## Dependencies

- None
