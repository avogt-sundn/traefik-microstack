# Partner Domain

Business partner registry with dual-engine search (PostgreSQL full-text vs. Elasticsearch). This is the **reference full-stack domain** — it contains a frontend micro-frontend, two backend implementations (Spring Boot and Quarkus), and demonstrates the complete domain development workflow.

> See [DOMAIN.md](DOMAIN.md) for the authoritative bounded context definition.

## Tech Stack

| Technology | Role | Service name |
|---|---|---|
| Angular 21 + Native Federation | Frontend MFE remote | `partner` |
| Spring Boot 3 + JPA | Primary backend API | `app-spring-partner` |
| Quarkus RESTEasy Reactive | Alternative backend API (opt-in) | `app-quarkus-partner` |
| PostgreSQL 15 | Persistent storage (Spring) | `postgres-partner` |
| PostgreSQL 15 | Persistent storage (Quarkus) | `postgres-quarkus-partner` |
| Elasticsearch | Full-text search (Spring, custom image) | `elasticsearch-spring-partner` |
| Elasticsearch 9.2.2 | Full-text search (Quarkus, official image) | `elasticsearch-quarkus-partner` |
| Nginx | Production static file serving | (built into `partner` image) |

## Project Structure

```
partner/
├── DOMAIN.md                         # Bounded context description
├── SEARCH-ARCHITECTURE.md            # Dual-engine search design
├── PLAN-ELASTICSEARCH.md             # Elasticsearch integration notes
├── POSTGRESQL-SEARCH-TECHNIQUES.md   # PostgreSQL FTS techniques
├── POSTGRESQL-SEARCH-TECHNIQUES-DE.md
├── docker-compose.yaml               # All domain services
├── frontend/                         # Angular MFE workspace
│   ├── src/                          # Application source
│   ├── angular.json
│   ├── package.json                  # Independent workspace, no other-domain deps
│   ├── tsconfig.json
│   └── Dockerfile                    # Multi-stage build (build context: repo root)
├── spring/                           # Spring Boot 3 backend
│   ├── src/main/java/...
│   ├── src/main/resources/
│   │   ├── application.properties    # server.port=8445 for local dev
│   │   └── db/migration/             # Flyway V1–V4 migrations
│   ├── elasticsearch/                # Custom ES Docker image + config
│   └── Dockerfile
├── quarkus/                          # Quarkus backend (opt-in)
│   ├── src/main/java/...
│   ├── src/main/resources/
│   ├── Dockerfile                    # JVM image
│   └── Dockerfile.native             # GraalVM native image
└── scripts/
    ├── generate-partners.py          # Synthetic data generator
    └── load-partners.sh              # Bulk load script (used by make partners:load)
```

## Prerequisites

- Docker and Docker Compose installed
- The full stack running: `make up` (from repo root) — starts mirrors, builds all images, starts all services
- For frontend dev: shared library published — `make shared`
- Devcontainer recommended (see `.devcontainer/`) for Java + Node toolchain

## Running in Dev Mode

### Frontend

```bash
make dev-partner
```

Starts `ng serve partner` on port **4202** with hot-reload. The `forward-ng-partner` socat container (already running in the Docker stack) proxies port 4202 from the Docker network back to the devcontainer. Because `forward-ng-partner` registers with Traefik at priority **1020** — higher than the packaged `partner` nginx container (priority 120) — all traffic to `/partner` is instantly routed to the live dev server. When you stop `ng serve`, the healthcheck on `forward-ng-partner` fails and Traefik automatically falls back to the packaged container.

```bash
# After editing platform/shared, republish the library first:
make shared
# Then restart the dev server — npm install happens automatically on first run
```

### Spring Boot Backend

```bash
cd partner/spring
./mvnw spring-boot:run
```

Runs on port **8445**. The `forward-api-spring-partner` socat container proxies this port at Traefik priority **1100**, overriding the packaged `app-spring-partner` container. The service uses HTTPS with self-signed TLS; the devcontainer has the root CA trusted.

### Quarkus Backend (opt-in)

```bash
cd partner/quarkus
./mvnw quarkus:dev
```

