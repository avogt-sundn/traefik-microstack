---
id: INFRAE2E-001
status: open
domain: infrastructure
area: e2e
---

## Goal

Group Playwright e2e specs into domain-tagged Playwright `projects` so that
`make pw-run DOMAIN=<name>` runs only the tests relevant to a changed domain
— always including `smoke.spec.ts` as a baseline — reducing CI iteration time
without breaking the full-suite run.

## Context

All specs currently live flat in `tests/playwright/e2e/` (7 files) and always
run together via `make pw-run` → `docker compose run --rm e2e-tests` →
`CMD ["npx", "playwright", "test", "--reporter=list"]`.

Playwright's `projects` array supports per-project `testMatch` globs and a
`dependencies` field that forces prerequisite projects to run first.
Using `dependencies: ['smoke']` on every domain project ensures the smoke
suite always runs regardless of which domain is selected, with no shell tricks.

Current domain → spec mapping:
- `smoke` (baseline): `smoke.spec.ts`
- `partner-search`: `partner-search.spec.ts`, `partner-search-ui.spec.ts`,
  `engine-toggle.spec.ts`, `partner-dev-badge.spec.ts`, `result-count.spec.ts`
- `partner-edit`: `partner-edit.spec.ts`

## Acceptance criteria

- [ ] `make pw-run` (no `DOMAIN`) runs all 7 spec files — identical to today
- [ ] `docker compose run --rm -e DOMAIN=partner-search e2e-tests` runs
      `smoke.spec.ts` + the 5 partner-search specs; `partner-edit.spec.ts` is skipped
- [ ] `docker compose run --rm -e DOMAIN=partner-edit e2e-tests` runs
      `smoke.spec.ts` + `partner-edit.spec.ts` only
- [ ] `make pw-run DOMAIN=partner-search` passes the env var and produces the
      same result as the docker compose invocation above
- [ ] `npx playwright test --project=partner-search` works for `make pw-local`
      and also runs smoke first (via `dependencies`)
- [ ] Playwright HTML report shows the project name column per test

## Files affected

**Modified:**
- `tests/playwright.config.ts` — add `projects` array:
  - `{ name: 'smoke', testMatch: '**/smoke.spec.ts' }`
  - `{ name: 'partner-search', dependencies: ['smoke'], testMatch: ['**/partner-search*.spec.ts', '**/engine-toggle.spec.ts', '**/partner-dev-badge.spec.ts', '**/result-count.spec.ts'] }`
  - `{ name: 'partner-edit', dependencies: ['smoke'], testMatch: '**/partner-edit.spec.ts' }`
  - Top-level `testMatch` / `testDir` remains as fallback for no-project runs
- `tests/Dockerfile` — change CMD from exec-form to shell-form so `DOMAIN` env
  var can be interpolated:
  `CMD ["sh", "-c", "npx playwright test --reporter=list ${DOMAIN:+--project=$DOMAIN}"]`
- `tests/docker-compose.yaml` — add `DOMAIN: ${DOMAIN:-}` under
  `e2e-tests.environment`
- `Makefile` — update `pw-run` target:
  `docker compose run --rm -e DOMAIN=$(DOMAIN) e2e-tests`

## Deferred

- Moving spec files into per-domain subdirectories (flat layout is sufficient;
  `testMatch` handles grouping without file moves)
- Extending `make pw-local` with `DOMAIN` filtering
- Adding a `greeting` or `platform` project (no specs exist yet for those domains)

## Dependencies

None
