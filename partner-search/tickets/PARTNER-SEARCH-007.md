---
id: PARTNER-SEARCH-007
status: done
domain: partner-search
area: frontend
---

# PARTNER-SEARCH-007: Update e2e test selectors for multi-card layout

## Goal

Fix Playwright test selectors that reference CSS classes or DOM elements removed or renamed by the multi-card layout redesign (PARTNER-SEARCH-005).

## Context

Two test files reference DOM structure that changes when `<shared-mfe-content>` is removed from the partner-search template:

1. **`tests/playwright/helpers/selectors.ts` line 31** — `partnerSearchHost` selector includes `shared-mfe-content` as a fallback. After PARTNER-SEARCH-005, `shared-mfe-content` is no longer in the partner-search DOM.

2. **`tests/playwright/e2e/browser/engine-toggle.spec.ts` line 89** — Uses `.search-source-indicator .engine-badge:first-of-type` to locate the PG badge. After PARTNER-SEARCH-005, the parent class is renamed from `.search-source-indicator` to `.results-tabs`.

All `cypressid`-based selectors are unaffected since PARTNER-SEARCH-005 preserves all `cypressid` attributes.

## Acceptance criteria

- [x] `tests/playwright/helpers/selectors.ts`: `partnerSearchHost` value is `'partner-partner-search'` (without the `shared-mfe-content` fallback)
- [x] `tests/playwright/e2e/browser/engine-toggle.spec.ts` line 89: selector is `.results-tabs .engine-badge:first-of-type` (not `.search-source-indicator`)
- [x] `make pw-run` passes — all e2e tests green

## Files affected

**Modified:**
- `tests/playwright/helpers/selectors.ts` — update `partnerSearchHost` selector on line 31
- `tests/playwright/e2e/browser/engine-toggle.spec.ts` — update CSS selector on line 89

## Deferred

- Adding new e2e tests for the multi-card layout structure — separate ticket if needed
- Updating the engine-toggle spec's JSDoc comment referencing `.search-source-indicator` on line 12

## Dependencies

- PARTNER-SEARCH-005 — must be `done` (the template changes that rename the CSS classes)
- PARTNER-SEARCH-006 — must be `done` (the SCSS that defines `.results-tabs`)

## Token usage

Last updated: 2026-04-26 16:28 UTC — sessions counted: 1

| Metric | Tokens |
|--------|--------|
| Input | 8,578 |
| Cache creation | 71,886 |
| Cache read | 1,657,118 |
| **Total input** | **1,737,582** |
| Output | 7,311 |
| **Grand total** | **1,744,893** |

<!-- tracked-agents: agent-ac3703a4336cad9a0 -->
