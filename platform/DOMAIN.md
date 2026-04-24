# Platform Domain

## Purpose

The **Angular shell (host application)** and the **shared UI library** used by all microfrontends. Platform is the single entry point for the entire SPA — it loads and orchestrates the `loans`, `partner`, and `ekf` remotes at runtime via Native Federation, and provides the `platform/shared` library consumed by every MFE at build time.

## Bounded Context

Two outputs:
1. **`shell`** — the host Angular app (routing container, multi-tenant client picker, layout chrome).
2. **`platform/shared`** — an ng-packagr library distributed via the local Verdaccio registry, providing shared components, services, validators, and i18n base translations.

## Services

| Service | Technology | Route | Notes |
|---|---|---|---|
| `shell` | Angular + Nginx | `/` priority 100 | Catches everything not matched by MFE routers |

The shell intentionally runs at the **lowest Traefik priority (100)** so that MFE containers (`/loans`, `/partner`, `/ekf` at priority 120) take precedence.

## Routing

```
/                    → redirect to /welcome
/welcome             → ClientSelection (tenant picker)
/:client/loans       → loadRemoteModule('loans')
/:client/partner     → loadRemoteModule('partner')
/:client/ekf         → loadRemoteModule('ekf')
/:client/**          → ModuleSelection (domain picker)
```

Tenants are currently hardcoded: `ABC Bank (abc)`, `DEF Enterprise (def)`, `GHI GmbH (ghi)`. Auto-redirects when only one tenant is configured.

## Native Federation

`federation.manifest.json` maps each remote to its Traefik-served `remoteEntry.json`:

```json
{
  "partner": "/partner/remoteEntry.json",
  "loans":   "/loans/remoteEntry.json",
  "ekf":     "/ekf/remoteEntry.json"
}
```

All dependencies are declared as strict-version singletons (`shareAll`) to prevent duplicate Angular/CDK/Material instances across the host+remote boundary.

## Shared Library (`platform/shared`)

Published to the local Verdaccio registry at build time. Key exports:

- **Components**: `MfeContent`, `MfeSubnavbar`, `ChipTabs`, `EditableTable`, `InfoPanel`, `ValidatedFormField`, `FeedbackDialog`, `ShortOverview`
- **Services**: `CookieService`, `FormValidationService`, `ValidationErrorService`, `HybridTranslocoLoader`
- **Utilities**: date/phone helpers, `Role` enum, `MaintenanceErrorHandler`, `StartWithTap` operator
- **Directives**: `CypressId`, `ErrorMessage`

## Key Architectural Decisions

- **`MatTableModule` eagerly bootstrapped in shell root injector**: Prevents `NG0201` injection token conflicts when MFEs use CDK tables. This is a known Native Federation gotcha — do not remove.
- **`HybridTranslocoLoader`**: Merges bundled base translations with per-MFE remote translation JSON (`/assets/<mfe>/i18n/<lang>.json`). Enables each remote to ship its own strings while sharing a common base.
- **Auth scaffolded, not implemented**: `AuthService` / `AuthConfigService` stubs exist. `angular-oauth2-oidc` is a shared singleton so remotes receive tokens without extra setup once auth is wired.
- **Sheriff** (`@softarc/sheriff-core`) enforces module boundary rules between MFE projects — configure boundaries before adding cross-domain imports.
- **i18n**: German (default), English, French. Language persisted in a `lang` cookie and propagated via `?lang=` query param.
