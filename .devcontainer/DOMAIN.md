# DevContainer Domain

## Purpose

Defines the **VS Code Dev Container** environment for this project. A developer who opens the repository in VS Code (or GitHub Codespaces) lands inside a fully configured container: correct Java/Maven/Node/npm versions, Docker-outside-of-Docker, TLS-trusted toolchain, and all VS Code extensions pre-installed.

## Bounded Context

Owns everything under `.devcontainer/`:
- `devcontainer.json` — container spec (base image, features, mounts, ports, environment variables, VS Code extensions and settings)
- `Dockerfile` — base image customization (system packages, AWS CLI, Playwright OS deps)
- `scripts/postCreate*.sh` — one-time setup steps run after the container is created

The domain has **no runtime services** — it is pure developer-experience infrastructure.

## Components

| File / Script | Purpose |
|---|---|
| `devcontainer.json` | Entry point — declares features, mounts, forwarded ports, `initializeCommand`, `runArgs`, and VS Code customizations |
| `Dockerfile` | Extends `mcr.microsoft.com/devcontainers/java:dev-25-jdk-bookworm`; adds ping/dig/httpie, AWS CLI, Playwright OS libs |
| `scripts/postCreateCommand.sh` | Orchestrator — calls all `postCreate-*.sh` in order |
| `scripts/postCreate-Claude.sh` | Installs Claude Code CLI (`@anthropic-ai/claude-code`) |
| `scripts/postCreate-Maven.sh` | Writes `~/.m2/settings.xml` pointing Maven at the in-stack `maven-mirror:8080` |
| `scripts/postCreate-npm.sh` | Sets npm auth token for Verdaccio at `${NPM_MIRROR}` |
| `scripts/postCreate-Playwright.sh` | Installs Playwright Chromium + `@playwright/cli` skills |
| `scripts/postCreate-Quarkus.sh` | Disables Quarkus telemetry |
| `scripts/postCreate-YouTube.sh` | Installs `pyyaml` for the `.youtube/present.sh` engine |

## Key Architectural Decisions

- **`--network=docker-default-network`** — the container joins the same Docker network as the Compose stack via `runArgs`, so `make up` services are reachable by hostname from inside the devcontainer.
- **`--hostname=traefik-microstack`** — aligns the devcontainer hostname with the forward-container `TARGET_HOST` used by socat dev-override containers, enabling live Angular/Spring dev through Traefik without a host-level DNS entry.
- **Named volumes for caches** — `localcache` → `~/.m2` and `aws-local` → `~/.aws` survive container rebuilds.
- **No profile-specific config** — `containerEnv` (`DOCKER_NETWORK`, `NPM_MIRROR`) are the only environment variables; no stage-specific files exist (CLAUDE-2).
- **Mirror-aware Maven** — `postCreate-Maven.sh` writes `settings.xml` so `mvn` inside the devcontainer resolves artifacts from Reposilite instead of Maven Central, matching the in-container build behavior.
