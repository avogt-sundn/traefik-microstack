# npm-mirror (Verdaccio)

A local npm registry proxy that caches packages from `registry.npmjs.org`. Used during Docker image builds so that the Angular frontend can install npm packages without hitting the public registry on every build.

## Files

| File | Purpose |
|---|---|
| `Dockerfile` | Extends `verdaccio/verdaccio:latest`, adds `curl` for healthchecks, bakes in `config.yaml` |
| `config.yaml` | Verdaccio configuration: upstream proxy, caching, access rules |
| `docker-compose.yaml` | Service definition with named volume and healthcheck |

## How it works

Verdaccio acts as a transparent proxy. When a client requests a package:

1. Verdaccio checks its local storage (`/verdaccio/storage`) first.
2. On a cache miss it fetches the tarball from `https://registry.npmjs.org/`, stores it locally, and serves it.
3. On subsequent requests the tarball is served from local storage — no outbound connection needed.

The local storage is backed by a Docker named volume (`npm-mirror-storage`) so cached packages survive container restarts.

## Configuration (`config.yaml`)

```yaml
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
    cache: true   # store tarballs locally after first download
    maxage: 30m   # re-validate upstream metadata every 30 minutes
```

`cache: true` is the critical setting. Without it Verdaccio proxies requests live on every install and stores nothing.

Package access rules allow all clients to read (`$all`) and only authenticated users to publish. Self-registration is disabled (`max_users: -1`), so publishing is not available without manually adding credentials to the htpasswd file.

## Using the mirror

Point npm or the Docker build at the mirror instead of the public registry.

**`.npmrc` in a project or Docker build stage:**
```
registry=http://localhost:4873
```

**Inside the Docker build network** (e.g. from a build container that can reach `npm-mirror` by hostname):
```
registry=http://npm-mirror:4873
```

**Docker build with host networking** (build stage reaches the mirror via `localhost`):
```dockerfile
RUN npm install --registry http://localhost:4873
```

## Ports

| Port | Mapping |
|---|---|
| 4873 | Host `4873` → container `4873` |

## Starting the service

The service is included via `infrastructure/build-services/docker-compose.yaml` and starts as part of the full stack:

```bash
docker compose up --build -d npm-mirror
```

The root `docker-compose.yaml` uses the `build-services` aggregate service as a dependency gate — all services that depend on `build-services` wait until `npm-mirror` passes its healthcheck before starting.

## Inspecting the cache

List cached packages (inside the container):
```bash
docker exec npm-mirror ls /verdaccio/storage
```

Inspect the named volume on the host:
```bash
docker volume inspect npm-mirror-storage
```

## Resetting the cache

```bash
docker compose down
docker volume rm infrastructure_npm-mirror-storage
docker compose up --build -d npm-mirror
```

> The volume name is prefixed with the Compose project name, which defaults to the directory name (`infrastructure` when started from `infrastructure/build-services/`), or the repo root name when started via the root `docker-compose.yaml`.
