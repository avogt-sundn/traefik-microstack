# AI Efficiency Tips for traefik-microstack

Running tips for minimizing token cost and AI processing time in this repo.

---

## Reading Strategy

### Read axioms first, full agent file second

Every `.claude/agents/*.md` file starts with `## Axioms` — typically 8–14 lines covering the non-negotiable rules. For simple validation questions ("is this approach allowed?"), read only the axioms block. If the answer is there, you're done. Full agent files are 200+ lines.

### CLAUDE.md is the cross-cutting reference

CLAUDE.md is ~40 lines. It covers: seven axioms, stack commands, compose include table. Read it before fetching any domain file when the question is cross-cutting (networking, boot order, TLS, routing direction).

### Root docker-compose.yaml is trivial

The root `docker-compose.yaml` is 18 lines of `include:` entries and the external network declaration. You can inline its content from memory rather than fetching it:

```yaml
networks:
  default:
    name: docker-default-network
    external: true
include: [traefik, build-services, greeting, partner, loans, ekf, platform, loadbalancing, tests]
# root also declares a build-only `forward` service (deploy.replicas: 0) that builds forward:latest
```

---

## Task Routing

### Use the right agent

| Task | Agent |
|---|---|
| Add/fix Traefik labels | `traefik-routing-expert` |
| Add service to Compose | `docker-compose-architect` |
| Fix Angular TS/build error | `angular-build-fixer` |
| Federation config change | `angular-federation-expert` |
| TLS cert issue | `tls-security-engineer` |
| Playwright test | `e2e-test-engineer` |
| Git commit | `git-commit-master` |
| Session wrap-up / ADR | `session-observer` |

Invoking the wrong agent causes the model to load the wrong memory context and re-derive known facts from scratch.

### Local LLM candidates

These tasks are fully documented and pattern-following — safe to delegate to a local model (Gemma4, GPT-OSS):

- Adding Traefik Docker labels (priority table in ADR-0002, label templates in traefik-routing-expert)
- Adding a Compose include entry + healthcheck (docker-compose-architect axioms)
- Flyway migration for partner domain (version pattern, SQL template)
- Angular federation config for a new remote (identical template across all four apps)
- Commit message + file grouping (git-commit-master memory)

---

## Axiom References

### Use axiom IDs instead of quoting axiom text

Every axiom in CLAUDE.md and all agent files has a unique identifier of the form `<ABBREV>-<N>` (e.g., `CLAUDE-4`, `TLS-3`, `DCA-7`). Run `make axioms` to see the current numbered list.

In prompts, commit messages, or ADRs, write `CLAUDE-4` instead of quoting the full rule ("Never route around Traefik — all service-to-service calls go through `https://gateway`..."). That saves ~20 tokens per citation.

**When IDs are stable**: IDs are positional — they shift if an axiom is inserted above them. Treat them as session-stable, not permanent. Run `make axioms` to verify before citing.

---

## Anti-patterns to Avoid

### Inlining file contents in prompts

Instead of pasting `traefik_conf.yml` into your prompt, write: "see `infrastructure/traefik/traefik_conf.yml` and `docs/decisions/ADR-0002`". The agent memory already contains the stable facts.

### Re-explaining the architecture

The architecture is in `docs/HISTORY.md` and agent memories. If you find yourself re-explaining "we have a Traefik proxy with docker-socket-proxy and two backends...", write a pointer to the doc instead.

### Asking the same debugging question twice

If you're debugging a routing issue that's been seen before (quarkus-partner 404, strip-prefix missing @docker suffix, wrong scheme for backend), check `traefik-routing-expert` memory and `e2e-test-engineer` known bugs section before starting a fresh diagnostic session.

---

## Prompts That Work Well

### Session bootstrap
```
Review the current session state and update the project memory. Check the git log, 
recent commits, and codebase state to capture any architectural decisions or patterns 
worth preserving.
```
No inline context needed. The agent reads the repo state itself.

### Adding a new service
```
Add a new domain service called <name> at path /api/<path>. 
It's a Spring Boot backend on HTTPS:443. Follow the existing partner domain 
as the template (see partner/docker-compose.yaml and ADR-0002 for priority).
```
One sentence of context replaces 50 lines of inline compose YAML.

### Fixing a routing issue
```
<service> is not reachable at https://gateway/api/<path>. 
Run the traefik-routing-expert diagnostic checklist.
```
The checklist is in the agent file — no need to paste it inline.
