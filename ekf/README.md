# EKF Domain

An Angular micro-frontend scaffold ready for feature development. The federation, routing, Docker build pipeline, i18n, and OpenAPI generation are fully wired — the domain team fills in the business features.

> See [DOMAIN.md](DOMAIN.md) for the authoritative bounded context description.

## Tech Stack

| Technology | Role | Service name |
|---|---|---|
| Angular 21 + Native Federation | Frontend MFE remote | `ekf` |
| Nginx | Production static file serving | (built into `ekf` image) |

## Project Structure

```
ekf/
├── DOMAIN.md           # Bounded context description
├── docker-compose.yaml # ekf nginx service
└── frontend/           # Angular MFE workspace
    ├── src/
    │   ├── app/        # Application source (currently a scaffold)
    │   └── ...
    ├── angular.json
    ├── package.json    # Independent workspace
    ├── federation.config.js  # Exposes ./Component and ./Routes
    └── Dockerfile      # Multi-stage build (build context: repo root)
```

## Prerequisites

- Docker and Docker Compose installed
- The full stack running: `make up` (from repo root)
- Shared library published: `make shared`

> **Note:** `ekf/frontend` has not yet been decoupled from `platform/shared` source. Until decoupling is complete (see `partner/frontend` as the reference), `make dev-ekf` may fail. The Docker image build is not affected.

## Running in Dev Mode

```bash
make dev-ekf
```

Starts `ng serve ekf` on port **4203** with hot-reload. The `forward-ng-ekf` socat container proxies port 4203 from the Docker network at Traefik priority **1020** — higher than the packaged `ekf` container (priority 120). When `ng serve` stops, Traefik falls back automatically.

> Before running `make dev-ekf` for the first time, ensure `ekf/frontend` is decoupled from `platform/shared` source (run `make shared` and update the workspace's `package.json` to depend on `@traefik-microstack/shared`).

## Building the Docker Image

```bash
make rebuild SERVICE=ekf
# Or just the build step:
docker compose build ekf
```

Build context is the repo root. Dockerfile is at `ekf/frontend/Dockerfile`. Uses the npm mirror at `localhost:4873`.

## Traefik Routes

| Service | Route | Priority | Middleware | Notes |
|---|---|---|---|---|
| `ekf` (nginx) | `/ekf` | 120 | strip `/ekf` | Frontend static files |
| `forward-ng-ekf` | `/ekf` | 1020 | strip `/ekf` | Dev mode: proxies to localhost:4203 |

## Testing

### Unit Tests

```bash
cd ekf/frontend && npm test
```

### E2E Tests

```bash
make pw-local    # Playwright against https://gateway
```

### Smoke Test

```bash
curl -k https://gateway/ekf/     # Returns Angular index.html
```

## Key Architectural Notes

**Scaffold status:** The current UI is a minimal stub. The federation config (`federation.config.js`) exposes `./Component` (the root AppComponent) and `./Routes` for lazy loading by the shell. OpenAPI client generation scripts are present in `package.json` but not yet configured against a backend.

**Shared UI:** Import shared components from `@traefik-microstack/shared` (npm package), not from `platform/shared/` source paths. Run `make shared` after any change to `platform/shared/`.

**Adding a backend:** When this domain grows a backend service, add it to `ekf/docker-compose.yaml` (both the production service and its `forward-api-*` dev container) following the patterns in `partner/docker-compose.yaml`.
