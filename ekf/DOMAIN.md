# EKF Domain

## Purpose

A **microfrontend scaffold** — currently a skeleton ready for feature development. The domain demonstrates the full Native Federation + Traefik routing + Docker build pipeline for a frontend-only domain, without any backend service of its own.

## Bounded Context

Frontend-only domain. All backend calls (when implemented) will route through the API gateway at `/api`. Authentication is handled by the platform shell via Native Federation's shared singleton (`angular-oauth2-oidc`).

## Services

| Service | Technology | Route | Notes |
|---|---|---|---|
| `ekf` | Angular + Nginx | `/ekf` (strip prefix) | MFE remote, priority 120 |

## Current State

The rendered UI is a single `<h1>EKF</h1>` inside a Material toolbar + card. Routes defined:

```
/          → App root component
/dashboard → App root component (alias)
**         → redirect to /
```

This is an intentional stub. The infrastructure (federation, routing, Docker build, i18n, OpenAPI generation scripts) is fully wired — domain features are not yet implemented.

## Key Architectural Decisions

- **MFE remote**: Exposes `./Component` via Native Federation. Consumed by the platform shell at `/:client/ekf`.
- **OpenAPI generation ready**: `package.json` defines `api:ekf` scripts for generating an API client — wire up when a backend contract exists.
- **i18n**: Transloco configured for `de` (default), `en`, `fr`. Translation files are empty; the `HybridTranslocoLoader` (from `platform/shared`) merges local translations with remote `/assets/ekf/i18n/<lang>.json` at runtime.
- **Auth**: `angular-oauth2-oidc` is declared as a shared singleton dep. The shell owns auth; this remote receives tokens through the federation boundary without any additional setup.
