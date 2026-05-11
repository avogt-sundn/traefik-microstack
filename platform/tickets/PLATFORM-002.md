---
id: PLATFORM-002
status: done
domain: platform
area: frontend
---

## Goal

Redesign the `platform/shell` visual chrome so the application presents a close optical match to `platform/images/shell-frame.png`: persistent top bar, functional left navigation, rounded framed content area, and no footer. The shell must migrate its current pages into that frame immediately and update `partner-search` so the remote content visually fits the new frame on desktop, tablet, and mobile without changing the project's existing routes or module semantics.

## Context

The provided visual reference lives at `platform/images/shell-with-frame.svg`. Today the shell has no app-wide optical frame: `platform/shell/src/app/app.html` renders only a `router-outlet`, `platform/shell/src/app/components/pages/main/header/header.html` is a simple horizontal toolbar, `platform/shell/src/app/components/pages/main/footer/footer.html` still renders legacy footer metadata, and `platform/shell/src/app/components/pages/client-selection/client-selection.html` uses a standalone welcome toolbar. On the remote side, `partner-search/frontend/src/app/components/pages/partner-search/partner-search.html` already sits inside `shared-mfe-content`, but the shared container styles in `platform/shared/components/basic/mfe-content/*` and `platform/shared/components/basic/mfe-subnavbar/*` do not resemble the new visual frame. `PLATFORM-001` already owns shell-auth state and root-frame plumbing, so this ticket layers the screenshot-driven visual frame on top of that host structure and adapts `partner-search` to fit it.

## Acceptance criteria

- [x] Update `platform/shell/src/app/app.ts`, `platform/shell/src/app/app.html`, and `platform/shell/src/app/app.scss` so the shell renders a persistent screenshot-inspired frame with a top app bar, a left navigation rail, and a central rounded content canvas. The left navigation must contain only real current destinations from the existing app routing model; no placeholder menu items are allowed.
- [x] Update `platform/shell/src/app/components/pages/main/header/header.ts`, `platform/shell/src/app/components/pages/main/header/header.html`, and `platform/shell/src/app/components/pages/main/header/header.scss` so the header visually matches the screenshot direction (brand/home area, action icons, client/avatar area, auth/account actions from `PLATFORM-001`) while keeping the current route/module model rather than copying the screenshot's literal labels.
- [x] Remove the current footer from the new frame by deleting `platform/shell/src/app/components/pages/main/footer/footer.ts`, `platform/shell/src/app/components/pages/main/footer/footer.html`, and `platform/shell/src/app/components/pages/main/footer/footer.scss`, and by removing any remaining footer usage from shell layout files.
- [x] Update `platform/shell/src/app/components/pages/client-selection/client-selection.html`, `platform/shell/src/app/components/pages/client-selection/client-selection.scss`, `platform/shell/src/app/components/pages/main/module-selection/module-selection.html`, and `platform/shell/src/app/components/pages/main/module-selection/module-selection.scss` so both shell-owned pages render inside the new framed content treatment instead of using standalone page chrome.
- [x] Refresh `platform/shared/components/basic/mfe-content/mfe-content.html`, `platform/shared/components/basic/mfe-content/mfe-content.scss`, `platform/shared/components/basic/mfe-content/interaction-container/interaction-container.scss`, `platform/shared/components/basic/mfe-content/sidebar-container/sidebar-container.scss`, `platform/shared/components/basic/mfe-content/information-container/information-container.scss`, `platform/shared/components/basic/mfe-subnavbar/mfe-subnavbar.html`, and `platform/shared/components/basic/mfe-subnavbar/mfe-subnavbar.scss` so host-provided remote containers inherit the screenshot-like card spacing, title row treatment, rounded surfaces, and responsive behavior.
- [x] Update `partner-search/frontend/src/app/app.scss`, `partner-search/frontend/src/app/components/basic/partner-subnavbar/partner-subnavbar.ts`, `partner-search/frontend/src/app/components/basic/partner-subnavbar/partner-subnavbar.html`, `partner-search/frontend/src/app/components/basic/partner-subnavbar/partner-subnavbar.scss`, `partner-search/frontend/src/app/components/pages/partner-search/partner-search.html`, and `partner-search/frontend/src/app/components/pages/partner-search/partner-search.scss` so the `partner-search` remote visually fits the new shell frame with a close match to the screenshot while preserving current search behavior, current routes, and current domain terminology.
- [x] Implement responsive adaptation now: on desktop the left navigation stays persistently visible; on tablet it collapses to a compact but still functional navigation variant; on mobile it becomes an explicit toggleable navigation surface that still exposes the same real routes without horizontal overflow.
- [x] Update `platform/shell/src/app/i18n/en.json`, `platform/shell/src/app/i18n/de.json`, and `platform/shell/src/app/i18n/fr.json` with any new shell-frame labels needed for the responsive navigation and top-bar actions. Do not replace existing domain/module semantics with the screenshot's literal text.
- [x] Update `platform/shell/src/app/app.spec.ts` and `partner-search/frontend/src/app/app.spec.ts`, and add any additional component-level test files needed, so the shell and `partner-search` still instantiate with the new layout dependencies in place.
- [x] Do not modify `partner-edit/frontend/**` in this ticket.

