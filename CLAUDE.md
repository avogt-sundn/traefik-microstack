# CLAUDE.md

Local dev load-balancer demo: **Traefik** edge proxy → Java backends + Angular micro-frontend. Fully containerized, TLS everywhere.

---

## Axioms

Cross-cutting rules that apply to every agent and every change. Domain-specific axioms live in the relevant agent files.

- **[CLAUDE-1] Convention over configuration.** Routing, naming, ports, and labels are codified conventions. Deviation requires explicit justification.
- **[CLAUDE-2] No profiles. No dev-only config.** The same immutable image runs on every stage. `environment.ts` is the one config file — never create stage-specific variants.
- **[CLAUDE-3] Dev/prod parity is non-negotiable.** The Compose topology in dev is structurally identical to production.
- **[CLAUDE-4] Never route around Traefik.** All service-to-service calls go through `https://gateway`. Direct container-to-container calls bypass load balancing and routing controls.
- **[CLAUDE-5] Never run code on the host.** All services, tests, and builds run inside containers.
- **[CLAUDE-6] Always use the root `docker-compose.yaml`.** Running a sub-file directly creates a separate Compose project (`spring-partner-*` instead of `traefik-microstack-*`), producing duplicate containers invisible to Traefik.
- **[CLAUDE-7] One domain, one SPA.** The entire application is served under a single hostname — determined by the edge proxy binding, not hardcoded. All frontend micro-apps compose into that single origin.
- **[CLAUDE-8] Domain == team boundary.** Each business domain lives in a top-level folder and is self-contained enough to be extracted into its own repository. Angular frontends and their backing REST services are co-located per domain.
- **[CLAUDE-9] Each domain documents itself.** Every domain folder contains a `DOMAIN.md` describing its purpose, bounded context, and key components. This file is the authoritative description of what that domain does and why it exists.
- **[CLAUDE-10] Optimize for clarity and brevity.** All markdown and source code must minimize tokens and time-to-read. No padding, no redundancy, no filler.
- **[CLAUDE-11] Locality and hierarchy.** Every line of text — documentation or code — lives as close as possible to its point of use. Separation of concerns in a strict hierarchy is the foundation of this knowledge base.
- **[CLAUDE-12] Domain identifier convention.** The domain folder name `{D}` (e.g. `partner-edit`) is the master identifier. Every derived identifier follows the table below. **Within a domain's own code and config, the `{D}` prefix is omitted when the context already establishes the domain** — e.g. a class inside `com.example.partneredit` is named `PartnerController`, not `PartnerEditController`; an Angular service inside the `partner-edit` remote is `EditService`, not `PartnerEditService`; an internal route is `/view/:id`, not `/partner-edit/view/:id`. No synonyms, no abbreviations, no deviation without explicit justification.

  **Global identifiers** (cross-domain namespace — always include `{D}`)

  | Identifier | Pattern | Example `{D}=partner-edit` |
  |---|---|---|
  | Compose service — Spring backend | `app-spring-{D}` | `app-spring-partner-edit` |
  | Compose service — Quarkus backend | `app-quarkus-{D}` | `app-quarkus-partner-edit` |
  | Compose service — single-framework backend | `app-{D}` | `app-partner-edit` |
  | Compose service — Nginx frontend | `{D}` | `partner-edit` |
  | Compose service — PostgreSQL | `postgres-{D}` | `postgres-partner-edit` |
  | Compose service — Elasticsearch | `elasticsearch-{D}` | `elasticsearch-partner-edit` |
  | Compose service — forward API (Spring) | `forward-api-spring-{D}` | `forward-api-spring-partner-edit` |
  | Compose service — forward API (Quarkus) | `forward-api-quarkus-{D}` | `forward-api-quarkus-partner-edit` |
  | Compose service — forward NG | `forward-ng-{D}` | `forward-ng-partner-edit` |
  | Docker image — Spring | `app-spring-{D}` | `app-spring-partner-edit` |
  | Docker image — Quarkus | `app-quarkus-{D}.jvm` / `.native` | `app-quarkus-partner-edit.jvm` |
  | Docker image — frontend | `{D}` | `partner-edit` |
  | Traefik router / service name | same as Compose service name | `app-spring-partner-edit` |
  | Traefik middleware — frontend strip | `{D}-strip` | `partner-edit-strip` |
  | Traefik middleware — forward-ng strip | `forward-ng-{D}-strip` | `forward-ng-partner-edit-strip` |
  | Public API path — multi-framework | `/api/{D}/{framework}` | `/api/partner-edit/spring` |
  | Public API path — single backend | `/api/{D}` | `/api/partner-edit` |
  | Public frontend path | `/{D}` | `/partner-edit` |
  | Angular federation name (manifest key) | `{D}` | `partner-edit` |
  | Angular dev port | next free in sequence: shell=4200, partner-search=4202, ekf=4203, partner-edit=4204 | 4204 |
  | PostgreSQL DB name | `app-{D}-db` | `app-partner-edit-db` |
  | Compose volume — Postgres | `pg-{D}-data` | `pg-partner-edit-data` |
  | Compose volume — Elasticsearch | `es-{D}-data` | `es-partner-edit-data` |

  **Domain-local identifiers** (inside the domain's own code/config — prefix omitted)

  | Identifier | Pattern | Example `{D}=partner-edit` |
  |---|---|---|
  | Maven `artifactId` | `spring-{D}-api` or `java-{D}-api` | `spring-partner-edit-api` |
  | Java root package | `com.example.{D-no-hyphens}` | `com.example.partneredit` |
  | Java class names within that package | short functional name, no `{D}` prefix | `PartnerController`, `EditRequest` |
  | Angular component/service names | short functional name, no `{D}` prefix | `EditService`, `DetailComponent` |
  | Internal Angular routes | functional path, no `{D}` prefix | `/view/:partnerId`, `/search` |
  | Spring `DB_HOST` env var default | `postgres-{D}` (cross-domain ref → full name) | `${DB_HOST:postgres-partner-edit}` |

---

## Knowledge map

Reading order — load from root down to the most specific scope:

```
CLAUDE.md                           [CLAUDE]  ← cross-cutting axioms (this file)
├── .claude/agents/
│   ├── angular-build-fixer.md      [ANGBLD]
│   ├── angular-federation-expert.md [ANGFED]
│   ├── devcontainer-integrator.md  [DEVC]
│   ├── developing-in-domain.md     [DID]
│   ├── docker-compose-architect.md [DCA]
│   ├── e2e-test-engineer.md        [E2E]
│   ├── git-commit-master.md        [GIT]
│   ├── implement-ticket.md         [IMPL]
│   ├── session-observer.md         [OBS]
│   ├── tls-security-engineer.md    [TLS]
│   └── traefik-routing-expert.md   [TRK]
└── <domain>/DOMAIN.md              ← domain context, descriptive
```

`make axioms` prints every axiom block with unique identifiers (e.g. `TLS-3`, `DCA-7`).

---

## Reading instructions

When answering any question that touches a specific domain (e.g. `greeting/`, `partner-search/`, `partner-edit/`, `loans/`, `ekf/`, `platform/`), **always read `<domain>/DOMAIN.md` before responding.** It contains context that is not derivable from the code alone.

---

## Commit Workflow

**All commits must go through the `git-commit-master` agent.** Never commit directly via Bash. This ensures:
- Atomic, logically grouped changes
- Pre-commit checks pass (compose validation, linting, builds)
- Meaningful commit messages explaining what and why
- Clean, bisectable history

**When you want to commit:**
- Say: *"commit these changes"*, *"time to commit"*, or *"prepare commits"*
- Claude will delegate to the git-commit-master agent
- The agent handles verification, grouping, and history

The agent reads `[GIT]` axioms in `.claude/agents/git-commit-master.md`.

---

## Stack commands

```bash
make up                          # create network, start mirrors, build & start all
make down                        # stop all
make rebuild SERVICE=<name>      # rebuild image + restart (runs Flyway)
make restart SERVICE=<name>      # restart without rebuild
docker compose build <name>      # build only
```

## Compose includes

| File | Contents |
|---|---|
| `infrastructure/traefik/` | Traefik gateway + standby + docker-socket-proxy |
| `infrastructure/build-services/` | Maven mirror (Reposilite :8008) + npm mirror (Verdaccio :4873) |
| `greeting/` | app-one/two/three + postgres instances + forward-api-one/two (dev override) |
| `partner-search/` | app-spring-partner-search, app-quarkus-partner-search, nginx frontend + elasticsearch-partner-search + forward-ng-partner-search, forward-api-spring-partner-search (dev override); Postgres owned by partner-edit |
| `partner-edit/` | app-spring-partner-edit, nginx frontend + postgres-partner-edit + forward-ng-partner-edit, forward-api-spring-partner-edit (dev override) |
| `loans/` | loans nginx frontend |
| `ekf/` | ekf nginx frontend + forward-ng-ekf (dev override) |
| `platform/` | shell nginx frontend (host app) + forward-ng-shell (dev override) |
| `loadbalancing/` | whoami replicas + smoke test |
| `tests/` | e2e test container |
| `lab/` | postgres-lab + one-shot proof runner containers |
