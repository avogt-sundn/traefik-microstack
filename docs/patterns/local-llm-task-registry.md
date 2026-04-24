# Local LLM Task Registry

Tasks confirmed safe to delegate to a local model (Gemma4, GPT-OSS, or equivalent).

Each entry includes: what the task is, where the template/reference lives, and why a local model can handle it without frontier reasoning.

---

## Traefik

### Add or update Traefik Docker labels on an existing service

**Reference**: ADR-0002, `.claude/agents/traefik-routing-expert.md` axioms block
**Why safe**: Priority table and label template are fully documented. Task is pure pattern-following with no routing logic decisions.

---

## Compose

### Add a new include entry and healthcheck to docker-compose.yaml

**Reference**: `.claude/agents/docker-compose-architect.md` axioms block, `partner/docker-compose.yaml` as template
**Why safe**: Healthcheck patterns are standardized; include list is alphabetical by convention.

---

## Angular

### Add a federation remote config for a new micro-frontend

**Reference**: `.claude/agents/angular-federation-expert.md`, `partner/frontend/federation.config.js` as template
**Why safe**: Config is structurally identical across all four remotes (partner, ekf, loans, platform). Only names and ports differ.

### Generate a new Flyway migration file for the partner domain

**Reference**: `partner/app-spring-partner/src/main/resources/db/migration/` versioning convention
**Why safe**: File naming (`V<n>__<description>.sql`) and SQL pattern are fully established.

---

## Git

### Group and commit changed files following project conventions

**Reference**: `.claude/agents/git-commit-master.md`
**Why safe**: Commit grouping rules and message format are documented in the agent file.

---

## Documentation / Axiom Auditing

### Run `make axioms` and report which axioms exist

**Reference**: `CLAUDE.md` Knowledge map section, `Makefile` axioms target
**Why safe**: Fully mechanical — the target walks files, extracts blocks, and numbers bullets. No reasoning required.
Output: one line per axiom in the form `<ABBREV>-<N>: <text>`.

### Check whether a proposed change references or violates a named axiom ID

**Reference**: `make axioms` output
**Why safe**: Local model can match a plain-English description against the printed axiom text. Run `make axioms` to get the current list, then ask the model to identify conflicts.

### Update a DOMAIN.md with a new component description

**Reference**: Any existing `DOMAIN.md` as template; axiom CLAUDE-9 ("each domain documents itself")
**Why safe**: Format is established and descriptive. No cross-domain reasoning required.
