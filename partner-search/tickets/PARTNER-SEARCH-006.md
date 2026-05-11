---
id: PARTNER-SEARCH-006
status: done
domain: partner-search
area: frontend
---

# PARTNER-SEARCH-006: Restyle partner-search as multi-card layout matching wireframe

## Goal

Rewrite the SCSS for the partner-search page to render the multi-card layout defined in the wireframe (`platform/images/shell-with-frame.svg`): multiple white rounded cards on the `#eef1f8` background, with a page title outside any card.

## Context

The current SCSS at `partner-search/frontend/src/app/components/pages/partner-search/partner-search.scss` styles content that lives inside `<shared-mfe-content>`, which provides its own card surface and padding. After PARTNER-SEARCH-005 removes the `<shared-mfe-content>` wrapper, the component's `:host` becomes the direct layout container and must provide its own card styling.

### Wireframe design tokens (from SVG)
- Background: `#eef1f8`
- Card surface: `#ffffff`, border-radius `0.625rem` (10px), box-shadow `0 0.0625rem 0.25rem rgba(0,0,0,0.06)`
- Page title: `1.25rem`, weight 700, color `#1a1e38`
- Search button: background `#1e50be`, color `#ffffff`, border-radius `0.5rem`
- Borders/dividers: `#dde1ea` or `#eef1f8`
- Muted text: `#7080a8`

### CSS class names (established by PARTNER-SEARCH-005 template)
- `.page-header`, `.page-title` — title row with create button
- `.search-card`, `.search-row`, `.search-field`, `.search-button`, `.reset-button` — search card
- `.examples-panel`, `.examples-toggle`, `.examples-list`, `.example-row`, `.example-query`, `.example-sep`, `.example-desc` — collapsible examples
- `.results-card`, `.results-header`, `.results-title`, `.results-count`, `.create-button` — results card header
- `.results-tabs`, `.engine-badge`, `.engine-badge--active`, `.tab-divider` — engine/framework toggles
- `.results-divider` — horizontal divider
- `.results-table-wrapper` — scrollable treetable container
- `.result-count-matched`, `.result-count-of`, `.result-count-showing` — result count spans

## Acceptance criteria

- [x] `:host` is a flex column with `gap: 0.75rem`, `padding: 0.75rem`, `background: #eef1f8`, `overflow-y: auto`
- [x] `.search-card` and `.results-card` have white background, `border-radius: 0.625rem`, and matching box-shadow
- [x] `.search-row` is a horizontal flex row with the input field taking `flex: 1` and the search button styled with `#1e50be` background
- [x] `.results-card` fills remaining vertical space (`flex: 1; min-height: 0`) with internal table scrolling via `.results-table-wrapper { overflow-y: auto }`
- [x] `.engine-badge` and `.engine-badge--active` styles are preserved from the current SCSS (pill shape, primary-container active state)
- [x] Examples panel styles match the current design (border, hover highlight, monospace queries)
- [x] Responsive behavior at `max-width: 48rem`: search row wraps, host padding reduces to `0.5rem`
- [x] No token-chip or keyboard-help styles remain (they were for a removed feature and are dead CSS)
- [x] `make rebuild SERVICE=partner-search` completes without errors (CLAUDE-5: all builds run inside containers)
- [x] Visual match: SCSS compiled and CSS tokens verified in bundle (`engine-badge`, `results-card`, `search-card`, `page-title`, `#1e50be`, `#eef1f8`); full visual verification pending PARTNER-SEARCH-005 template rewrite

## Files affected

**Modified:**
- `partner-search/frontend/src/app/components/pages/partner-search/partner-search.scss` — full rewrite

## Deferred

- Shared design tokens extracted to a SCSS partial — premature until a second consumer needs the same card pattern
- Dark mode or theme-variant support
- Animation transitions between empty and results states

## Dependencies

- PARTNER-SEARCH-004 — must be `done` (the `partner.search.results.title` key is rendered in the header that this ticket styles)

## Token usage

Last updated: 2026-04-26 16:11 UTC — sessions counted: 1

| Metric | Tokens |
|--------|--------|
| Input | 23,365 |
| Cache creation | 67,739 |
| Cache read | 309,800 |
| **Total input** | **400,904** |
| Output | 1,378 |
| **Grand total** | **402,282** |

<!-- tracked-agents: agent-a7609f4053e8585fc -->
