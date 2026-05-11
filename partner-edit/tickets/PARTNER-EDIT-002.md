---
id: PARTNER-EDIT-002
status: done
domain: partner-edit
area: frontend
---

## Goal

Create a new Angular micro-frontend remote in `partner-edit/` by **extracting** the existing `ViewPartner` component (and its supporting services) out of `partner-search/frontend/` and moving them into a new standalone `partner-edit/frontend/` app. Wire it into the shell so users can navigate from the `partner-search` results list to a detail/edit page in the `partner-edit` remote.

## Context

The `partner-search/frontend/` app already contains a fully functional partner detail + edit view:
- `partner-search/frontend/src/app/components/pages/view-partner/view-partner.ts` — tabbed detail/edit component
- `partner-search/frontend/src/app/services/partner-view-state.service.ts` — edit/save state using `PartnerGatewayService.savePartner()` (calls `POST /api/partners`) and `findByPartnerNumber()` (calls `GET /api/partners/{id}`)
- Route `view/:partnerId` in `partner-search/frontend/src/app/app.routes.ts`

These are moved, not reimplemented. The `partner-search/` remote retains only the `PartnerSearch` component and its `search` route.

The existing `partner-search` Angular remote is served at `/partner` (public path). The new `partner-edit` remote is served at `/partner-edit`.

Current federation manifest (`platform/shell/src/environments/federation.manifest.json`) after PARTNER-SEARCH-001:
```json
{
  "partner-search": "/partner/remoteEntry.json"
}
```
After this ticket it gains `"partner-edit": "/partner-edit/remoteEntry.json"`.

Dev port assignment (existing: shell=4200, partner-search=4202): `partner-edit` Angular dev server uses port **4204**.

## Acceptance criteria

- [ ] `partner-edit/frontend/` is a new Angular 19 standalone app, project name `partner-edit`, federation name `partner-edit`, dev port 4204
- [ ] `partner-edit/frontend/federation.config.js` exposes `'./Component'` → `./src/app/app.ts` and `'./Routes'` → `./src/app/app.routes.ts`; shared config copied verbatim from `partner-search/frontend/federation.config.js` (including `shareAll`, `@angular/cdk`, `@angular/material` overrides, `ignoreUnusedDeps`)
- [ ] `partner-edit/docker-compose.yaml` contains an `app-partner-edit` Nginx frontend service: router `partner-edit`, rule `PathPrefix('/partner-edit')`, middleware `partner-edit-strip` stripping `/partner-edit`, priority 120, port 80
- [ ] `partner-edit/docker-compose.yaml` contains `forward-ng-partner-edit` forward container: rule `PathPrefix('/partner-edit')`, middleware `forward-ng-partner-edit-strip`, priority 1020, port 4204
- [ ] `GET /partner-edit/remoteEntry.json` returns HTTP 200 in the running stack
- [ ] Shell manifest includes `"partner-edit": "/partner-edit/remoteEntry.json"`
- [ ] Shell `main.routes.ts` has a lazy route `path: 'partner-edit'` that loads `loadRemoteModule('partner-edit', './Routes')`
- [ ] Shell `header.ts` nav array includes `{ nameKey: 'app.modules.partner-edit', label: 'partner-edit' }`
- [ ] `partner-edit/frontend/src/app/app.routes.ts` exposes routes `view/:partnerId` and `view` pointing to the moved `ViewPartner` component; default route redirects to `/partner-search/search`
- [ ] `partner-edit/frontend/` contains the moved files: `ViewPartner` component + all its tab components, `PartnerViewStateService`, `PartnerDetailService`, `PartnerDataMergeService`, `PartnerSaveValidationService`, i18n loaders, API client files (`PartnerGatewayService`, all DTOs), validators, and the `api/` folder — sourced from `partner-search/frontend/src/app/`
- [ ] `partner-search/frontend/src/app/app.routes.ts` no longer contains the `view/:partnerId` or `view` routes; only `search` and `**` remain
- [ ] `partner-search/frontend/src/app/` no longer contains `components/pages/view-partner/`, `services/partner-view-state.service.ts`, `services/partner-detail.service.ts`, `services/partner-data-merge.service.ts`, `services/partner-save-validation.service.ts` — these are deleted after the move
- [ ] The `partner-search` Angular remote's search result list renders a `[routerLink]` per row navigating to `/{client}/partner-edit/view/{partnerNumber}` using an absolute path
- [ ] `partner-edit/frontend/Dockerfile` follows the same multi-stage build pattern as `partner-search/frontend/Dockerfile`, substituting all `partner` tokens with `partner-edit` tokens

