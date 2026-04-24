---
id: PARTNER-SEARCH-002
status: done
domain: partner-search
area: elasticsearch
---

## Goal

Change the incremental ES reindex path so `partner-edit` pushes the full partner
payload to `partner-search`'s index endpoint, eliminating the redundant Postgres
re-read that currently happens after every PUT. This removes cross-domain database
coupling in the incremental update path and makes the API contract between
`partner-edit` and `partner-search` explicit.

## Context

Current flow after `PUT /api/partner-edit/spring/{partnerNumber}`:
1. `Controller` (partner-edit) saves the `Partner` entity, then calls
   `searchNotifier.notifyReindex(partnerNumber)`.
2. `SearchNotifier` posts `POST https://gateway/api/partner-search/spring/index/partner/{partnerNumber}`
   — body-less.
3. `IndexController` (partner-search/spring) receives the partner number and delegates
   to `IndexService.reindex(Long partnerNumber)`.
4. `IndexService` re-reads the partner from `PartnerRepository`, which connects to
   `postgres-partner-edit` using the read-only role `partner_search_ro`.
5. The freshly-read entity is mapped to `PartnerDocument` and saved to ES.

The re-read at step 4 is a cross-domain DB access: `partner-search` reaches into
`postgres-partner-edit`'s schema to reconstruct data that `partner-edit` just wrote
and has available in memory. Any schema change to the `partner` table requires both
`partner-edit/spring/.../partner/Partner.java` and
`partner-search/spring/.../model/Partner.java` to be updated in lockstep.

The startup full-reindex (`PartnerIndexService.indexOnStartup()`) also reads Postgres
directly but is out of scope — bulk loading 1.2 M rows via the API is impractical.

## Acceptance criteria

- [ ] `POST /api/partner-search/spring/index/partner/{partnerNumber}` accepts a JSON
  body matching the new `PartnerIndexRequest` record (all 13 partner fields).
- [ ] `IndexService.reindex(PartnerIndexRequest)` upserts the ES document without
  calling `PartnerRepository`.
- [ ] `SearchNotifier.notifyReindex(DetailResponse)` serializes the `DetailResponse`
  as the JSON body of the POST request.
- [ ] `Controller.java` (partner-edit) passes `DetailResponse.from(saved)` to
  `notifyReindex` instead of the bare `partnerNumber`.
- [ ] `GET /api/partner/spring/search?q={partnerNumber}` returns the updated `name1`
  in `body.elasticsearch.results` within 10 s after a PUT — the existing e2e test
  `tests/playwright/e2e/partner-edit.spec.ts` describe block
  "Partner-edit → ES re-index (PARTNER-EDIT-003)" passes unchanged.
- [ ] `PartnerIndexService.indexOnStartup()` is unchanged — startup seeding still
  reads from Postgres via `EntityManager`.

## Files affected

**Created:**
- `partner-search/spring/src/main/java/com/example/partner/index/PartnerIndexRequest.java`
  — record with fields: `partnerNumber`, `alphaCode`, `name1`, `name2`, `name3`,
  `firstname`, `street`, `houseNumber`, `postalCode`, `city`, `type`, `groupType`,
  `groupNumber`

**Modified:**
- `partner-edit/spring/src/main/java/com/example/partneredit/sync/SearchNotifier.java`
  — change signature from `notifyReindex(Long partnerNumber)` to
  `notifyReindex(DetailResponse data)`; add `.contentType(MediaType.APPLICATION_JSON).body(data)`
  to the RestClient call before `.retrieve()`
- `partner-edit/spring/src/main/java/com/example/partneredit/partner/Controller.java`
  — change line 51 from `searchNotifier.notifyReindex(partnerNumber)` to
  `searchNotifier.notifyReindex(DetailResponse.from(saved))`
- `partner-search/spring/src/main/java/com/example/partner/index/IndexController.java`
  — add `@RequestBody PartnerIndexRequest request` parameter to `reindex()`; pass to
  `IndexService`
- `partner-search/spring/src/main/java/com/example/partner/index/IndexService.java`
  — change `reindex(Long partnerNumber)` to `reindex(PartnerIndexRequest request)`;
  remove `PartnerRepository` field and constructor parameter from this class;
  build `PartnerDocument` directly from `request` fields

## Deferred

- Quarkus (`app-quarkus-partner-search`) does not expose an index endpoint — no changes.
- Startup bulk seeding in `PartnerIndexService.indexOnStartup()` — direct Postgres
  read via `EntityManager` and `partner_search_ro` is appropriate for 1.2 M rows.
- Removing `PartnerRepository` from `partner-search/spring` entirely — it is still
  required by `PartnerSearchService` for Postgres-engine queries.
- Adding retry / dead-letter semantics to `SearchNotifier` — out of scope.

## Dependencies

- PARTNER-EDIT-003 — must be `done` (establishes the notification pattern this
  ticket refines); it is done.

## Token usage

Last updated: 2026-04-22 13:35 UTC — sessions counted: 1

| Metric | Tokens |
|--------|--------|
| Input | 4,695 |
| Cache creation | 138,955 |
| Cache read | 1,596,350 |
| **Total input** | **1,740,000** |
| Output | 8,346 |
| **Grand total** | **1,748,346** |

<!-- tracked-agents: agent-a6ce8ed2011792d25 -->
