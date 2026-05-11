# traefik-microstack

Local load-balancer and micro-frontend demo: **Traefik** edge proxy → Java backends + Angular Native Federation SPA. Fully containerised, TLS everywhere.

**Abhandlungen (design treatises):** https://avogt-sundn.github.io/traefik-microstack/abhandlungen/

---

## Repository Layout

| Folder | Description |
|---|---|
| [greeting/](greeting/) | Framework comparison: same `Greeting` CRUD in Spring Boot, Quarkus, and a routing proxy. See [greeting/DOMAIN.md](greeting/DOMAIN.md). |
| [partner-search/](partner-search/) | Read-side partner search — Spring + Quarkus backends, Elasticsearch, Angular remote. See [partner-search/DOMAIN.md](partner-search/DOMAIN.md). |
| [partner-edit/](partner-edit/) | Write-side partner master data — Spring backend, Angular remote, owns the Postgres instance. See [partner-edit/DOMAIN.md](partner-edit/DOMAIN.md). |
| [platform/](platform/) | Angular shell (host app) + shared UI library (`@traefik-microstack/shared`). Single SPA entry point — loads remotes via Native Federation. See [platform/DOMAIN.md](platform/DOMAIN.md). |
| [ux/](ux/) | UX design system: foundations, pattern catalogue, screen specs, Preact prototype, Storybook. See [ux/DOMAIN.md](ux/DOMAIN.md). |
| [abhandlungen/](abhandlungen/) | Standalone German-language design treatises (HTML, printer-friendly). Published at the Pages URL above. |
| [infrastructure/traefik/](infrastructure/traefik/) | Traefik gateway + standby, docker-socket-proxy, TLS cert tooling. |
| [infrastructure/build-services/](infrastructure/build-services/) | Maven mirror (Reposilite :8008) + npm mirror (Verdaccio :4873). |
| [infrastructure/forward-devcontainer/](infrastructure/forward-devcontainer/) | `forward:latest` socat image — used by dev-override containers in each domain. |
| [loadbalancing/](loadbalancing/) | whoami replicas + smoke test for Traefik load-balancing verification. |
| [tests/](tests/) | End-to-end Playwright container (blackbox, runs against the live stack). |
| [lab/](lab/) | Isolated experiments — browser-LLM, BigInt vs UUID, etc. Published at https://github.com/avogt-sundn/lab. |
| [docs/](docs/) | ADRs, patterns, session logs. |

---

## Quick Start

```bash
make up      # create network, start mirrors, build & start all services
make down    # stop all
```

Or with plain Compose:

```bash
docker compose up --build -d
docker compose down
```

---

## Architecture

**Single SPA, single origin.** The entire frontend is served under one hostname via Traefik. Angular remotes load at runtime via Native Federation — no build-time coupling between shell and remotes. All backend API calls use domain-relative URLs (`/api/partner-search/`, `/api/partner-edit/`, etc.) — no environment profiles, no `environment.ts` variants.

**Domain = team boundary.** Each domain lives in a top-level folder with its own `docker-compose.yaml`, `DOMAIN.md`, frontend, and backend(s). A new team adds one folder, one line in the root `include:`, and one entry in the shell's federation manifest.

**Extension points (three, no more):**

| Point | File |
|---|---|
| Remote registration | `platform/shell/src/environments/federation.manifest.json` |
| Shell route | `platform/shell/src/app/components/pages/main/main.routes.ts` |
| Compose inclusion | `docker-compose.yaml` `include:` block |

---

## TLS

Run once to create local self-signed certs:

```bash
cd infrastructure/traefik
./generate-selfsigned-cert.sh
```

---

## Dev Workflow

```bash
make rebuild SERVICE=<name>   # rebuild image + restart (runs Flyway)
make restart SERVICE=<name>   # restart without rebuild
make log     SERVICE=<name>   # follow logs
```

Forward containers enable live dev against the running stack without rebuilding images — see each domain's `DOMAIN.md` for dev port assignments.

---

## Docs

- Domain context: `<domain>/DOMAIN.md` in each folder
- ADRs and patterns: [docs/decisions/](docs/decisions/), [docs/patterns/](docs/patterns/)
- UX foundations: [ux/foundations/](ux/foundations/)
- Design treatises (DE): https://avogt-sundn.github.io/traefik-microstack/abhandlungen/

---

## Claude Code

```bash
aws sso login --profile bedrock-dev
./start-claude.sh
```

AWS SSO setup (once):

```bash
aws configure sso
# SSO start URL: https://d-???.awsapps.com/start
# SSO region: eu-central-1
# Profile name: bedrock-dev
```
