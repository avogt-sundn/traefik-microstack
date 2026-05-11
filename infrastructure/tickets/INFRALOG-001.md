---
id: INFRALOG-001
status: done
domain: infrastructure
area: logging
---

# INFRALOG-001: Reduce infrastructure container log noise

## Goal

Reduce default log verbosity across all infrastructure containers. All reductions are opt-in reversible via `LOG_LEVEL_*` environment variables — no profiles, no overrides files.

## Mechanism

Environment variables with a `LOG_LEVEL_` prefix set quiet defaults; operators override at runtime:

| Variable | Default | Verbose |
|---|---|---|
| `LOG_LEVEL_TRAEFIK` | `ERROR` | `DEBUG` |
| `TRAEFIK_ACCESS_LOG` | `false` | `true` |
| `LOG_LEVEL_ES` | `WARN` | `DEBUG` |

Traefik maps `TRAEFIK_LOG_LEVEL` and `TRAEFIK_ACCESSLOG` natively. Elasticsearch env-var refs in `elasticsearch.yml` use the `${VAR:-default}` syntax supported by the ES YAML loader.

## Files affected

| File | Change |
|---|---|
| `infrastructure/traefik/traefik_conf.yml` | `log.level` → `${LOG_LEVEL_TRAEFIK:-ERROR}`; `accesslog` gated by `${TRAEFIK_ACCESS_LOG:-false}` |
| `infrastructure/traefik/docker-compose.yaml` | Pass `LOG_LEVEL_TRAEFIK` and `TRAEFIK_ACCESS_LOG` to gateway and standby; reduce `dockerd-proxy` LOG_LEVEL |
| `partner/spring/elasticsearch/elasticsearch.yml` | Both `logger.*` fields reference `${LOG_LEVEL_ES:-WARN}` |
| `partner/docker-compose.yaml` | `elasticsearch-quarkus-partner`: change `logger.org.elasticsearch.http` from `DEBUG` to `${LOG_LEVEL_ES:-WARN}` |
| `infrastructure/build-services/maven-mirror/docker-compose.yaml` | No change — Reposilite 3.5 has no CLI log-level flag |
| `infrastructure/build-services/npm-mirror/docker-compose.yaml` | `NODE_ENV=production` already suppresses verbose output; no change needed |

## Acceptance criteria

- [x] `docker compose logs -f gateway` shows no DEBUG lines by default
- [x] `docker compose logs -f gateway` shows DEBUG lines when `LOG_LEVEL_TRAEFIK=DEBUG`
- [x] `docker compose logs -f gateway` shows no access log lines by default
- [x] `docker compose logs -f gateway` shows access log lines when `TRAEFIK_ACCESS_LOG=true`
- [x] `docker compose logs -f elasticsearch-spring-partner` shows no DEBUG/TRACE HTTP lines by default
- [x] `docker compose logs -f elasticsearch-spring-partner` shows DEBUG lines when `LOG_LEVEL_ES=DEBUG`
- [x] `docker compose logs -f elasticsearch-quarkus-partner` shows no DEBUG HTTP lines by default
- [x] `docker compose config` validates without errors after all changes
