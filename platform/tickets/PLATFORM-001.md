---
id: PLATFORM-001
status: open
domain: platform
area: frontend
---

## Goal

Make `platform/shell` the persistent on-screen frame for the SPA and the source of stubbed authentication state for all micro-frontends. Move frame ownership to the root shell app, add shell-owned login/logout behavior backed by browser-session persistence, and expose the auth runtime through `platform/shared` so remotes can inject the same API without implementing visible auth behavior yet.

## Context

`platform/shell/src/app/app.html` currently renders only a `router-outlet`, while the actual frame (`shell-header`, `shell-footer`) lives inside `platform/shell/src/app/components/pages/main/main.html`. That means the shell frame starts only after `/:client`, and `/welcome` still renders its own standalone toolbar in `platform/shell/src/app/components/pages/client-selection/client-selection.html`. At the same time, `platform/shell/src/app/services/auth.ts` and `platform/shell/src/app/services/auth-config.ts` are empty stubs, and `platform/shared/public-api.ts` exports no auth API for remotes to consume. Native Federation is already configured with `shareAll({ singleton: true, strictVersion: true })` in `platform/shell/federation.config.js`, `partner-search/frontend/federation.config.js`, and `partner-edit/frontend/federation.config.js`, so a shared auth runtime exported from `platform/shared` is the right place to establish the shell as the host-owned auth base.

## Acceptance criteria

- [ ] Create `platform/shared/services/auth.service.ts` and export it from `platform/shared/public-api.ts`. The service must expose a shell/remotes-safe API for stubbed auth state (`isAuthenticated`, `displayName`, `login()`, `logout()`, and restore-on-startup behavior) and persist that state in `sessionStorage` so it survives browser refreshes within the same browser session.
- [ ] Add `platform/shared/services/auth.service.spec.ts` covering session restore, login, and logout behavior of the shared auth service.
- [ ] Update `platform/shell/src/app/services/auth.ts` to consume or delegate to the shared auth service instead of owning an independent shell-local stub implementation.
- [ ] Move persistent frame ownership to the root shell app by updating `platform/shell/src/app/app.ts` and `platform/shell/src/app/app.html` so the shell header/footer wrap both `/welcome` and `/:client/**` routes. Update `platform/shell/src/app/components/pages/main/main.ts` and `platform/shell/src/app/components/pages/main/main.html` so they no longer duplicate the frame inside the child route tree.
- [ ] Update `platform/shell/src/app/components/pages/client-selection/client-selection.html` to rely on the root shell frame instead of rendering its own standalone top toolbar.
- [ ] Update `platform/shell/src/app/components/pages/main/header/header.ts` and `platform/shell/src/app/components/pages/main/header/header.html` so the account menu offers **Login** when signed out and **Logout** when signed in, uses the shared auth service for both actions, and renders the current stub auth status in the shell frame.
- [ ] Update `platform/shell/src/app/i18n/en.json`, `platform/shell/src/app/i18n/de.json`, and `platform/shell/src/app/i18n/fr.json` so the header/auth labels used by the shell frame match the new login/logout and signed-in-status behavior.
- [ ] Update `platform/shell/src/app/app.spec.ts` and add any additional shell-side test coverage needed so the root shell still boots with the shared frame and auth wiring in place.
- [ ] Do not modify `partner-search/frontend/**` or `partner-edit/frontend/**` in this ticket. Remotes must be able to import the shared auth API after this ticket, but they do not need visible auth behavior yet.

## Files affected

**Created:**
- `platform/shared/services/auth.service.ts`
- `platform/shared/services/auth.service.spec.ts`

**Modified:**
- `platform/shared/public-api.ts` — export the shared auth runtime for shell + remotes
- `platform/shell/src/app/app.ts` — move shell frame ownership to the root app
- `platform/shell/src/app/app.html` — render persistent frame around routed content
- `platform/shell/src/app/app.spec.ts` — keep root app coverage aligned with the new frame
- `platform/shell/src/app/services/auth.ts` — delegate to the shared auth runtime
- `platform/shell/src/app/components/pages/main/main.ts` — reduce main page shell to routed content
- `platform/shell/src/app/components/pages/main/main.html` — remove duplicated header/footer frame
- `platform/shell/src/app/components/pages/main/header/header.ts` — bind header account actions to shared auth state
- `platform/shell/src/app/components/pages/main/header/header.html` — render login/logout and auth status
- `platform/shell/src/app/components/pages/client-selection/client-selection.html` — remove duplicate welcome toolbar and rely on root frame
- `platform/shell/src/app/i18n/en.json` — align shell auth/header labels
- `platform/shell/src/app/i18n/de.json` — align shell auth/header labels
- `platform/shell/src/app/i18n/fr.json` — align shell auth/header labels

**Deleted:**
- None.

## Deferred

- Real IdP / OIDC integration through `angular-oauth2-oidc` and `AuthConfigService`
- Route guards that block `/welcome`, `/:client/partner`, or `/:client/partner-edit` for signed-out users
- Any visible auth-state reaction inside `partner-search/frontend/**` or `partner-edit/frontend/**`
- User profile loading, token refresh, role mapping, or logout confirmation dialogs

## Dependencies

- None.
