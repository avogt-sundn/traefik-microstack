---
id: PARTNER-EDIT-001
status: done
domain: partner-edit
area: backend
---

## Goal

Create the `partner-edit/` domain with a Spring Boot backend that owns the PostgreSQL instance and exposes a REST API for fetching and updating individual partner records. `partner-search/` Spring connects to the same Postgres instance as a read-only participant.

## Context

After PARTNER-SEARCH-001, Postgres is named `postgres-partner-search` and owned by `partner-search/docker-compose.yaml`. This ticket transfers that ownership: the Postgres service (and its Flyway migrations) moves to `partner-edit/docker-compose.yaml`. `partner-search/` Spring drops its own Flyway run and connects with a read-only DB user.

The current stub endpoints return 404:
```
GET  /api/partner/spring/{partnerNumber}  → 404
```
This ticket implements them and adds a PUT.

New public API (all routed through Traefik via `https://gateway`):
```
GET  /api/partner-edit/spring/{partnerNumber}          → PartnerDetailResponse
PUT  /api/partner-edit/spring/{partnerNumber}          → PartnerDetailResponse (updated)
POST /api/partner-edit/spring/notify/partner-search    → (internal) triggers ES sync in partner-search
```

The `GET /{partnerNumber}` stub in `app-spring-partner-search` (old `app-spring-partner`) is removed — it now proxies or redirects to `partner-edit`.

## Acceptance criteria

- [x] `partner-edit/docker-compose.yaml` defines `postgres-partner-edit` with image `postgres:15-alpine`, volume `pg-partner-edit-data`, healthcheck `pg_isready -U postgres`, and credentials: `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`, `POSTGRES_DB=app-partner-edit-db`
- [x] `partner-edit/docker-compose.yaml` includes `app-spring-partner-edit` with Traefik labels: router `app-spring-partner-edit`, rule `PathPrefix('/api/partner-edit/spring')`, priority 1000, HTTPS backend port 8446
- [x] `partner-edit/docker-compose.yaml` includes `forward-api-spring-partner-edit` forward container at priority 1100, dev port 8446
- [x] `partner-edit/spring/` is a new Spring Boot 3 project, package `com.example.partneredit`. TLS cert files (`keystore.p12`, `keystore.jks`, `truststore.p12`, `server.crt`, `server.key`) are copied verbatim from `partner-search/spring/src/main/resources/certs/` into `partner-edit/spring/src/main/resources/certs/` — they are classpath resources embedded in the JAR, not symlinks
- [x] Flyway migrations V1–V5 are **moved** (not copied) from `partner-search/spring/src/main/resources/db/migration/` to `partner-edit/spring/src/main/resources/db/migration/`
- [x] `partner-search/spring/src/main/resources/application.properties`: `spring.flyway.enabled=false`; `spring.datasource.url=jdbc:postgresql://${DB_HOST:postgres-partner-edit}:5432/app-partner-edit-db`; `spring.datasource.username=partner_search_ro`; `spring.datasource.password=partner_search_ro`; a read-only DB user `partner_search_ro` is created by Flyway migration `V6__add_readonly_user.sql` in `partner-edit`
- [x] `partner-search/quarkus/src/main/resources/application.properties`: `quarkus.flyway.migrate-at-start=false`; `quarkus.datasource.jdbc.url=jdbc:postgresql://${DB_HOST:postgres-partner-edit}:5432/app-partner-edit-db`; `quarkus.datasource.username=partner_search_ro`; `quarkus.datasource.password=partner_search_ro`
- [x] `GET /api/partner-edit/spring/{partnerNumber}` returns HTTP 200 with `DetailResponse` JSON. Fields: `partnerNumber`, `alphaCode`, `name1`, `name2`, `name3`, `firstname`, `street`, `houseNumber`, `postalCode`, `city`, `type`, `groupType`, `groupNumber`. Returns 404 when not found
- [x] `PUT /api/partner-edit/spring/{partnerNumber}` accepts an `EditRequest` JSON body with all non-key, non-generated columns (`alphaCode`, `name1`, `name2`, `name3`, `firstname`, `street`, `houseNumber`, `postalCode`, `city`, `type`, `groupType`, `groupNumber`), persists to Postgres, and returns the updated `DetailResponse` with HTTP 200
- [x] After a successful PUT, `SearchNotifier` attempts `POST https://gateway/api/partner-search/spring/index/partner/{partnerNumber}` via `RestClient`; because the receiving endpoint does not exist yet, a `WARN` log is emitted and the PUT still returns HTTP 200 (full round-trip verified in PARTNER-EDIT-003)
- [x] `docker-compose.yaml` root include adds `partner-edit/docker-compose.yaml`
- [x] `make up` starts the full stack without error; `postgres-partner-edit` is healthy before `app-spring-partner-edit` starts
- [x] `partner-edit/DOMAIN.md` exists describing purpose, Postgres ownership, and API shape
- [x] `partner-edit/tickets/BACKLOG.md` exists with this ticket listed as `open`