## Files affected

**Created:**
- `platform/shell/src/app/components/pages/main/header/header.spec.ts` — shell header smoke coverage for new frame dependencies
- `partner-search/frontend/src/app/components/pages/partner-search/partner-search.spec.ts` — partner-search component smoke coverage for the new framed layout

**Modified:**
- `platform/shell/src/app/app.ts` — host frame structure and responsive navigation wiring
- `platform/shell/src/app/app.html` — render the persistent shell frame around routed content
- `platform/shell/src/app/app.scss` — desktop/tablet/mobile frame styling
- `platform/shell/src/app/app.spec.ts` — keep shell bootstrap coverage aligned with new layout dependencies
- `platform/shell/src/app/components/pages/main/header/header.ts` — nav/action state for the new shell frame
- `platform/shell/src/app/components/pages/main/header/header.html` — screenshot-inspired top bar markup
- `platform/shell/src/app/components/pages/main/header/header.scss` — top bar styling and responsive behavior
- `platform/shell/src/app/components/pages/client-selection/client-selection.html` — render welcome/client selection inside framed content
- `platform/shell/src/app/components/pages/client-selection/client-selection.scss` — client selection visual adaptation
- `platform/shell/src/app/components/pages/main/module-selection/module-selection.html` — render module selection inside framed content
- `platform/shell/src/app/components/pages/main/module-selection/module-selection.scss` — module selection visual adaptation
- `platform/shared/components/basic/mfe-content/mfe-content.html` — adjust host-provided remote slot structure
- `platform/shared/components/basic/mfe-content/mfe-content.scss` — screenshot-inspired remote content framing
- `platform/shared/components/basic/mfe-content/interaction-container/interaction-container.scss` — central content surface styling
- `platform/shared/components/basic/mfe-content/sidebar-container/sidebar-container.scss` — side panel styling aligned with frame
- `platform/shared/components/basic/mfe-content/information-container/information-container.scss` — supporting panel styling aligned with frame
- `platform/shared/components/basic/mfe-subnavbar/mfe-subnavbar.html` — page-title/subnav row markup
- `platform/shared/components/basic/mfe-subnavbar/mfe-subnavbar.scss` — title/subnav styling and responsive behavior
- `platform/shell/src/app/i18n/en.json` — shell frame labels
- `platform/shell/src/app/i18n/de.json` — shell frame labels
- `platform/shell/src/app/i18n/fr.json` — shell frame labels
- `partner-search/frontend/src/app/app.scss` — remote root spacing inside the new frame
- `partner-search/frontend/src/app/app.spec.ts` — bootstrap coverage with layout dependencies
- `partner-search/frontend/src/app/components/basic/partner-subnavbar/partner-subnavbar.ts` — current route labels for the refreshed subnav
- `partner-search/frontend/src/app/components/basic/partner-subnavbar/partner-subnavbar.html` — refreshed in-content title/subnav markup
- `partner-search/frontend/src/app/components/basic/partner-subnavbar/partner-subnavbar.scss` — screenshot-aligned subnav styling
- `partner-search/frontend/src/app/components/pages/partner-search/partner-search.html` — search screen visual structure inside the new frame
- `partner-search/frontend/src/app/components/pages/partner-search/partner-search.scss` — search screen visual styling for desktop/tablet/mobile

**Deleted:**
- `platform/shell/src/app/components/pages/main/footer/footer.ts`
- `platform/shell/src/app/components/pages/main/footer/footer.html`
- `platform/shell/src/app/components/pages/main/footer/footer.scss`

## Deferred

- Any visual adaptation of `partner-edit/frontend/**`
- Any change to current route semantics, remote paths, or domain/module naming
- Literal reproduction of the screenshot's business labels where those labels do not map to existing routes
- Auth provider wiring, token handling, or account behavior beyond what `PLATFORM-001` already introduces

## Dependencies

- PLATFORM-001 — establishes shell-owned root frame and shared auth state that this visual redesign styles and reuses

## Token usage

Last updated: 2026-04-26 14:54 UTC — sessions counted: 2

| Metric | Tokens |
|--------|--------|
| Input | 108,889 |
| Cache creation | 739,501 |
| Cache read | 27,967,680 |
| **Total input** | **28,816,070** |
| Output | 72,609 |
| **Grand total** | **28,888,679** |

<!-- tracked-agents: agent-a0d0f52360bf9a96b,agent-a75330b65627d4c01 -->
