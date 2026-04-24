# ADR-0001: Domain-First Monorepo Restructure

**Date**: 2026-04-03  
**Status**: Accepted  
**Session context**: Renaming and restructuring sessions following project rename from CoreFinance/BDK to traefik-microstack

## Context

The original Angular workspace at `frontend/` contained all four apps (`shell`, `partner`, `ekf`, `loans`) as projects under `frontend/projects/`. This monolithic workspace layout meant:

- All four apps shared one `package.json`, `node_modules`, and `angular.json`
- Docker builds had to copy the entire frontend workspace even for a single domain change
- Domain backends (`partner/spring/`, `partner/quarkus/`) had no structural co-location with their frontend counterpart
- Shared library (`platform/shared/`) was nested inside the `frontend/` workspace, making it difficult to reference from outside

## Decision

Restructure to a domain-first layout where each domain is a top-level directory containing its backend(s), frontend, and Docker config:

- `platform/` — shell Angular app + shared library (`@traefik-microstack/shared`)
- `partner/frontend/` — partner Angular remote
- `loans/frontend/` — loans Angular remote
- `ekf/frontend/` — ekf Angular remote

Each frontend directory is an independent Angular workspace. The shared library is published to the local npm mirror (Verdaccio at `:4873`) and consumed via `@traefik-microstack/shared`.

## Consequences

**Easier:**
- Domain-scoped Docker builds — only copy relevant files
- Co-location of frontend and backend within a domain
- Independent versioning of each remote
- Clearer ownership boundaries

**Harder:**
- Docker builds require path rewriting for Angular workspace layout (`projects/<domain>/` layout inside Docker, but flat layout on disk)
- `federation.config.js` exposes paths must be rewritten by `sed` in Dockerfile (source paths differ from Docker context paths)
- `tsconfig.app.json` `extends` path changes inside Docker context (`../../tsconfig.json` instead of `./tsconfig.json`)
- Shared library publish step required before domain app builds (`make up` two-phase boot)
- `angular-federation-expert` MEMORY.md had stale references to old `frontend/projects/` paths — must be verified

## Token efficiency note

This decision is fully documented in `angular-build-fixer` agent memory (`docker-workspace-layout.md`). Future sessions adding a new domain frontend can follow the recipe without re-deriving the tsconfig/federation.config path gymnastics. Saves approximately 2–3 debugging cycles of ~500 tokens each per new domain addition.
