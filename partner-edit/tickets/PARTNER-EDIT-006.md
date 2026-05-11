---
id: PARTNER-EDIT-006
status: open
domain: partner-edit
area: frontend
---

## Goal

Add a Partner header card to the `ViewPartner` component matching the wireframe at
`partner-edit/wireframes/partner-view.svg`. The card displays the partner's name,
Partnernummer, Hauptanschrift summary, and a static "Aktiv" badge, giving Sachbearbeiter
a persistent identity anchor while navigating tabs.

## Context

`ViewPartner` (`partner-edit/frontend/src/app/components/pages/view-partner/`) currently
renders a `mat-tab-group` directly below the subnavbar with no summary header. The wireframe
defines a prominent header card as the primary identity region. The existing `partner()` and
`displayPartner()` signals already hold the full `PartnerEditDto` — no new API call is needed.

`← Partner wechseln` is placed as an additional `navigationItems` entry in `PartnerSubnavbar`,
following the same pattern as the existing "Partnersuche" item.

Antrag-related cards (Antragssumme, compact Antrag bar, Produkte & Regionen, Zuständige Stelle)
are explicitly deferred pending the `antrag` domain.

## Acceptance criteria

- [ ] A new `PartnerHeaderCard` component exists at
  `partner-edit/frontend/src/app/components/basic/partner-header-card/`
- [ ] `PartnerHeaderCard` accepts `@Input() partner: PartnerEditDto`
- [ ] The card renders: `name1`, Partnernummer, one-line Hauptanschrift
  (`street houseNumber, postalCode city`), and a static green "Aktiv" badge
- [ ] `ViewPartner` renders `<partner-header-card>` above the `mat-tab-group`,
  passing `displayPartner()` as input; it is hidden when `partner()` is null
- [ ] `PartnerSubnavbar.navigationItems` gains a second entry `← Partner wechseln`
  navigating to `/<client>/partner-search/search`
- [ ] i18n keys added under `partner.header` in
  `partner-edit/frontend/src/app/i18n/shared-de.json` and `shared-en.json`:
  `partnerNumber`, `aktiv`, `partnerWechseln`, `hauptanschrift`
- [ ] `ng build` in `partner-edit/frontend` succeeds with zero errors
- [ ] No existing e2e selector (`cypress-edit-partner-tab-group`,
  `cypress-partner-create-edit`, `cypress-partner-create-save`) breaks

## Files affected

**Created:**
- `partner-edit/frontend/src/app/components/basic/partner-header-card/partner-header-card.ts`
- `partner-edit/frontend/src/app/components/basic/partner-header-card/partner-header-card.html`
- `partner-edit/frontend/src/app/components/basic/partner-header-card/partner-header-card.scss`

**Modified:**
- `partner-edit/frontend/src/app/components/pages/view-partner/view-partner.html` — add `<partner-header-card>`
- `partner-edit/frontend/src/app/components/pages/view-partner/view-partner.ts` — import `PartnerHeaderCard`
- `partner-edit/frontend/src/app/components/basic/partner-subnavbar/partner-subnavbar.ts` — add `← Partner wechseln` nav item
- `partner-edit/frontend/src/app/i18n/shared-de.json` — add `partner.header.*` keys
- `partner-edit/frontend/src/app/i18n/shared-en.json` — add `partner.header.*` keys

## Deferred

- Antrag compact context bar — requires `antrag` domain
- Antragssumme card — requires `antrag` domain
- Produkte & Regionen card — requires `antrag` domain
- Zuständige Stelle card — requires `antrag` domain
- Live partner status field — `PartnerEditDto` has no `status` field yet

## Dependencies

- PARTNER-EDIT-005 — done (flat `PartnerEditDto` is the shape this card reads from)
