# Traefik Microstack (traefik-microstack)

Concise guide to the repository: layout, how to run the stack, and where to find implementation details.

**Project Summary**
- **Purpose:** Local/dev load-balancer and orchestration setup using Traefik for a monorepo with Java backend services and an Angular micro-frontend SPA.
- **Scope:** `greeting`, `partner`, `loans`, `ekf`, `platform` domains plus `infrastructure` support services.

**Repository Layout**

| Domain / Folder | Description |
|---|---|
| [greeting/](greeting/) | Framework comparison: the same `Greeting` CRUD use-case in Spring Boot (`spring/`), Quarkus (`quarkus/`), and a routing proxy (`proxy/`). See [greeting/DOMAIN.md](greeting/DOMAIN.md). |
| [partner/](partner/) | Business partner registry with dual-engine search (PostgreSQL + Elasticsearch), Spring and Quarkus backends, and an Angular remote. See [partner/DOMAIN.md](partner/DOMAIN.md). |
| [platform/](platform/) | Angular shell (host app) and shared UI library. The single entry point for the entire SPA — loads `loans`, `partner`, and `ekf` remotes via Native Federation. See [platform/DOMAIN.md](platform/DOMAIN.md). |
| [loans/](loans/) | Loan contract search microfrontend (Native Federation remote). See [loans/DOMAIN.md](loans/DOMAIN.md). |
| [ekf/](ekf/) | EKF microfrontend scaffold — frontend-only domain, no backend. See [ekf/DOMAIN.md](ekf/DOMAIN.md). |
| [infrastructure/traefik/](infrastructure/traefik/) | Traefik gateway + standby, docker-socket-proxy, TLS cert tooling (`generate-selfsigned-cert.sh`, `traefik_conf.yml`). |
| [infrastructure/build-services/](infrastructure/build-services/) | Maven mirror (Reposilite :8008) + npm mirror (Verdaccio :4873). |
| [infrastructure/forward-devcontainer/](infrastructure/forward-devcontainer/) | socat image build context (`forward:latest`) — Dockerfile + forward.sh. The actual forward container services live in each domain's compose file. |
| [tests/](tests/) | End-to-end Playwright test container (blackbox, runs against the live stack). |

**Quick Start**

```bash
make up      # create network, start mirrors, build & start all services
make down    # stop all
```

Or with plain Compose (mirrors must already be running):

```bash
docker compose up --build -d
docker compose down
```

**Single SPA — no environment profiles needed**

The entire frontend is served as a single Angular SPA under one hostname. All backend API calls use **domain-relative URLs with a trailing slash** (e.g. `/api/partner/`, `/api/greeting/`), so the browser always targets the same origin that served the page. Traefik routes those paths to the correct backend regardless of environment — no `environment.ts` variants, no build-time API URL substitution, no profiles.

**Traefik & TLS**

Traefik configuration lives in [infrastructure/traefik/](infrastructure/traefik/). Run `generate-selfsigned-cert.sh` once to create local certs for HTTPS. The `docker-compose.yaml` there wires entrypoints, providers, and mounts the `certs/` folder.

```bash
cd infrastructure/traefik
./generate-selfsigned-cert.sh
```

**Docs & Where to Look**

- Each domain: `<domain>/DOMAIN.md` — authoritative description of purpose and bounded context.
- Traefik config: [infrastructure/traefik/traefik_conf.yml](infrastructure/traefik/traefik_conf.yml)
- Cert tooling: [infrastructure/traefik/generate-selfsigned-cert.sh](infrastructure/traefik/generate-selfsigned-cert.sh)
- ADRs and patterns: [docs/decisions/](docs/decisions/), [docs/patterns/](docs/patterns/)

**Docker Compose Profiles**

Most services start without any profile. The `run-quarkus` profile is opt-in:

| Profile | Services started |
|---|---|
| `run-quarkus` | `app-quarkus-partner` + `postgres-quarkus-partner` |

```bash
docker compose --profile run-quarkus up -d
```

> When `run-quarkus` is active, both `app-spring-partner` and `app-quarkus-partner` register under `PathPrefix(/api/partner)` at equal priority and load-balance. The Quarkus implementation is still a work-in-progress — some endpoints return 404.

**Troubleshooting**

- Use `make log SERVICE=<name>` or `docker compose logs -f` to inspect output.
- Traefik dashboard (if enabled) shows live routes and TLS state.
- For Angular live dev, ensure `socat` forward containers are up and ports do not conflict.



# Claude Code Usage

```bash
aws sso login --profile bedrock-dev
#
# Attempting to open your default browser.
# If the browser does not open, open the following URL:
#
# https://oidc.eu-central-1.amazonaws.com/authorize?...
#
./start-claude.sh
````


# Claude Code Setup

Devcontainer setup maps the .aws folder to a docker volume. Setting up AWS sso is only required once or if that volume got deleted.

1. Configure single sign on

```bash
aws configure sso
# SSO session name (Recommended): ???-session
# SSO start URL [None]: https://d-???.awsapps.com/start
# SSO region [None]: eu-central-1
# SSO registration scopes [sso:account:access]:
# Attempting to open your default browser.
# If the browser does not open, open the following URL:
#
# https://oidc.eu-central-1.amazonaws.com/authorize?...
# The only AWS account available to you is: 88???
# Using the account ID 88???
# The only role available to you is: AWS-Bedrock_Dev_Access
# Using the role name "AWS-Bedrock_Dev_Access"
# Default client Region [None]: eu-central-1
# CLI default output format (json if not specified) [None]:
# Profile name [AWS-Bedrock_Dev_Access-88????]: bedrock-dev
# To use this profile, specify the profile name using --profile, as shown:
#
# aws sts get-caller-identity --profile bedrock-dev
```
