# ADR-0002: Traefik Explicit Priority Routing System

**Date**: 2026-03-16  
**Updated**: 2026-04-15 (PARTNER-FW-001: distinct path prefixes per framework)
**Status**: Accepted  
**Session context**: Debugging partner search routing — quarkus-partner was receiving 100% of traffic instead of spring-partner

## Context

Two partner backends (`app-spring-partner`, `app-quarkus-partner`) both registered Traefik routes on `PathPrefix(/api/partner)`. Without explicit priorities, Traefik resolves ties by router name (alphabetical) — `app-quarkus-partner` won over `app-spring-partner`, directing 100% of traffic to the Quarkus backend.

The Quarkus backend had a known bug: `PartnerResource` at `@Path("/api/partner/{partnerNumber}")` matched `/api/partner/search` before `PartnerSearchResource`, returning 404 for all search requests.

## Decision

Establish an explicit priority table for all Traefik routes in the project:

| Range | Usage |
|---|---|
| 100 | Shell catch-all (`PathPrefix /`) |
| 101–119 | Forward containers for shell dev override |
| 120 | Frontend remotes (partner, ekf, loans) |
| 1000 | Production backend services |
| 1020 | Forward containers for frontend remote dev overrides |
| 1100+ | Forward containers for backend dev overrides |

**Every router declaration must include an explicit `priority` label.** No implicit priority allowed.

## PARTNER-FW-001 update: per-framework path prefixes

With PARTNER-FW-001, each backend now owns a distinct path prefix:
- `app-spring-partner`: `PathPrefix('/api/partner/spring')` priority 1000
- `app-quarkus-partner`: `PathPrefix('/api/partner/quarkus')` priority 1000

**The priority differential (1001 vs 1000) between the two backends is no longer needed.** Equal priorities are safe because distinct prefixes eliminate the routing race — each backend only receives traffic under its own namespace. Traefik's tie-breaking rule cannot produce a wrong winner because the rules never overlap.

**The shadow bug is resolved.** With `PartnerResource` renamed to `@Path("/api/partner/quarkus/{partnerNumber}")`, it can only match Quarkus-namespaced traffic. The path `/api/partner/quarkus/search` cannot be matched by the `{partnerNumber}` wildcard because `PartnerSearchResource` at `/api/partner/quarkus/search` takes precedence within the Quarkus backend by specificity. The original workaround (Spring winning via higher priority) is obsolete.

## Consequences

**Easier:**
- Routing behavior is deterministic and auditable from label values alone
- Forward-devcontainer pattern exploits priority cleanly: dev containers at +100 above production
- Both backends run simultaneously without profile flags — Quarkus is no longer opt-in
- Priority conflicts are visible in code review

**Harder:**
- Adding a new service requires choosing a priority value intentionally
- Priority table must be kept consistent across all compose files (no central registry)
