---
id: PARTNER-SEARCH-004
status: done
domain: partner-search
area: frontend
---

# PARTNER-SEARCH-004: Add i18n keys for wireframe-aligned layout

## Goal

Add the translation keys required by the new multi-card layout so that downstream tickets (PARTNER-SEARCH-005, PARTNER-SEARCH-006) can reference them without merge conflicts.

## Context

The wireframe (`platform/images/shell-with-frame.svg`) introduces two new text elements not present in the current i18n files: a page title ("Search") and a results card heading ("Results"). A "Search" button label is already available as `common.search`. Only two new keys are needed, in all three language files.

Existing key structure in `partner-search/frontend/src/app/i18n/shared-de.json` under `partner.search`:
- `placeholder`, `fields`, `token`, `help`, `examples`, `engineToggle`, `frameworkToggle`, `actions`, `results`, `table`

The new keys slot into this existing structure.

## Acceptance criteria

- [x] `partner.search.pageTitle` exists in `shared-de.json` with value `"Partnersuche"`, in `shared-en.json` with `"Partner Search"`, in `shared-fr.json` with `"Recherche de partenaire"`
- [x] `partner.search.results.title` exists in `shared-de.json` with value `"Ergebnisse"`, in `shared-en.json` with `"Results"`, in `shared-fr.json` with `"Résultats"`
- [x] `make rebuild SERVICE=partner-search` completes without errors (CLAUDE-5: all builds run inside containers)

## Files affected

**Modified:**
- `partner-search/frontend/src/app/i18n/shared-de.json` — add `pageTitle` under `partner.search`, add `title` under `partner.search.results`
- `partner-search/frontend/src/app/i18n/shared-en.json` — same
- `partner-search/frontend/src/app/i18n/shared-fr.json` — same

## Deferred

- Template and SCSS changes that consume these keys — covered by PARTNER-SEARCH-005
- Any additional keys for future filter chips or tabs — separate ticket if needed

## Dependencies

None

## Token usage

Last updated: 2026-04-26 16:08 UTC — sessions counted: 1

| Metric | Tokens |
|--------|--------|
| Input | 6,588 |
| Cache creation | 84,024 |
| Cache read | 685,061 |
| **Total input** | **775,673** |
| Output | 3,275 |
| **Grand total** | **778,948** |

<!-- tracked-agents: agent-aaa1176426e2f975b -->
