---
id: PARTNER-EDIT-005
status: done
domain: partner-edit
area: frontend
---

## Goal

Replace the oversized OpenAPI-generated `PartnerDto` in the Angular micro-frontend
with a flat `PartnerEditDto` that mirrors the 13 fields of
`Partner.java`. Rewrite the address-tab form to read and write these fields directly.
Move `type`, `groupType`, `groupNumber` to the group tab. Remove all tabs with no
backend backing (contact, bank, advisor, info, engagement, administration).

## Context

The frontend uses a ~50-field `PartnerDto` with nested `contactPersons`,
`bankConnections`, `groupAssignments`. The backend `DetailResponse` and `EditRequest`
are flat 13-field records. The mismatch means:

- **GET**: `PartnerAddressService.extractFormDataFromPartner()` reads
  `contactPersons[0].name1` — absent in the flat response — so all form fields are
  blank after load.
- **PUT**: `PartnerGatewayService.savePartner()` sends the `PartnerDto` shape; the
  backend deserializes into `EditRequest` and receives null for every field.
- The address tab shows fields with no backend: `country`, `phonePrefix`,
  `phoneNumber`, `mobilePrefix`, `mobileNumber`, `sepaEmailNotification`.
- Fields that exist in the backend but are not shown: `firstname`, `type`,
  `groupType`, `groupNumber`.

Backend flat fields (source of truth):
`partnerNumber`, `alphaCode`, `name1`, `name2`, `name3`, `firstname`,
`street`, `houseNumber`, `postalCode`, `city`, `type`, `groupType`, `groupNumber`

## Acceptance criteria

- [x] `GET /api/partner-edit/spring/100002` — navigating to
  `/{CLIENT}/partner-edit/view/100002` populates all 13 fields: alphaCode,
  name1–3, firstname, street, houseNumber, postalCode, city visible on the address
  tab; type, groupType, groupNumber visible on the group tab.
- [x] `PUT /api/partner-edit/spring/100002` — the Save button sends a flat JSON body
  containing `alphaCode`, `name1`, `name2`, `name3`, `firstname`, `street`,
  `houseNumber`, `postalCode`, `city`, `type`, `groupType`, `groupNumber`. No
  `contactPersons`, `bankConnections`, or `groupAssignments` keys in the payload.
- [x] New e2e test in `tests/playwright/e2e/partner-edit.spec.ts` (describe block
  `"Partner-edit UI — edit and save via form"`): navigates to
  `/{CLIENT}/partner-edit/view/100002`, clicks Edit, changes the `name1` field to
  `"Schmidt & Partner KG [ui-save]"`, clicks Save, then
  `GET /api/partner-edit/spring/100002` returns `name1 === "Schmidt & Partner KG [ui-save]"`.
  Test restores original name after assertion.
- [x] Existing e2e describe block `"Partner-edit → ES re-index (PARTNER-EDIT-003)"`
  in `tests/playwright/e2e/partner-edit.spec.ts` passes unchanged.
- [x] The mat-tab-group contains exactly **2 tabs**: "Adresse" and "Gruppe".
- [x] `ng build` inside `partner-edit/frontend/` succeeds with zero TypeScript errors.

## Files affected

**Created:**
- `partner-edit/frontend/src/app/api/model/partner-edit-dto.ts`
  — `export interface PartnerEditDto { partnerNumber?: number; alphaCode?: string;
  name1?: string; name2?: string; name3?: string; firstname?: string; street?: string;
  houseNumber?: string; postalCode?: string; city?: string; type?: string;
  groupType?: string; groupNumber?: number; }`

**Modified:**
- `partner-edit/frontend/src/app/api/model/models.ts`
  — add `export * from './partner-edit-dto'`
- `partner-edit/frontend/src/app/api/api/partner-gateway.service.ts`
  — replace `PartnerDto` with `PartnerEditDto`; update import
- `partner-edit/frontend/src/app/api/api/partner-gateway.serviceInterface.ts`
  — replace `PartnerDto` with `PartnerEditDto`
- `partner-edit/frontend/src/app/services/partner-detail.service.ts`
  — replace `PartnerDto` with `PartnerEditDto`; remove `PartnerSummaryDto` signal
  (no backend endpoint)
- `partner-edit/frontend/src/app/services/partner-view-state.service.ts`
  — replace `PartnerDto` with `PartnerEditDto`; replace `emptyPartnerTemplate` with
  `{}`; remove `shortOverviewSections` (depends on PartnerSummaryDto)
- `partner-edit/frontend/src/app/services/partner-data-merge.service.ts`
  — replace `mergePartnerData` body with `{ ...currentPartner, ...updates }`;
  delete `mergeContactPersons`, `mergeBankConnections`, `mergeGroupAssignments`
