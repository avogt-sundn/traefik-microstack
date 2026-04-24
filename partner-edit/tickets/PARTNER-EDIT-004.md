---
id: PARTNER-EDIT-004
status: done
domain: partner-edit
area: frontend
---

## Goal

Fix the wrong API paths hardcoded in `PartnerGatewayService` so that the partner-edit Angular micro-frontend can load, display, and save partner records. Currently every call fails because the service builds paths like `/api/partners/{id}` but Traefik only routes `/api/partner-edit/spring/{id}`, causing `loadPartnerFromUrl` to always error and redirect back to search.

## Context

`partner-edit/frontend/src/app/api/api/partner-gateway.service.ts` is a generated file whose path segments do not match the actual Traefik routes defined in `partner-edit/docker-compose.yaml`. The base path is set via `provideApi(environment.apiGatewayUrl)` in `app.config.ts`, where `environment.apiGatewayUrl = '/api'`. The generated paths then build full URLs as `<basePath><localVarPath>`:

| Method | Generated `localVarPath` | Actual Traefik route |
|---|---|---|
| `findByPartnerNumber` | `/partners/{id}` | `/partner-edit/spring/{id}` |
| `getPartnerSummary` | `/partners/{id}/summary` | not routed (deferred) |
| `savePartner` | `/partners` (POST) | not routed (deferred) |
| `getAllGroups` | `/partners/groups` | not routed (deferred) |
| `getGroupMembers` | `/partners/group-members` | not routed (deferred) |
| `getSalesAreaData` | `/partners/sales-area-data` | not routed (deferred) |
| `findByPostalCode` | `/partners/postal-code-area-focus/{code}` | not routed (deferred) |
| `validateIban` | `/partners/validate-iban` | not routed (deferred) |
| `searchPartners` | `/partner/search` | `/partner-search/spring/search` (belongs to partner-search domain, not partner-edit) |

Only `findByPartnerNumber` and `savePartner` are backed by real endpoints today (PARTNER-EDIT-001). The others are stubs from a legacy spec copy that was never aligned with this project's routing conventions.

The minimum fix to unblock the "search → click row → view partner" flow (PARTNER-EDIT-002) is correcting `findByPartnerNumber`. `savePartner` must also be corrected to unblock the edit+save flow; the backend already accepts `PUT /api/partner-edit/spring/{partnerNumber}` not `POST /api/partners`.

## Acceptance criteria

- [x] `GET https://gateway/api/partner-edit/spring/100001` returns 200 when called by the Angular app (i.e. `findByPartnerNumber(100001)` sends to `/api/partner-edit/spring/100001`)
- [x] Navigating to `/abc/partner-edit/view/100001` in the browser loads the partner detail view without redirecting back to search
- [x] `savePartner` sends `PUT https://gateway/api/partner-edit/spring/{partnerNumber}` for an existing partner (not POST to `/api/partners`)
- [x] Editing a field in the view and clicking save succeeds with a success snackbar shown
- [x] `searchPartners` is removed from `PartnerGatewayService` and `PartnerGatewayServiceInterface` (it belongs to partner-search, not partner-edit; it is not called from any partner-edit component)
- [x] All methods that have no backing Traefik route (`getPartnerSummary`, `getAllGroups`, `getGroupMembers`, `getSalesAreaData`, `findByPostalCode`, `validateIban`) are removed from `PartnerGatewayService` and `PartnerGatewayServiceInterface`, and all call sites in `partner-detail.service.ts`, `partner-advisor.service.ts`, `partner-group.service.ts`, `advisor-treetable.service.ts`, and `bank-tab.ts` are removed or stubbed with a `// TODO` comment referencing this ticket ID
- [x] `ng build partner-edit` produces zero TypeScript errors after the changes
- [x] The e2e test `partner-edit.spec.ts` — specifically the UI navigation test "clicking a search result row navigates to the partner-edit view" — passes against the running stack

## Files affected

**Modified:**
- `partner-edit/frontend/src/app/api/api/partner-gateway.service.ts` — fix `findByPartnerNumber` path to `/partner-edit/spring/${partnerNumber}`; change `savePartner` from POST `/partners` to PUT `/partner-edit/spring/${partnerNumber}` (requires `partnerNumber` param); remove `searchPartners`, `getPartnerSummary`, `getAllGroups`, `getGroupMembers`, `getSalesAreaData`, `findByPostalCode`, `validateIban`
- `partner-edit/frontend/src/app/api/api/partner-gateway.serviceInterface.ts` — mirror removals from the service
- `partner-edit/frontend/src/app/services/partner-view-state.service.ts` — `savePartner()` must pass `partnerData.partnerNumber` to the updated PUT signature
- `partner-edit/frontend/src/app/services/partner-detail.service.ts` — remove `getPartnerSummary` call (stub with `// TODO PARTNER-EDIT-004`)
- `partner-edit/frontend/src/app/services/partner-advisor.service.ts` — remove `findByPostalCode` call (stub with `// TODO PARTNER-EDIT-004`)
- `partner-edit/frontend/src/app/services/partner-group.service.ts` — remove `getAllGroups` / `getGroupMembers` calls (stub with `// TODO PARTNER-EDIT-004`)
- `partner-edit/frontend/src/app/services/advisor-treetable-service/advisor-treetable.service.ts` — remove `getSalesAreaData` call (stub with `// TODO PARTNER-EDIT-004`)
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/bank-tab/bank-tab.ts` — remove `validateIban` call (stub with `// TODO PARTNER-EDIT-004`)

## Deferred

- Implementing `getPartnerSummary`, `getAllGroups`, `getGroupMembers`, `getSalesAreaData`, `findByPostalCode`, `validateIban` — these require new Spring endpoints and Traefik routes that are not in scope here
- Adding the partner-search `searchPartners` use case to `PartnerGatewayService` — partner-search has its own API client
- Create-new-partner flow — `savePartner` for a new partner (no `partnerNumber`) requires a `POST` endpoint not yet implemented in the backend

## Dependencies

- PARTNER-EDIT-001 — Spring backend with GET/PUT endpoints must be done (it is)
- PARTNER-EDIT-002 — Angular frontend and view routing must be done (it is)

## Token usage

Last updated: 2026-04-21 20:14 UTC — sessions counted: 1

| Metric | Tokens |
|--------|--------|
| Input | 29,658 |
| Cache creation | 373,801 |
| Cache read | 7,280,271 |
| **Total input** | **7,683,730** |
| Output | 19,583 |
| **Grand total** | **7,703,313** |

<!-- tracked-agents: agent-adf82a1483d8d485f -->
