# Quarkus Advantages for the Partner Search Service

The project already runs a Quarkus service (`java-three`, Quarkus 3.32.1, Java 21) with the
full TLS/Traefik/PostgreSQL stack including a native image variant. That proves the entire
infrastructure is compatible. The partner search use case has specific characteristics that make
Quarkus particularly well-suited compared to Spring Boot.

---

## 1. Native Image via GraalVM / Mandrel

The completion endpoint fires on every debounced keystroke — potentially dozens of requests per
second per user. A native binary starts in **< 50 ms** and uses **~50 MB RSS** vs **> 300 ms**
and **~250 MB** for a JVM Spring Boot service. In a containerised environment with restarts or
scale-to-zero, this gap is felt immediately on every cold start.

`java-three` already provides both `Dockerfile` (JVM) and `Dockerfile.native` (Mandrel/GraalVM)
as working templates. The partner service inherits this split for free, yielding three runnable
variants: Spring Boot JVM, Quarkus JVM, Quarkus Native.

---

## 2. RESTEasy Reactive (Non-Blocking I/O)

Completion requests are short-lived PostgreSQL reads. RESTEasy Reactive handles them on a small
event-loop thread pool rather than blocking a thread per request. When multiple users type
simultaneously, the Quarkus service handles far more concurrent completions with the same memory
footprint — a direct consequence of the non-blocking I/O model built into the framework from the
start, not bolted on.

---

## 3. Hibernate ORM Panache — Less Query Boilerplate

Spring Data JPA requires a `Specification<Partner>` hierarchy for dynamic queries: a predicate
class, a repository interface extending `JpaSpecificationExecutor`, and wiring code. Panache
collapses this to a single readable expression:

```java
// Quarkus Panache
Partner.find("lower(city) LIKE lower(?1)", prefix + "%").page(0, limit).list();

// Spring Boot Specification equivalent
criteriaBuilder.like(
    criteriaBuilder.lower(root.get("city")),
    prefix.toLowerCase() + "%"
);
```

Every completion query in the service is a one-liner. The full dynamic search query is built
from a `Map<String, Object>` of active criteria rather than a composed `Specification` chain.

---

## 4. SmallRye OpenAPI — Spec Generated from Code

`quarkus-smallrye-openapi` derives a live OpenAPI 3.1 spec from JAX-RS annotations at build
time and serves it at `/q/openapi`. The spec is always in sync with the implementation because
it *is* the implementation — there is no separately maintained YAML file to drift.

This directly resolves **gap G8** from the migration plan (OpenAPI spec file location
unidentified). The canonical contract file `openapi/partner-search-api.yaml` is bootstrapped
from the Quarkus-generated spec on first run and thereafter used as the validation target in CI
for both backends.

---

## 5. Build-Time Classpath Scanning

Quarkus moves reflection registration, classpath scanning, and proxy generation from runtime to
build time. The result: no warm-up period before the first real request. A search or completion
call issued immediately after container start receives the same response time as the thousandth
call. Spring Boot performs this work lazily on first use, introducing a noticeable latency spike
on cold starts that is invisible in benchmarks but visible to the first user after a deployment.

---

## 6. Dev Mode — Live Reload Without Restart

```bash
./mvnw quarkus:dev
```

File saves trigger incremental recompilation and hot-swap within milliseconds. No JVM restart,
no container rebuild. Iterating on classifier rules, completion SQL, or tokenizer logic has a
sub-second feedback loop. Spring Boot DevTools is faster than a full restart but still performs
a full context reload — measurably slower for a service with multiple beans and a datasource.

---

## 7. Smaller Docker Images

| Variant | Base image | Approximate size |
|---|---|---|
| Spring Boot JVM | `eclipse-temurin:25-jre-alpine` + fat JAR | ~220 MB |
| Quarkus JVM | `eclipse-temurin:21-jre-alpine` + uber-jar | ~180 MB |
| Quarkus Native | `ubi9-quarkus-micro-image` + binary | ~60 MB |

The native image runs on a minimal UBI micro base with no JVM present. Smaller images mean
faster pulls in CI, lower registry storage costs, and a reduced attack surface.

---

## 8. MicroProfile Config — Profile-Aware Properties

`application.properties` supports `%dev.`, `%test.`, and `%prod.` prefixes for profile-specific
values in a single file:

```properties
# shared
quarkus.datasource.username=postgres

# dev overrides (local machine)
%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/app-partner-db

# test overrides (CI)
%test.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5433/app-partner-test-db
```

Spring Boot requires separate `application-dev.properties` files or YAML profiles. The
MicroProfile approach keeps all configuration co-located and avoids profile activation
surprises.

---

## 9. Quarkus Dev Services — Zero-Config Test Database

`@QuarkusTest` detects that no datasource is configured in the test environment and
automatically starts a PostgreSQL container (via Testcontainers under the hood) for the
duration of the test run. No `@Testcontainers` annotation, no `@Container` field, no lifecycle
management code required.

This resolves the Testcontainers setup effort called out in the gap analysis: the Spring Boot
implementation requires explicit Testcontainers wiring; the Quarkus implementation gets it for
free.

---

## 10. Existing Infrastructure Proof

`java-three` already demonstrates every infrastructure integration needed by the partner
service:

| Infrastructure concern | Proven by java-three |
|---|---|
| TLS on port 443 via `quarkus.tls.*` | `application.properties` lines 9–11 |
| HTTPS-only (`insecure-requests=disabled`) | `application.properties` line 12 |
| PostgreSQL via `quarkus-jdbc-postgresql` | `pom.xml` + datasource config |
| Traefik health check at `/q/health` | `docker-compose.yaml` healthcheck |
| Traefik labels + `PathPrefix` routing | `docker-compose.yaml` labels |
| Native image with Mandrel builder | `Dockerfile.native` |
| Maven mirror via `settings.xml` in Dockerfile | Both `Dockerfile` variants |
| JVM uber-jar packaging | `quarkus.package.jar.type=uber-jar` |

No new infrastructure patterns are needed. The Quarkus partner service is a structural copy of
`java-three` with the partner domain logic added.
