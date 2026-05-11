# ADR-0011: Correct PartnerGatewayService API paths to match Traefik routes

**Date**: 2026-04-21
**Status**: Accepted
**Session context**: Implementing PARTNER-EDIT-004 — partner-edit view was broken because the Angular API client used wrong path segments that don't match Traefik routing conventions.

## Context

`partner-edit/frontend/src/app/api/api/partner-gateway.service.ts` is an OpenAPI-generated file whose `localVarPath` segments were copied from a legacy spec and never aligned with the actual Traefik routes. This caused every API call from the partner-edit Angular app to 404, making `loadPartnerFromUrl` always error-redirect back to search.

The root cause: generated clients use bare resource paths (`/partners/{id}`) while this project's convention is domain-scoped paths (`/partner-edit/spring/{id}`). See CLAUDE.md axiom [CLAUDE-12] for the full path convention table.

Additionally, 7 methods in the service referenced endpoints that have no backing Traefik route and no Spring implementation — `getPartnerSummary`, `getAllGroups`, `getGroupMembers`, `getSalesAreaData`, `findByPostalCode`, `validateIban`, and `searchPartners` (the last belonging to the partner-search domain entirely).

## Decision

1. **Fix `findByPartnerNumber`**: change `localVarPath` from `/partners/${id}` to `/partner-edit/spring/${id}`.
2. **Fix `savePartner`**: change from `POST /partners` to `PUT /partner-edit/spring/${partnerNumber}`. Add `partnerNumber` as the first parameter; call sites extract it from `partnerDto.partnerNumber`.
3. **Remove the 7 unrouted methods** from both `PartnerGatewayService` and `PartnerGatewayServiceInterface`.
4. **Stub call sites** with `// TODO PARTNER-EDIT-004: <method> not yet routed` comments in `partner-detail.service.ts`, `partner-advisor.service.ts`, `partner-group.service.ts`, `advisor-treetable.service.ts`, `bank-tab.ts`.
5. **Clean up orphaned imports** and injections at every call site.

## Consequences

- `findByPartnerNumber` now sends `GET /api/partner-edit/spring/{id}` — matches the Spring backend route defined in PARTNER-EDIT-001.
- `savePartner` now sends `PUT /api/partner-edit/spring/{id}` — matches the Spring backend route.
- The 7 removed methods will need to be re-added (with correct paths) when the corresponding Spring endpoints are implemented.
- `ng build partner-edit` produces zero TypeScript errors.
- All 43 e2e tests pass.

## Token efficiency note

Documenting the path convention mismatch between OpenAPI-generated clients and Traefik domain-scoped routes prevents future sessions from spending tokens re-diagnosing 404s from the Angular frontend. Future generated clients must have their `localVarPath` values audited against CLAUDE.md [CLAUDE-12] before merging.
