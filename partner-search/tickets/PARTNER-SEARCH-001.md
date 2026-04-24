---
id: PARTNER-SEARCH-001
status: done
domain: partner-search
area: infrastructure
---

## Goal

Rename the existing `partner/` domain folder to `partner-search/` and update every reference — folder paths, Compose service names, Traefik router/middleware names, Angular app/federation names, shell manifest, e2e scripts, and ticket IDs — so that the codebase consistently uses the `partner-search` token everywhere the old `partner` token appeared in a domain-ownership role.

## Context

The current `partner/` folder mixes search and (future) edit concerns. To enforce strict vertical domain boundaries, `partner/` becomes `partner-search/` and `partner-edit/` is introduced as a sibling. This ticket does the rename; no behaviour changes. All existing tests must still pass after the rename.

Existing references that must change:

| Location | Old value | New value |
|---|---|---|
| Root folder | `partner/` | `partner-search/` |
| `docker-compose.yaml` include | `partner/docker-compose.yaml` | `partner-search/docker-compose.yaml` |
| Compose service names | `partner`, `postgres-partner`, `elasticsearch-partner`, `app-spring-partner`, `app-quarkus-partner`, `forward-ng-partner`, `forward-api-spring-partner`, `forward-api-quarkus-partner` | suffix `-partner` → `-partner-search` everywhere; Postgres: `postgres-partner-search`; ES: `elasticsearch-partner-search`; frontend: `partner-search`; forward containers likewise |
| Compose volume name | `es-partner-data` | `es-partner-search-data` |
| Traefik router names | `partner`, `app-spring-partner`, `app-quarkus-partner`, `forward-ng-partner`, `forward-api-spring-partner`, `forward-api-quarkus-partner` | `partner-search`, `app-spring-partner-search`, `app-quarkus-partner-search`, `forward-ng-partner-search`, `forward-api-spring-partner-search`, `forward-api-quarkus-partner-search` |
| Traefik path rules | `PathPrefix('/api/partner/spring')`, `PathPrefix('/api/partner/quarkus')`, `PathPrefix('/partner')` | unchanged — public API URLs do not change |
| Traefik middleware names | `partner-strip`, `forward-ng-partner-strip` | `partner-search-strip`, `forward-ng-partner-search-strip` |
| Angular app name in `angular.json` | `partner` | `partner-search` |
| Federation name in `federation.config.js` | `partner` | `partner-search` |
| Shell manifest | `"partner": "/partner/remoteEntry.json"` | `"partner-search": "/partner/remoteEntry.json"` — **public URL path stays `/partner/`** |
| Shell route in `main.routes.ts` | `loadRemoteModule('partner', …)` | `loadRemoteModule('partner-search', …)` |
| Shell nav label key in `header.ts` | `'app.modules.partner'` | `'app.modules.partner-search'` |
| History helper in `history.ts` | `module === 'partner'` | `module === 'partner-search'` |
| `DOMAIN.md` | `partner/DOMAIN.md` | `partner-search/DOMAIN.md` |
| Ticket folder | `partner/tickets/` | `partner-search/tickets/` |
| e2e Dockerfile COPY | `partner-search.sh` | unchanged (file name already matches) |
| e2e `docker-compose.yaml` depends_on | `partner:` | `partner-search:` |
| `tests/partner-search.sh` | service health wait — update service label if referenced | update to `partner-search` service name if used |
| Spring `application.properties` | `DB_HOST:postgres-partner` | `DB_HOST:postgres-partner-search` |
| Quarkus `application.properties` | `DB_HOST:postgres-partner` | `DB_HOST:postgres-partner-search` |
| Quarkus Flyway property | `quarkus.flyway.migrate-at-start=true` | unchanged — Quarkus uses this key, not `spring.flyway.enabled` |
| Spring ES URI | `elasticsearch-partner:9200` | `elasticsearch-partner-search:9200` |
| Quarkus ES hosts | `elasticsearch-partner:9200` | `elasticsearch-partner-search:9200` |
| Frontend `Dockerfile` | all occurrences of `partner/frontend` (source paths), `projects/partner` (workspace paths), `dist/partner` (output path), and `aj.projects.partner` (JSON key in node script) | `partner-search/frontend`, `projects/partner-search`, `dist/partner-search`, `aj.projects['partner-search']` |
| Playwright selectors/spec | references to `partner` remote name and path `/partner` | federation key → `partner-search`; URL path `/partner` unchanged |

