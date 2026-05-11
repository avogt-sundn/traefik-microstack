# CLAUDE.md

Local dev load-balancer demo: **Traefik** edge proxy → Java backends + Angular micro-frontend. Fully containerized, TLS everywhere.

---

## Axioms

Cross-cutting rules that apply to every agent and every change. Domain-specific axioms live in the relevant agent files.

- **[CLAUDE-1] Convention over configuration.** Routing, naming, ports, and labels are codified conventions. Deviation requires explicit justification.
- **[CLAUDE-2] Immutable builds.** The same image runs on every stage. `environment.ts` is the one config file — never create stage-specific variants. See also [CLAUDE-3].
- **[CLAUDE-3] Dev/prod parity is non-negotiable.** The Compose topology in dev is structurally identical to production. **Exception:** the dev badge rendered when `IS_DEV_BUILD = true` is a developer signal only; it is tree-shaken out of the production bundle by the `build-mode` file replacement. See also [CLAUDE-2].
- **[CLAUDE-4] Never route around Traefik.** All service-to-service calls go through `https://gateway`. Deny direct container-to-container calls since they bypass load balancing and routing controls.
- **[CLAUDE-5] Never run code on the host.** All services, tests, and builds run inside containers.
- **[CLAUDE-6] Always use the root `docker-compose.yaml`.** Running a sub-file directly creates a separate Compose project (`spring-partner-*` instead of `traefik-microstack-*`), producing duplicate containers invisible to Traefik.
- **[CLAUDE-7] One domain, one SPA.** The entire application is served under a single hostname — determined by the edge proxy binding, not hardcoded. All frontend micro-apps compose into that single origin.
- **[CLAUDE-8] Domain == team boundary.** Each business domain lives in a top-level folder and is self-contained enough to be extracted into its own repository. Angular frontends and their backing REST services are co-located per domain.
- **[CLAUDE-9] Each domain documents itself.** Every domain folder contains a `DOMAIN.md` describing its purpose, bounded context, and key components. This file is the authoritative description of what that domain does and why it exists.
- **[CLAUDE-10] Optimize for clarity and brevity.** All markdown and source code must minimize tokens and time-to-read. No padding, no redundancy, no filler.
- **[CLAUDE-11] Locality and hierarchy.** Every line of text — documentation or code — lives as close as possible to its point of use. Separation of concerns in a strict hierarchy is the foundation of this knowledge base.
- **[CLAUDE-12] Domain identifier convention.** The domain folder name `{D}` (e.g. `partner-edit`) is the master identifier. **Within a domain's own code and config, the `{D}` prefix is omitted when the context already establishes the domain** — e.g. a class inside `com.example.partneredit` is named `PartnerController`, not `PartnerEditController`. No synonyms, no abbreviations, no deviation without explicit justification. Full identifier tables → `[DID-8] § Naming Conventions`.

- **[CLAUDE-13] Competing alternatives run simultaneously.** Within a domain, multiple implementations of the same contract coexist behind distinct paths — no profiles, no mutual exclusion. Each alternative is a first-class Compose service sharing the same data sources. `{D}` always precedes `{A}` in every identifier. Alternative table and routing rules → `[DID-9] § Competing Alternatives`.

- **[CLAUDE-14] Ubiquitous language — German glossary terms are first-class code identifiers.** Code defaults to English. The exception: German business terms documented in a domain's `DOMAIN.md` `## Glossary` section are the *only* form allowed for that concept in that domain's code — never translate them to English. Example: `Kredit` (not `Credit`), `Verbund` (not `Group`), `Hauptanschrift` (not `MainAddress`). A German term in code that does not appear in the glossary is a violation. i18n translation files and OpenAPI-generated files are exempt — they contain display text or upstream-spec identifiers, not developer-chosen code identifiers.

- **[CLAUDE-15] Tickets and requirements may be written in German or English.** German-language tickets from method engineers and POs are legitimate input. Code snippets in acceptance criteria (file paths, class names, method signatures) use English except for glossary terms per CLAUDE-14. Commit messages and PR descriptions are English.

- **[CLAUDE-16] Folder closure.** When Claude Code is tasked with work scoped to a folder `F`: **(1) Write boundary** — all file creation, modification, and deletion is confined to `F` and its descendants; no side-effects in siblings, ancestors, or unrelated subtrees. **(2) Instruction scope** — Claude obeys `.md` guidance files in `F` and every ancestor up to the repository root — nothing else; sibling folders' rules do not apply. **(3) Self-governance** — a folder may define its own tooling, structure, and conventions via its `.md` files; these need not match the rest of the repository (e.g. `ux/` hosts a standalone prototype; `lab/` hosts isolated experiments). **(4) No override, no escape** — a descendant may never override or exempt itself from an ancestor's rules; if a conflict arises, the folder hierarchy must be restructured so that the dependency relationship is correctly expressed by the tree structure itself. **(5) Ordered siblings** — siblings within a folder may declare an explicit dependency sequence via numeric prefix (`01-foundations/`, `02-patterns/`, …) or via an explicit order declared in the parent's `DOMAIN.md`; a later sibling may read earlier siblings as input, but an earlier sibling may never read a later one; the write boundary is unchanged.

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
│   ├── methodology-advisor.md      [METH]
│   ├── session-observer.md         [OBS]
│   ├── tls-security-engineer.md    [TLS]
│   └── traefik-routing-expert.md   [TRK]
└── <domain>/DOMAIN.md              ← domain context, descriptive
```

`make axioms` prints every axiom block with unique identifiers (e.g. `TLS-3`, `DCA-7`).

---

## Reading instructions

When answering any question that touches a specific domain (e.g. `greeting/`, `partner-search/`, `partner-edit/`, `platform/`), **always read `<domain>/DOMAIN.md` before responding.** It contains context that is not derivable from the code alone.

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
| `platform/` | shell nginx frontend (host app) + forward-ng-shell (dev override) |
| `loadbalancing/` | whoami replicas + smoke test |
| `tests/` | e2e test container |
| `lab/` | postgres-lab + one-shot proof runner containers |
