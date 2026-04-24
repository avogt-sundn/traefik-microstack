# Greeting Domain

## Purpose

A framework comparison exercise: the same simple CRUD use-case (`Greeting`) implemented across Spring Boot and Quarkus, exposed behind Traefik to demonstrate load balancing, internal routing, and TLS-everywhere patterns.

## Bounded Context

Stores and retrieves greeting records (`{id, name, message}`). No business logic beyond that — the domain exists to compare runtime behavior, startup time, and memory footprint across frameworks.

## Services

| Service | Framework | Route | Notes |
|---|---|---|---|
| `app-one` | Spring Boot (WebFlux) | `/api/one` | Forwarding proxy — delegates to `app-two` via `https://gateway` |
| `app-two` | Spring Boot (MVC + JPA) | `/api/two` | Canonical storage backend, Spring Security (`@RolesAllowed("USER")`) |
| `app-three` | Quarkus (RESTEasy Reactive + Panache) | `/api/three` | JVM and GraalVM native variants, identical API to app-two |

Each service has its own dedicated PostgreSQL 15 instance (database-per-service pattern).

## API Shape

All three services expose the same contract under their respective prefix:

```
GET  /api/<n>/hello       → "Hello, World!"  (no auth)
POST /api/<n>/greet       → body: name (text/plain) → { id, name, message }
GET  /api/<n>/greetings   → [ { id, name, message }, ... ]
```

app-two and app-three require role `USER` on write/read endpoints.

## Key Architectural Decisions

- **Proxy-via-gateway**: app-one does not call app-two by container name. It routes through `https://gateway`, demonstrating the "never call containers directly" axiom.
- **TLS on all backends**: Every service runs HTTPS internally (port 8443/8444/443). Traefik uses `scheme=https` on the load balancer.
- **Native image**: app-three ships both a JVM Dockerfile and a `Dockerfile.native` (GraalVM), selectable via Compose service `app-three-native`. Native starts in ~0.1–0.3s at ~30–40 MB RAM.
- **Schema management**: `ddl-auto=update` (Spring) / Panache equivalent (Quarkus) — no Flyway here, kept simple intentionally.