## Files affected

**Created:**
- `partner-edit/docker-compose.yaml`
- `partner-edit/DOMAIN.md`
- `partner-edit/tickets/BACKLOG.md`
- `partner-edit/spring/` — full Spring Boot project scaffold:
  - `partner-edit/spring/pom.xml` — `artifactId`: `spring-partner-edit-api`; root package: `com.example.partneredit`; same parent (`spring-boot-starter-parent 3.5.10`), same dependencies as `partner-search/spring/pom.xml`
  - `partner-edit/spring/Dockerfile`
  - `partner-edit/spring/src/main/resources/certs/` — copy of `keystore.p12`, `keystore.jks`, `truststore.p12`, `server.crt`, `server.key` from `partner-search/spring/src/main/resources/certs/`
  - `partner-edit/spring/src/main/java/com/example/partneredit/Application.java`
  - `partner-edit/spring/src/main/java/com/example/partneredit/partner/Partner.java` (JPA entity)
  - `partner-edit/spring/src/main/java/com/example/partneredit/partner/PartnerRepository.java`
  - `partner-edit/spring/src/main/java/com/example/partneredit/partner/DetailResponse.java`
  - `partner-edit/spring/src/main/java/com/example/partneredit/partner/EditRequest.java`
  - `partner-edit/spring/src/main/java/com/example/partneredit/partner/Controller.java`
  - `partner-edit/spring/src/main/java/com/example/partneredit/sync/SearchNotifier.java`
  - `partner-edit/spring/src/main/resources/application.properties` — `spring.datasource.url=jdbc:postgresql://${DB_HOST:postgres-partner-edit}:5432/app-partner-edit-db`; server port 8446; TLS keystore `classpath:certs/keystore.p12`; `spring.flyway.enabled=true`; `spring.elasticsearch.uris` omitted (partner-edit has no ES dependency)
  - `partner-edit/spring/src/main/resources/db/migration/V1__create_partner_table.sql` … `V5__bulk_seed_partners.sql` (moved from partner-search)
  - `partner-edit/spring/src/main/resources/db/migration/V6__add_readonly_user.sql`

**Modified:**
- `docker-compose.yaml` — add include `partner-edit/docker-compose.yaml`
- `partner-search/docker-compose.yaml` — remove `postgres-partner-search` service block; add `depends_on: app-spring-partner-edit` on both Spring and Quarkus services (ensures V6 migration has run before partner-search connects)
- `partner-search/spring/src/main/resources/application.properties` — `DB_HOST` default → `postgres-partner-edit`; `spring.flyway.enabled=false`; add `spring.datasource.username=partner_search_ro`
- `partner-search/quarkus/src/main/resources/application.properties` — datasource URL → `postgres-partner-edit`; Flyway disabled; DB user → `partner_search_ro`
- `partner-search/spring/src/main/java/com/example/partner/` — removed `GET /{partnerNumber}` stub endpoint

**Deleted:**
- `partner-search/spring/src/main/resources/db/migration/V1__create_partner_table.sql` through `V5__bulk_seed_partners.sql` (moved to partner-edit)
- `partner-search/quarkus/src/main/resources/db/migration/V1__create_partner_table.sql` through `V5__bulk_seed_partners.sql` (moved to partner-edit)

## Deferred

- Angular frontend for partner-edit — PARTNER-EDIT-002
- Actual ES re-index endpoint in partner-search (`/index/partner/{partnerNumber}`) — PARTNER-EDIT-003
- Quarkus backend in partner-edit — not in scope; only Spring
- OAuth / fine-grained authorization on PUT — not in scope

## Dependencies

- PARTNER-SEARCH-001 — must be complete; this ticket references `partner-search/` paths and service names

## Token usage

Last updated: 2026-04-17 06:26 UTC — sessions counted: 1

| Metric | Tokens |
|--------|--------|
| Input | 12,879 |
| Cache creation | 407,788 |
| Cache read | 9,650,440 |
| **Total input** | **10,071,107** |
| Output | 29,409 |
| **Grand total** | **10,100,516** |

<!-- tracked-agents: agent-aa7d096c63301720f -->
