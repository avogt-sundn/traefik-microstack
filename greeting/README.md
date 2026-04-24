# Greeting Domain

A framework comparison exercise: the same simple Greeting CRUD use-case implemented across Spring Boot (WebFlux proxy, MVC+JPA) and Quarkus (RESTEasy Reactive + Panache). Backend-only domain — no frontend.

> See [DOMAIN.md](DOMAIN.md) for the authoritative bounded context description.

## Tech Stack

| Technology | Role | Service name |
|---|---|---|
| Spring Boot (WebFlux) | Forwarding proxy | `app-one` |
| Spring Boot (MVC + JPA) | CRUD storage | `app-two` |
| Quarkus RESTEasy Reactive + Panache | CRUD storage (JVM) | `app-three` |
| Quarkus (GraalVM native) | CRUD storage (native binary) | `app-three-native` |
| PostgreSQL 15 | Persistent storage (one instance per service) | `postgres-one/two/three` |

## Project Structure

```
greeting/
├── DOMAIN.md           # Bounded context description
├── docker-compose.yaml # All domain services
├── proxy/              # Spring Boot WebFlux — app-one (proxies to app-two)
│   ├── src/main/
│   │   └── resources/application.properties   # server.port=8443
│   └── Dockerfile
├── spring/             # Spring Boot MVC+JPA — app-two (storage)
│   ├── src/main/
│   │   └── resources/application.properties   # server.port=8444
│   └── Dockerfile
└── quarkus/            # Quarkus — app-three (JVM + native)
    ├── src/main/
    ├── Dockerfile          # JVM image
    └── Dockerfile.native   # GraalVM native image
```

## Prerequisites

- Docker and Docker Compose installed
- The full stack running: `make up` (from repo root)
- Devcontainer recommended for Java toolchain (Maven 3.9+, Java 25)

## Running in Dev Mode

Each backend can be started locally from the devcontainer. The corresponding `forward-*` socat container registers with Traefik at priority **1100**, overriding the packaged container for that route.

### app-one (Spring WebFlux proxy) — port 8443

```bash
cd greeting/proxy
./mvnw spring-boot:run
```

`forward-api-one` proxies port 8443 from the Docker network to the devcontainer. Traefik routes `/api/one` through it at priority 1100.

### app-two (Spring MVC+JPA storage) — port 8444

```bash
cd greeting/spring
./mvnw spring-boot:run
```

`forward-api-two` proxies port 8444. Traefik routes `/api/two` through it at priority 1100.

### app-three (Quarkus) — port 8080 (Quarkus dev default)

```bash
cd greeting/quarkus
./mvnw quarkus:dev
```

Quarkus dev mode has built-in live-reload. No forward container exists for app-three — to route through Traefik, rebuild and restart the containerized service instead:

```bash
make rebuild SERVICE=app-three
```

## Building the Docker Images

```bash
make rebuild SERVICE=app-one     # Spring WebFlux proxy
make rebuild SERVICE=app-two     # Spring MVC+JPA
make rebuild SERVICE=app-three   # Quarkus JVM
# Quarkus native (slow — GraalVM AOT compilation):
docker compose build app-three-native
```

Builds use the local Maven mirror at `localhost:8008` (started by `make up`).

## Traefik Routes

| Service | Route | Priority | Notes |
|---|---|---|---|
| `app-one` | `/api/one` | 1000 | Spring proxy; HTTPS port 443 |
| `app-two` | `/api/two` | 1000 | Spring storage; HTTPS port 443 |
| `app-three` | `/api/three` | — | Quarkus JVM; HTTPS port 443 |
| `app-three-native` | `/api/three` | — | Quarkus native; HTTPS port 443 |
| `forward-api-one` | `/api/one` | 1100 | Dev mode: proxies to localhost:8443 |
| `forward-api-two` | `/api/two` | 1100 | Dev mode: proxies to localhost:8444 |

`app-three` and `app-three-native` share the same route with no explicit priority — only one should be in the stack at a time (comment out the other in `docker-compose.yaml`).

## Testing

### Unit Tests

```bash
cd greeting/proxy  && ./mvnw test
cd greeting/spring && ./mvnw test
cd greeting/quarkus && ./mvnw test
```

### E2E Tests

```bash
make pw-local    # Playwright against https://gateway
```

### Smoke Tests

```bash
curl -k https://gateway/api/one/actuator/health
curl -k https://gateway/api/two/actuator/health
curl -k https://gateway/api/three/q/health
# Create a greeting via app-one (which proxies to app-two):
curl -k -X POST https://gateway/api/one/greet -H "Content-Type: application/json" \
  -d '{"name":"World","message":"Hello"}'
```

## Key Architectural Notes

**Proxy-via-gateway:** `app-one` does not call `app-two` directly by container hostname. It calls `https://gateway/api/two/...`. This is the canonical inter-service communication pattern in this stack — all service-to-service calls go through Traefik. Direct container-to-container calls bypass load balancing and routing controls.

**Framework comparison:** `app-two` (Spring MVC + JPA + Hibernate) and `app-three` (Quarkus RESTEasy Reactive + Panache) implement the same REST contract for Greetings. The greeting entity is `{id, name, message}`. Both use PostgreSQL 15 with DDL auto-update (no Flyway migrations in this domain — it is intentionally simple).

**Native image:** `app-three-native` is compiled with GraalVM. The `Dockerfile.native` uses a multi-stage build with the Mandrel builder image. Native images start in milliseconds but take several minutes to build.
