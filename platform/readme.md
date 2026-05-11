# Platform Domain

The Angular shell (host application) and the shared UI library for all micro-frontends. Two outputs: the `shell` host app that composes all MFE remotes, and `@traefik-microstack/shared` — an npm library published to the local Verdaccio registry.

> See [DOMAIN.md](DOMAIN.md) for the authoritative bounded context description.

## Tech Stack

| Technology | Role | Output |
|---|---|---|
| Angular 21 + Native Federation | Shell host app | `shell` Docker image |
| ng-packagr | Shared component library | `@traefik-microstack/shared` npm package |
| Nginx | Production static file serving | (built into `shell` image) |
| Verdaccio | Local npm registry | `npm-mirror` Docker service |

## Project Structure

```
platform/
├── DOMAIN.md                   # Bounded context description
├── docker-compose.yaml         # shell service
├── Dockerfile                  # Multi-stage build for shell
├── angular.json                # Workspace: projects shell + shared
├── package.json                # Workspace dependencies
├── tsconfig.json               # Workspace TypeScript config
├── shell/                      # Host Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.routes.ts              # Routes: /:client/partner
│   │   │   └── environments/
│   │   │       └── federation.manifest.json  # Remote entry URLs
│   │   └── ...
│   ├── federation.config.js    # Native Federation shell config
│   └── proxy.conf.json         # Angular dev-server proxy for MFE routes
└── shared/                     # ng-packagr library
    ├── public-api.ts           # All exports
    ├── ng-package.json         # Library build config → dist/shared
    ├── components/             # MfeContent, InfoPanel, EditableTable, ...
    ├── directives/             # CypressIdDirective, ErrorMessageDirective
    ├── services/               # FormValidationService, HybridTranslocoLoaderService
    ├── validators/             # GlobalValidators
    ├── pipes/                  # HighlightPipe
    ├── util/                   # Date helpers, Phone, RolesEnum, ...
    └── i18n/                   # de.json, en.json, fr.json
```

## Prerequisites

- Docker and Docker Compose installed
- The full stack running: `make up` (from repo root) — starts Verdaccio (npm mirror) and builds all images
- Node 24+ for local library development

## Running in Dev Mode

### Shell

```bash
make dev-shell
```

Starts `ng serve shell` on port **4200** with hot-reload. The `forward-ng-shell` socat container proxies port 4200 from the Docker network at Traefik priority **101** — one above the packaged shell (priority 100). When `ng serve` stops, Traefik falls back to the packaged container automatically.

The shell dev server also proxies MFE remote entries (`/partner/*`) to the Docker stack via `shell/proxy.conf.json`, so you can develop the shell against packaged MFE containers.

### Shared Library

The shared library is consumed by other domains as an npm package — it is **not** imported via source paths. After editing `platform/shared/`:

```bash
make shared
```

This rebuilds the library (`ng build shared`) and publishes `@traefik-microstack/shared` to Verdaccio (auto-bumping the patch version if already published). Domain frontends that depend on it must then run `npm install` to pick up the new version.

## Building the Docker Image

```bash
make rebuild SERVICE=shell
# Or just the build step:
docker compose build shell
```

Build context is `platform/`. Uses the npm mirror at `localhost:4873`.

## Traefik Routes

| Service | Route | Priority | Notes |
|---|---|---|---|
| `shell` (nginx) | `/` | 100 | Catch-all — lowest priority, MFE routes win |
| `forward-ng-shell` | `/` | 101 | Dev mode: proxies to localhost:4200 |

The shell catches all requests not matched by a higher-priority MFE router. The MFE remotes register at priority 120, so `/partner` is served by its nginx container (or dev server), while everything else falls through to the shell.

## Testing

### Unit Tests

```bash
cd platform
npm test
```

### E2E Tests

```bash
make pw-local    # Playwright against https://gateway
```

The e2e smoke test in `tests/playwright/e2e/smoke.spec.ts` verifies the shell loads at `https://gateway/`.

### Smoke Test

```bash
curl -k https://gateway/              # Shell index.html
curl -k https://gateway/partner/remoteEntry.json   # Partner remote entry
```

## Key Architectural Notes

**Native Federation manifest:** `shell/src/app/environments/federation.manifest.json` maps remote names to their `remoteEntry.json` URLs. The entries point to `/partner/remoteEntry.json` etc. — Traefik routes these to the appropriate nginx container or dev server, all on the same origin (no CORS).

**Routing:** The shell routes `/:client/partner`. The `:client` segment is a tenant identifier (hardcoded tenants: ABC Bank, DEF Enterprise, GHI GmbH). Each route lazy-loads the corresponding MFE via Native Federation.

**Shared library exports:** `shared/public-api.ts` is the single entry point. Key exports: `MfeContent`, `MfeSubnavbar`, `InfoPanel`, `EditableTable`, `ChipTabs`, `HybridTranslocoLoaderService`, `FormValidationService`, `GlobalValidators`, `HighlightPipe`, `CypressIdDirective`, and more. Domain teams import from `@traefik-microstack/shared`.

**i18n:** German default, English and French supported. `HybridTranslocoLoaderService` merges shell translations with per-MFE remote translations. Domain frontends copy shared i18n JSON files from `platform/shared/i18n/` into their own workspace (as `src/app/i18n/shared-*.json`).

**Sheriff:** `@softarc/sheriff-core` enforces module boundary rules across the workspace.
