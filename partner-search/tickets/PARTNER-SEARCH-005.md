---
id: PARTNER-SEARCH-005
status: done
domain: partner-search
area: frontend
---

# PARTNER-SEARCH-005: Rewrite partner-search template to multi-card wireframe layout

## Goal

Replace the single `<shared-mfe-content>` wrapper with a multi-card layout matching the wireframe (`platform/images/shell-with-frame.svg`): page title on the background, a search card with explicit "Search" button, and a separate results card containing engine toggles and treetable.

## Context

The current template at `partner-search/frontend/src/app/components/pages/partner-search/partner-search.html` wraps all content inside `<shared-mfe-content>`, which renders as a single white card. The wireframe shows three distinct visual regions on the `#eef1f8` background:

1. A page title ("Search") rendered directly on the background
2. A search card (white, rounded) with a text input and a blue "Search" button
3. A results card (white, rounded) with a "Results" header, engine/framework badges, and the treetable

The component at `partner-search.ts` imports `MfeContent` and `PartnerSubnavbar` — both must be removed from the imports array. All component logic (signals, services, methods like `search()`, `resetForm()`, `createNewPartner()`, `onEngineToggle()`, `onFrameworkToggle()`, `onRowClick()`) remains unchanged.

### Current template structure (to be replaced)
```
<shared-mfe-content>
  <div ngProjectAs="interaction-header"> → <partner-subnavbar>
  <div ngProjectAs="interaction-content"> → search input, examples, engine toggles, treetable
  <div ngProjectAs="interaction-footer"> → Reset + Create buttons
</shared-mfe-content>
```

### Target template structure
```
<div class="page-header">
  <h1 class="page-title">              ← transloco: partner.search.pageTitle
  <button "Create New Partner">         ← pre-search access to createNewPartner()
</div>
<div class="search-card">
  <div class="search-row">             ← input + Search button + Reset button
  <div class="examples-panel">         ← collapsible examples (same logic)
</div>
<shared-info-panel>                    ← no-results state (unchanged)
@if (quad response) {
  <div class="results-card">
    <div class="results-header">       ← "Results" title + count + Create button
    <div class="results-tabs">         ← engine/framework badges
    <div class="results-divider">
    <div class="results-table-wrapper"> ← treetable
  </div>
}
```

## Acceptance criteria

- [x] `<shared-mfe-content>` is not present in the template
- [x] `<partner-subnavbar>` is not present in the template
- [x] `MfeContent` is removed from the `imports` array in `partner-search.ts`
- [x] `PartnerSubnavbar` is removed from the `imports` array and its import statement removed from `partner-search.ts`
- [x] A `<h1>` page title renders the `partner.search.pageTitle` transloco key
- [x] A "Search" button exists that calls `search()`, using `common.search` transloco key
- [x] The "Reset" button (`cypressid="cypress-partner-search-reset"`) is inside the search card
- [x] The "Create New Partner" button (`cypressid="cypress-partner-create-new"`) is accessible both before and after a search
- [x] Engine/framework toggle badges and slide toggles render inside `.results-tabs` within the results card
- [x] The `<partner-treetable>` renders inside `.results-table-wrapper` within the results card
- [x] All existing `cypressid` attributes are preserved: `cypress-partner-search-input`, `cypress-partner-search-reset`, `cypress-partner-create-new`, `cypress-framework-toggle`, `cypress-engine-toggle`, `cypress-result-count`
- [x] `make rebuild SERVICE=partner-search` completes without errors (CLAUDE-5: all builds run inside containers)
- [x] The component's TypeScript logic is unchanged — no method signatures, signal declarations, or service calls modified
- [x] Engine duration badge expressions use ternary form `(activeFramework() === 'spring' ? quad.spring : quad.quarkus).postgres?.durationMs` — not bracket access `quad[activeFramework()]` which fails strict TypeScript because `QuadSearchResponse` has no index signature

## Files affected

**Modified:**
- `partner-search/frontend/src/app/components/pages/partner-search/partner-search.html` — full rewrite of template
- `partner-search/frontend/src/app/components/pages/partner-search/partner-search.ts` — remove `MfeContent` and `PartnerSubnavbar` from imports

## Deferred

- SCSS styling — covered by PARTNER-SEARCH-006 (can be implemented in parallel; the template uses class names that PARTNER-SEARCH-006 will style)
- Deletion of `PartnerSubnavbar` component files — it may be used by other routes in the future; leave in place
- Changes to `<shared-mfe-content>` shared component — no modifications needed

## Dependencies

- PARTNER-SEARCH-004 — must be `done` (provides the `partner.search.pageTitle` and `partner.search.results.title` i18n keys referenced in the template)

## Token usage

Last updated: 2026-04-26 16:13 UTC — sessions counted: 1

| Metric | Tokens |
|--------|--------|
| Input | 15,750 |
| Cache creation | 136,334 |
| Cache read | 1,885,562 |
| **Total input** | **2,037,646** |
| Output | 8,476 |
| **Grand total** | **2,046,122** |

<!-- tracked-agents: agent-abfbb8d53cdf02b8c -->