Runs on port **8080** (Quarkus default) with live-reload. No forward container exists for the Quarkus dev backend — to route traffic through Traefik, use `docker compose --profile run-quarkus up` instead to start the containerized Quarkus backend (which runs at Traefik priority 1000, one below Spring's 1001).

### Bulk Test Data

```bash
make partners:load COUNT=100000   # default; max 1,000,000
```

Wipes and reloads both Postgres and Elasticsearch with synthetic partner records.

## Building the Docker Image

Always build from the **repo root** using the Makefile — the frontend Dockerfile uses the repo root as build context:

```bash
make rebuild SERVICE=partner             # frontend
make rebuild SERVICE=app-spring-partner  # Spring backend
# Quarkus (JVM):
docker compose --profile run-quarkus build app-quarkus-partner
# Quarkus (native — slow):
docker compose --profile run-quarkus build --build-arg DOCKERFILE=Dockerfile.native app-quarkus-partner
```

Builds use the local Maven mirror (`localhost:8008`) and npm mirror (`localhost:4873`) — both started by `make up`.

## Traefik Routes

| Service | Route | Priority | Middleware | Notes |
|---|---|---|---|---|
| `app-spring-partner` | `/api/partner` | 1001 | — | Default backend; HTTPS port 443 |
| `app-quarkus-partner` | `/api/partner` | 1000 | — | Profile `run-quarkus`; HTTPS port 443 |
| `partner` (nginx) | `/partner` | 120 | strip `/partner` | Frontend static files |
| `forward-api-spring-partner` | `/api/partner` | 1100 | — | Dev mode: proxies to localhost:8445 |
| `forward-ng-partner` | `/partner` | 1020 | strip `/partner` | Dev mode: proxies to localhost:4202 |

All traffic enters through Traefik at `https://gateway` (or `https://localhost`). The frontend calls `/api/partner/...` — Traefik routes it to the backend. Do not call the backend container directly.

## Testing

### Unit Tests

```bash
# Spring backend
cd partner/spring && ./mvnw test

# Angular frontend
cd partner/frontend && npm test
```

### E2E Tests

```bash
make pw-local    # runs Playwright from the devcontainer against https://gateway
```

Tests live in `tests/playwright/e2e/partner-search.spec.ts` and `partner-search-ui.spec.ts`. They are blackbox — they interact with the full stack through Traefik exactly as a browser would.

### Smoke Test

```bash
curl -k https://gateway/actuator/health      # Spring health (when containerized)
curl -k https://gateway/api/partner/search?q=test
curl -k https://gateway/partner/             # Frontend index.html
```

## Key Architectural Notes

**Dual-engine search:** Every `/api/partner/search` request runs against both PostgreSQL (full-text search with German stemming) and Elasticsearch simultaneously. The `DualSearchResponse` contains both result sets plus per-engine timing. The frontend toggle lets users switch between the two.

**Shared UI library:** The frontend imports `@traefik-microstack/shared` as an npm package from the local Verdaccio registry. It does **not** reference `platform/shared/` source paths. Run `make shared` to rebuild and publish after touching `platform/shared/`.

**Flyway migrations:** Database schema is managed via Flyway. Migrations live in `partner/spring/src/main/resources/db/migration/` (V1: schema, V2: seed data, V3: disambiguation test data, V4: FTS stemming renames). They run automatically on service startup.

**Service calls go through the gateway:** Any backend-to-backend call must use `https://gateway/<route>`, not direct container hostnames. This ensures load balancing and routing controls are respected.

## Further Reading

- [DOMAIN.md](DOMAIN.md) — bounded context, key entities, team responsibilities
- [SEARCH-ARCHITECTURE.md](SEARCH-ARCHITECTURE.md) — dual-engine search design
- [PLAN-ELASTICSEARCH.md](PLAN-ELASTICSEARCH.md) — Elasticsearch integration evolution
- [POSTGRESQL-SEARCH-TECHNIQUES.md](POSTGRESQL-SEARCH-TECHNIQUES.md) — FTS techniques in English
- [spring/ELASTICSEARCH.md](spring/ELASTICSEARCH.md) — Elasticsearch setup for the Spring backend
