---
id: PARTNER-EDIT-003
status: done
domain: partner-edit
area: backend
---

## Goal

After a partner is updated via `PUT /api/partner-edit/spring/{partnerNumber}`, `app-spring-partner-edit` synchronously notifies `app-spring-partner-search` so that the Elasticsearch index reflects the change immediately. `partner-search/` Spring exposes a new internal re-index endpoint; `partner-edit/` Spring calls it through `https://gateway` after each successful PUT.

## Context

After PARTNER-EDIT-001, `PartnerSearchNotifier.java` in `partner-edit/spring/` already contains a stub call to `https://gateway/api/partner-search/spring/index/partner/{partnerNumber}`. This endpoint does not exist yet in `partner-search/spring/`. This ticket implements both sides.

The call is **synchronous and best-effort**: if `partner-search` is unreachable or returns a non-2xx, `partner-edit` logs a warning and returns the successful PUT response to the caller anyway — the Postgres write is not rolled back.

Communication goes through `https://gateway` (Traefik), never direct container-to-container, in accordance with CLAUDE-4.

## Acceptance criteria

- [x] `partner-search/spring/` exposes `POST /api/partner-search/spring/index/partner/{partnerNumber}` that: reads the partner row from Postgres by `partnerNumber`, upserts the corresponding Elasticsearch document in the `partners` index, and returns HTTP 204
- [x] The endpoint returns HTTP 404 if `partnerNumber` does not exist in Postgres
- [x] `partner-edit/spring/` `SearchNotifier` calls `POST https://gateway/api/partner-search/spring/index/partner/{partnerNumber}` after each successful `PUT /{partnerNumber}` using Spring's `RestClient` (not `RestTemplate`)
- [x] If the notifier call fails (any exception or non-2xx), a `WARN` log is emitted with the partner number and the failure reason; the PUT response is still HTTP 200
- [x] End-to-end: `PUT /api/partner-edit/spring/{partnerNumber}` with an updated `name` field, followed by `GET /api/partner-search/spring/search/elasticsearch?q=<updated name>`, returns a result containing the updated partner within the same test run
- [x] Existing search e2e tests (`tests/partner-search.sh`, `tests/playwright/e2e/partner-search-ui.spec.ts`) still pass unmodified

## Files affected

**Created:**
- `partner-search/spring/src/main/java/com/example/partner/index/IndexController.java`
- `partner-search/spring/src/main/java/com/example/partner/index/IndexService.java`

**Modified:**
- `partner-edit/spring/src/main/java/com/example/partneredit/sync/SearchNotifier.java` — implement the `RestClient` call (was stub in PARTNER-EDIT-001)
- `partner-edit/spring/src/main/resources/application.properties` — add `partner.search.index.url=https://gateway/api/partner-search/spring/index/partner`
- `partner-search/spring/src/main/java/com/example/partner/` — `IndexController` is picked up automatically by component scan

## Deferred

- Quarkus-side re-index endpoint — not in scope
- Batch re-index of all partners — not in scope
- Retry / dead-letter queue on notifier failure — not in scope

## Dependencies

- PARTNER-EDIT-001 — `PartnerSearchNotifier` stub must exist; Postgres and Spring wiring must be live
- PARTNER-SEARCH-001 — `partner-search/` paths and service names must be finalized

## Token usage

Last updated: 2026-04-17 07:38 UTC — sessions counted: 1

| Metric | Tokens |
|--------|--------|
| Input | 9,972 |
| Cache creation | 256,038 |
| Cache read | 9,105,532 |
| **Total input** | **9,371,542** |
| Output | 22,649 |
| **Grand total** | **9,394,191** |

<!-- tracked-agents: agent-a5756534ad02d0f68 -->
