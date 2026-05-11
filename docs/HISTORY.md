# Project History: traefik-microstack

A running narrative of how this project evolved — major milestones, technology choices, and the progression toward local-LLM self-sufficiency.

---

## Origins

**Project start**: Traefik load-balancer demo for YouTube content creation. Started as `traefik-lb`, later renamed to `traefik-microstack`.

**Core premise**: Show a realistic production-like stack — Traefik edge proxy, Java backends (Spring Boot + Quarkus), Angular micro-frontends — fully containerized with TLS, build mirrors, and dev/prod parity.

**Name history**: Started as `traefik-lb` → `CoreFinance` / `BDK` (fictional bank brand for demo data) → `traefik-microstack` (2026-04-03, commits 2823a21, 964eb66). The BDK branding was purely cosmetic for YouTube demo purposes; removing it made the project more neutral and shareable.

---

## Architectural Milestones

### Phase 1: Core infrastructure

- Traefik v2.11 as edge proxy with self-signed TLS (wildcard cert for `*.my.localhost`)
- Docker socket proxy (`tecnativa/docker-socket-proxy`) isolating Traefik from the Docker daemon
- Build mirrors: Reposilite (Maven, `:8008`) + Verdaccio (npm, `:4873`) for offline/reproducible builds
- Two-phase boot: mirrors up before app image builds
- `make up` as the single entry point; no direct `docker compose up` in domain sub-files

### Phase 2: Multi-service routing

- Greeting domain: `app-one` (Spring), `app-two` (Spring), `app-three` (Quarkus)
- `app-one` has no storage — it proxies calls to `app-two` via `https://gateway` (not direct container-to-container)
- Load balancing smoke test: `whoami` replicas with a curl sidecar polling every 10s
- Forward-devcontainer pattern: socat containers at elevated priority for live Angular dev without rebuilding

### Phase 3: Partner domain + Elasticsearch

- `app-spring-partner` + `app-quarkus-partner` sharing a `postgres-partner` instance
- Each backend has its own Elasticsearch instance (`elasticsearch-spring-partner`, `elasticsearch-quarkus-partner`)
- Partner Angular MFE at `partner/frontend/`
- Known bug: Quarkus partner returns 404 for `/api/partner/search` (path template conflict in `@Path` annotation). Workaround: Spring-partner at priority 1001, Quarkus at 1000. See ADR-0002.

### Phase 4: Domain-first monorepo restructure (2026-04)

- Old monolithic `frontend/` workspace split into independent Angular workspaces
- Each domain (`partner/`, `platform/`) is a top-level directory
- Shared library published to Verdaccio and consumed as `@traefik-microstack/shared`
- Docker builds now use `/src` WORKDIR with `projects/<domain>/` layout inside the container
- See ADR-0001 for full details

### Phase 5: Agent ecosystem + institutional memory (2026-04-08)

- Nine specialist Claude Code agents under `.claude/agents/`
- Each agent has persistent memory under `.claude/agent-memory/<name>/`
- CLAUDE.md restructured to compact axioms format (commit 8cdc1ec)
- Axioms blocks added to all agent definitions (commit 9ac868c)
- Session-observer memory bootstrap (this session)
- `docs/` directory created with ADRs, session summaries, patterns

### Phase 6: Infrastructure consolidation + workflow compression (2026-04-15 to 2026-04-16)

- `implement-ticket` promoted from skill to sub-agent (ADR-0007) — isolates 5–6 subagent spawns from main context window
- `implement-ticket.md` compressed by 29% (prose → bullet tables) without behavioral change
- Shared Postgres and Elasticsearch containers for partner domain (PARTNER-ES-018): `elasticsearch-partner` replaces two separate ES instances
- Token-usage instrumentation: `write-ticket-tokens.sh` fire on `SubagentStop`, writes inline `## Token usage` section in ticket `.md` (ADR-0008)
- `load-partners.sh` fixed: targeted DELETE preserves Flyway seed rows; ES container name corrected after PARTNER-ES-018 rename (ADR-0009)
- PARTNER-FW-007 implemented: streaming quad-search via `combineLatest` + `startWith(null)`, four labeled ms badges, Quarkus resilience fallback

### Phase 7: Partner domain split + bounded-context enforcement (2026-04-22)

- `partner/` monolith split into two top-level domains: `partner-search/` and `partner-edit/`
- `partner-edit` owns `postgres-partner-edit`; `partner-search` connects read-only to ES only
- Cross-domain DB read pattern eliminated: `partner-edit` pushes full 13-field `PartnerIndexRequest` payload to `partner-search`'s index endpoint (ADR-0013)
- OpenAPI-generated `PartnerDto` (50+ fields, nested arrays) replaced with hand-crafted flat `PartnerEditDto` (13 fields) in partner-edit Angular app (PARTNER-EDIT-005)
- Root cause of original silent UI failure documented: GET/PUT both used wrong DTO shape — no exceptions, just blank UI and no-op saves
- Angular tab structure pruned: 6 empty/stub tabs removed; only Address + Gruppe tabs remain
- Disk exhaustion incident resolved: `docker volume prune -f` freed ~35 GB; pattern documented as local-LLM-safe recovery step

---

## Technology Choices

### Why Traefik v2 (not v3, not nginx)
Traefik v2 has stable Docker label syntax that is unchanged from the initial design. Upgrading to v3 would require label syntax changes across all compose files — deferred until there is a compelling feature need.

### Why native-federation (not Webpack Module Federation)
`@angular-architects/native-federation` uses ES module federation (browser-native), not Webpack bundles. Better alignment with modern Angular standalone components and signals. All four apps use identical shared/skip/features blocks — see `angular-federation-expert` memory.

### Why Spring AND Quarkus
Demonstrating that Traefik routes to either JVM framework transparently. The quarkus-partner 404 bug was discovered during this work — documented in ADR-0002 rather than fixed at the framework level (the workaround is simpler and more instructive for the demo).

### Why self-signed TLS everywhere
All backends serve HTTPS on port 443; Traefik uses `insecureSkipVerify: true` globally. The cert chain is self-signed for `*.my.localhost`. `https://gateway` is the internal hostname for service-to-service calls.

---

## Claude Code Usage Evolution

### Early sessions
Frontier model (Claude Opus/Sonnet) used for every task — architecture design, debugging, config authoring. High token cost per session due to repeated context loading of the same files.

### Agent ecosystem introduction
Specialist agents reduce prompt size by pre-loading domain knowledge. Each agent knows its axioms and patterns without requiring inline context in prompts.

### Memory system activation (2026-04-08)
Session-observer agent begins capturing decisions, patterns, and session summaries. Goal: shift mechanical tasks (label authoring, healthcheck patterns, commit grouping) to local LLMs, reserving frontier models for novel problems.

### Workflow compression phase (2026-04-15 to 2026-04-16)
`implement-ticket` restructured as a sub-agent to prevent main-window token accumulation. Agent definition compressed 29%. Token instrumentation added — PARTNER-FW-007 cost 5.67M total input tokens (5.5M cache read) for a 1-session frontend ticket. The concurrent-signal race fix required frontier reasoning; the streaming pattern itself is now documented and local-LLM-safe for future similar work.

### Target state
Most day-to-day tasks (add service, update routing, add Flyway migration, fix Angular import) handled by local LLM using agent memories as context. Frontier model reserved for new architectural decisions and unfamiliar debugging.