## Acceptance criteria

- [x] `partner/` folder no longer exists; `partner-search/` exists with identical contents (renamed)
- [x] `docker-compose.yaml` root include references `partner-search/docker-compose.yaml`
- [x] `make up` starts all services without error; no duplicate or orphaned containers
- [x] `GET /api/partner/spring/search/postgres?q=München` returns HTTP 200 (public API path unchanged)
- [x] `GET /api/partner/spring/search/elasticsearch?q=München` returns HTTP 200
- [x] `GET /partner/remoteEntry.json` returns HTTP 200 (frontend public path unchanged)
- [x] Shell loads the partner-search remote at `/abc/partner/search` without console errors
- [x] All e2e tests in `tests/partner-search.sh` pass
- [x] All Playwright specs in `tests/playwright/e2e/partner-search-ui.spec.ts` pass
- [x] No remaining reference to the old service names (`postgres-partner`, `elasticsearch-partner`, `app-spring-partner`, `app-quarkus-partner`) in Compose files or `application.properties`
- [x] `partner-search/DOMAIN.md` updated: title and service table reflect new names

## Files affected

**Renamed (folder):**
- `partner/` → `partner-search/`

**Modified:**
- `docker-compose.yaml` — include path `partner/` → `partner-search/`
- `partner-search/docker-compose.yaml` — all service names, Traefik label values (router names, middleware names), DB_HOST env vars, ES host env vars
- `partner-search/spring/src/main/resources/application.properties` — `DB_HOST:postgres-partner` → `DB_HOST:postgres-partner-search`; ES URI hostname
- `partner-search/quarkus/src/main/resources/application.properties` — same substitutions
- `partner-search/frontend/angular.json` — project name `partner` → `partner-search`
- `partner-search/frontend/federation.config.js` — federation name `partner` → `partner-search`
- `platform/shell/src/environments/federation.manifest.json` — key `partner` → `partner-search`
- `platform/shell/src/app/components/pages/main/main.routes.ts` — `loadRemoteModule('partner', …)` → `loadRemoteModule('partner-search', …)`
- `platform/shell/src/app/components/pages/main/header/header.ts` — nav label key
- `platform/shared/components/basic/mfe-content/sidebar-container/history/history.ts` — `module === 'partner'` → `module === 'partner-search'`
- `partner-search/DOMAIN.md` — service name table
- `tests/docker-compose.yaml` — `depends_on` keys `partner:` → `partner-search:` and `app-spring-partner:` → `app-spring-partner-search:`
- `tests/playwright/e2e/partner-search-ui.spec.ts` — any federation key references
- `partner-search/frontend/Dockerfile` — all occurrences of `partner/frontend`, `projects/partner`, `dist/partner`, `aj.projects.partner` → `partner-search/frontend`, `projects/partner-search`, `dist/partner-search`, `aj.projects['partner-search']`

## Deferred

- Moving Postgres/ES ownership to `partner-edit/` — covered by PARTNER-EDIT-001
- Adding `partner-edit/` Angular remote — covered by PARTNER-EDIT-002
- Updating old `PARTNER-ES-*` / `PARTNER-FW-*` ticket IDs in BACKLOG — cosmetic, not blocking

## Dependencies

None — this is the prerequisite for all subsequent PARTNER-SEARCH-* and PARTNER-EDIT-* tickets.

## Token usage

Last updated: 2026-04-16 22:08 UTC — sessions counted: 1

| Metric | Tokens |
|--------|--------|
| Input | 24,531 |
| Cache creation | 810,566 |
| Cache read | 19,795,030 |
| **Total input** | **20,630,127** |
| Output | 35,854 |
| **Grand total** | **20,665,981** |

<!-- tracked-agents: agent-a440fd35268f49a7e -->
