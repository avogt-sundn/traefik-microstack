# Loans Domain

Loan contract search micro-frontend. Users search for loan contracts by contract number, partner number, name, date of birth, postal code, or vehicle registration plate. Frontend-only domain — the backend API is deployed separately and reached through the gateway.

> See [DOMAIN.md](DOMAIN.md) for the authoritative bounded context description.

## Tech Stack

| Technology | Role | Service name |
|---|---|---|
| Angular 21 + Native Federation | Frontend MFE remote | `loans` |
| Nginx | Production static file serving | (built into `loans` image) |

## Project Structure

```
loans/
├── DOMAIN.md           # Bounded context description
├── docker-compose.yaml # loans nginx service
└── frontend/           # Angular MFE workspace
    ├── src/
    │   ├── app/
    │   │   ├── api/        # Auto-generated OpenAPI client — do not hand-edit
    │   │   └── ...
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

> **Known blockers for dev mode:**
> 1. No `forward-ng-loans` socat container exists yet — live dev routing through Traefik requires adding one to `loans/docker-compose.yaml` (see `forward-ng-partner` in `partner/docker-compose.yaml` as reference, use port 4201).
> 2. `loans/frontend` has not yet been decoupled from `platform/shared` source. Until decoupling is complete (see `partner/frontend` as the reference implementation), `make dev-loans` will fail with tsconfig errors.

## Running in Dev Mode

```bash
make dev-loans
```

Starts `ng serve loans` on port **4201** with hot-reload.

> **Prerequisites not yet met** — see blockers above. Once the `forward-loans` container is added and the workspace is decoupled, this target will work identically to `make dev-partner`.

## Building the Docker Image

```bash
make rebuild SERVICE=loans
# Or just the build step:
docker compose build loans
```

Build context is the repo root. Dockerfile is at `loans/frontend/Dockerfile`. Uses the npm mirror at `localhost:4873`.

## Traefik Routes

| Service | Route | Priority | Middleware | Notes |
|---|---|---|---|---|
| `loans` (nginx) | `/loans` | 120 | strip `/loans` | Frontend static files |
| *(forward-loans)* | `/loans` | 1020 | strip `/loans` | Dev mode — not yet created |

## Testing

### Unit Tests

```bash
cd loans/frontend && npm test
```

### E2E Tests

```bash
make pw-local    # Playwright against https://gateway
```

### Smoke Test

```bash
curl -k https://gateway/loans/     # Returns Angular index.html
```

## Key Architectural Notes

**Auto-generated API client:** `src/app/api/` is generated from an OpenAPI specification using the `api` npm script. Do not hand-edit any file in that directory — regenerate via:

```bash
cd loans/frontend && npm run api
```

**No backend in this folder:** The loans backend API is a separate deployment. The frontend calls `/loans/api/...` which Traefik routes to the appropriate backend service. The domain team developing the loans frontend only needs the frontend workspace and the running stack.

**Shared UI:** Import shared components from `@traefik-microstack/shared` (npm package), not from `platform/shared/` source paths. Run `make shared` after any change to `platform/shared/`.

## Completing the Dev Mode Setup

To unblock `make dev-loans`, two steps are needed:

1. **Add forward-ng-loans container** to `loans/docker-compose.yaml`:
   ```yaml
   forward-ng-loans:
     # Copy forward-ng-partner block from partner/docker-compose.yaml, change port to 4201, path to /loans
   ```

2. **Decouple from platform/shared source** following the `partner/frontend` reference implementation (see `partner/README.md` and `.claude/agent-memory/angular-build-fixer/shared-lib-migration.md`).
