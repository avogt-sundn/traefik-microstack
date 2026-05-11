# ADR-0014: Competing Alternatives Pattern (CLAUDE-13)

**Date**: 2026-04-24
**Status**: Accepted
**Relates to**: ADR-0002 (Traefik priority routing), CLAUDE-12 (identifier convention)

## Context

Two domains already demonstrate multiple technology implementations behind the same domain boundary:

- **partner-search**: Spring Boot and Quarkus backends implement the same search API; the frontend fires all four `(framework × engine)` combinations in parallel and presents a comparison UI.
- **greeting**: Spring WebFlux, Spring MVC, and Quarkus implement the same greeting CRUD API under legacy names (`app-one`, `app-two`, `app-three`).

The forward-container dev-mode pattern (`forward-api-spring-partner-search` overriding `app-spring-partner-search` at higher Traefik priority) is structurally identical to competing alternatives — same path, different implementation, priority-based selection.

No axiom governed this pattern. As alternatives grow beyond Java frameworks (languages, search technologies, schema models, frontend frameworks, A/B testing), consistent naming and routing rules are needed.

**Naming problem**: existing services use `{A}-{D}` ordering (e.g. `app-spring-partner-search`), but domain is the higher-order grouping and should come first.

## Decision

Establish CLAUDE-13 in `CLAUDE.md`:

1. **`{D}` always precedes `{A}`** in every identifier — `app-{D}-{A}`, `forward-api-{D}-{A}`, `/api/{D}/{A}`. Domain is the primary namespace.

2. **All alternatives run simultaneously.** No Compose profiles, no env-var toggles. Each alternative is a first-class Compose service with its own image, labels, and healthcheck, sharing the same data sources.

3. **Distinct path prefixes at equal Traefik priority.** Each alternative owns a non-overlapping `PathPrefix`. Equal priorities are safe (ADR-0002). Backends at 1000, frontends at 120.

4. **Forward containers are the dev-mode alternative.** `forward-api-{D}-{A}` runs at priority 1100, overrides the packaged alternative when the local dev server is reachable, falls back automatically via healthcheck failure. Each packaged alternative gets exactly one forward container.

5. **Alternative dimension taxonomy.** `{A}` is a short lowercase slug (framework, language, search tech, schema model, frontend framework). Search technology is a sub-endpoint of a framework alternative, not a separate Compose service.

6. **Two first-class frontend presentation modes:**
   - *Comparison*: fire all alternatives in parallel, user toggles freely.
   - *A/B testing*: system assigns one alternative per user/session; each alternative must be independently addressable; mechanism is domain-level.

7. **CLAUDE-12 updated.** Framework-specific rows (`app-spring-{D}`, `app-quarkus-{D}`) replaced with the generalized `app-{D}-{A}` pattern. Existing services using old ordering are marked legacy.

## Consequences

**Easier:**
- New alternatives (new language, new framework) have unambiguous naming without case-by-case decisions.
- Domain grouping in `docker ps` and Traefik dashboard output is natural — all `app-partner-search-*` services appear together.
- Forward containers follow the same `{D}-{A}` pattern, reinforcing the single mental model.
- A/B testing is architecturally possible from day one of any new domain.

**Harder:**
- All existing services using `{A}-{D}` ordering (`app-spring-partner-search`, `app-quarkus-partner-search`, `forward-api-spring-*`, etc.) are legacy and must be renamed. Rename is deferred — one ticket per domain.
- CLAUDE-12 table is now more abstract (uses `{A}` variable). Concrete examples in each row keep it scannable.