- `partner-edit/frontend/src/app/services/partner-address.service.ts`
  — rewrite `extractFormDataFromPartner`: read flat fields directly from
  `partner.name1`, `partner.street`, etc.; rewrite `convertFormToPartnerDto`:
  return `Partial<PartnerEditDto>` with flat fields from form values; remove all
  nested ContactPersonDto / AddressDto / TelecommunicationDto logic
- `partner-edit/frontend/src/app/services/partner-save-validation.service.ts`
  — replace `PartnerDtoValidator.validate` with an inline check: `type` must be
  `undefined` or a string ≤ 1 char; all other fields optional — always returns
  `{ isValid: true, errors: {} }` unless `type` violates the constraint
- `partner-edit/frontend/src/app/components/pages/view-partner/view-partner.ts`
  — replace `PartnerDto` / `PartnerSummaryDto` with `PartnerEditDto`; remove
  `ShortOverview`, `ShortOverviewSection`, `shortOverviewSections`; remove tab
  event handlers for contact, bank, advisor, info, engagement, administration;
  keep only `onAddressTabChanged` and `onGroupTabChanged`
- `partner-edit/frontend/src/app/components/pages/view-partner/view-partner.html`
  — keep only the Address and Gruppe `<mat-tab>` blocks; remove the 6 other tabs;
  remove `<cf-shared-short-overview>` block
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/address-tab/address-tab.ts`
  — replace `PartnerDto` input with `PartnerEditDto`; remove
  `validateTelecommunicationField` and `validateAddressField`; update form group to:
  `company1` (→name1), `company2` (→name2), `company3` (→name3), `firstname`,
  `street`, `houseNumber`, `postalCode`, `city`, `alphacode`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/address-tab/address-tab.html`
  — remove `country`, `phonePrefix`, `phoneNumber`, `mobilePrefix`, `mobileNumber`,
  `sepaEmailNotification` fields; add `firstname` field below `company3`; keep
  street/houseNumber/postalCode/city/alphacode
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/group-tab/group-tab.ts`
  — replace `PartnerDto` with `PartnerEditDto`; replace the groupAssignments +
  locationData computed signals with simple signals reading `partner().groupType`,
  `partner().type`, `partner().groupNumber`; emit `Partial<PartnerEditDto>` from
  `partnerTabChanged`; remove `PartnerGroupService`, `ChipTabs`, `ChipTabItem`,
  `EditableTable` imports
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/group-tab/group-tab.html`
  — replace chip-tabs + editable-tables with a simple form showing three read/edit
  fields: `type` (text, 1-char), `groupType` (text), `groupNumber` (number)

**Deleted:**
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/contact-tab/contact-tab.ts`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/contact-tab/contact-tab.html`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/contact-tab/contact-person-dialog/contact-person-dialog.ts`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/contact-tab/contact-person-dialog/contact-person-dialog.html`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/bank-tab/bank-tab.ts`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/bank-tab/bank-tab.html`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/bank-tab/bank-columns.config.ts`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/advisor-tab/advisor-tab.ts`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/advisor-tab/advisor-tab.html`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/info-tab/info-tab.ts`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/info-tab/info-tab.html`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/engagement-tab/engagement-tab.ts`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/engagement-tab/engagement-tab.html`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/administration-tab/administration-tab.ts`
- `partner-edit/frontend/src/app/components/pages/view-partner/tabs/administration-tab/administration-tab.html`

## Deferred

- Deleting unused model files (`address-dto.ts`, `bank-connection-dto.ts`,
  `contact-person-dto.ts`, validators in `validators/generated/`) — these have no
  runtime callers after this ticket but removing them is a separate cleanup.
- Deleting `partner-contact.service.ts`, `partner-advisor.service.ts`,
  `partner-group.service.ts`, `advisor-treetable-service/`, `telecommunication-builder.service.ts`
  — deferred until confirmed unused by `platform/shared` imports across all remotes.
- Removing unused translation keys (`partner.view.tabs.*` for removed tabs) from i18n
  files.

## Dependencies

- PARTNER-EDIT-004 — done (`PartnerGatewayService` API paths `/api/partner-edit/spring/…`
  are correct; this ticket builds on the working routing)

## Token usage

Last updated: 2026-04-22 13:50 UTC — sessions counted: 1

| Metric | Tokens |
|--------|--------|
| Input | 16,185 |
| Cache creation | 294,004 |
| Cache read | 12,987,639 |
| **Total input** | **13,297,828** |
| Output | 27,608 |
| **Grand total** | **13,325,436** |

<!-- tracked-agents: agent-a22fb5b7e8408f382 -->