## Files affected

**Created:**
- `partner-edit/frontend/angular.json` — project name `partner-edit`, same structure as `partner-search/frontend/angular.json`
- `partner-edit/frontend/federation.config.js`
- `partner-edit/frontend/package.json` — same dependencies as `partner-search/frontend/package.json`
- `partner-edit/frontend/src/app/app.ts`
- `partner-edit/frontend/src/app/app.routes.ts` — routes: `view/:partnerId`, `view`, `**` → redirect
- `partner-edit/frontend/src/app/app.config.ts`
- `partner-edit/frontend/src/app/components/pages/view-partner/` — moved from `partner-search/frontend/src/app/components/pages/view-partner/`
- `partner-edit/frontend/src/app/services/partner-view-state.service.ts` — moved
- `partner-edit/frontend/src/app/services/partner-detail.service.ts` — moved
- `partner-edit/frontend/src/app/services/partner-data-merge.service.ts` — moved
- `partner-edit/frontend/src/app/services/partner-save-validation.service.ts` — moved
- `partner-edit/frontend/src/app/api/` — moved from `partner-search/frontend/src/app/api/`
- `partner-edit/frontend/src/app/validators/` — moved from `partner-search/frontend/src/app/validators/`
- `partner-edit/frontend/src/app/i18n/` — moved from `partner-search/frontend/src/app/i18n/`
- `partner-edit/frontend/src/app/components/basic/` — moved from `partner-search/frontend/src/app/components/basic/`
- `partner-edit/frontend/Dockerfile`

**Modified:**
- `partner-edit/docker-compose.yaml` — add `app-partner-edit` (Nginx) and `forward-ng-partner-edit` services
- `platform/shell/src/environments/federation.manifest.json` — add `partner-edit` entry
- `platform/shell/src/app/components/pages/main/main.routes.ts` — add `partner-edit` lazy route
- `platform/shell/src/app/components/pages/main/header/header.ts` — add nav entry
- `platform/shared/components/basic/mfe-content/sidebar-container/history/history.ts` — add `module === 'partner-edit'` case
- `partner-search/frontend/src/app/app.routes.ts` — remove `view/:partnerId` and `view` routes
- `partner-search/frontend/src/app/components/pages/partner-search/partner-search.ts` (or its template) — add `[routerLink]` per result row navigating to `/{client}/partner-edit/view/{partnerNumber}`

**Deleted (moved to partner-edit):**
- `partner-search/frontend/src/app/components/pages/view-partner/` (entire folder)
- `partner-search/frontend/src/app/services/partner-view-state.service.ts`
- `partner-search/frontend/src/app/services/partner-detail.service.ts`
- `partner-search/frontend/src/app/services/partner-data-merge.service.ts`
- `partner-search/frontend/src/app/services/partner-save-validation.service.ts`
- `partner-search/frontend/src/app/api/` (entire folder — no longer needed in partner-search)
- `partner-search/frontend/src/app/validators/` (entire folder — no longer needed in partner-search)
- `partner-search/frontend/src/app/i18n/` — moved; only the partner-search i18n keys remain
- `partner-search/frontend/src/app/components/basic/partner-subnavbar/` — moved (used only by view-partner)

## Deferred

- i18n / translation keys for `app.modules.partner-edit` label — placeholder string is acceptable
- Form validation beyond HTML5 `required` — not in scope
- ES re-index feedback in UI — covered by PARTNER-EDIT-003

## Dependencies

- PARTNER-SEARCH-001 — partner-search folder must exist with correct names
- PARTNER-EDIT-001 — backend API must be live before frontend can be tested end-to-end

## Token usage

Last updated: 2026-04-17 06:57 UTC — sessions counted: 1

| Metric | Tokens |
|--------|--------|
| Input | 28,691 |
| Cache creation | 342,969 |
| Cache read | 28,080,254 |
| **Total input** | **28,451,914** |
| Output | 41,598 |
| **Grand total** | **28,493,512** |

<!-- tracked-agents: agent-acfb63d2e27ca0b24 -->
