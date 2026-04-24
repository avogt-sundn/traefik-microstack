# ADR-0006: All inter-service calls must route through `https://gateway`, not direct container DNS

**Date**: 2026-04-10
**Status**: Accepted
**Session context**: CLAUDE-4 exists as a one-line axiom but the constraint is non-obvious to new developers and agents — every new service author will be tempted to use the shorter Docker DNS path

## Context

Inside the Docker network, every service is reachable via its Compose service name, e.g. `http://app-spring-partner:8080`. This is standard Docker networking and it works. It is also prohibited.

The Compose stack exposes a `gateway` hostname (the Traefik edge proxy) that is reachable from within the Docker network at `https://gateway`. Any service making an outbound call to another backend must use this hostname instead of the container name.

### What routing through Traefik provides

- **Load balancing.** Traefik selects the active replica. Direct DNS always hits the same container, bypassing round-robin.
- **TLS termination.** Calls via `https://gateway` go through TLS. Direct calls are plain HTTP — a protocol mismatch with production where TLS is end-to-end.
- **Middleware enforcement.** Auth guards, rate limiters, strip-prefix rules, and circuit breakers are attached to Traefik routes, not to the container. Bypassing Traefik means bypassing all middleware.
- **Topology parity with prod.** In production, services are not co-located and cannot reach each other by Docker DNS. The only stable, environment-independent address is the gateway hostname.

### The failure mode

A backend that calls `http://app-spring-partner:8080/api/partners` directly:

1. Bypasses auth middleware — an auth-protected route becomes accessible without a token.
2. Bypasses the load balancer — one replica handles all internal traffic.
3. Works in dev, fails silently in production when the container name is not resolvable.
4. Creates a hidden divergence between dev and prod that no integration test will catch, because dev DNS resolves the container name even though prod never would.

This class of bug is particularly dangerous because the code passes all local tests.

## Decision

All service-to-service HTTP calls use `https://gateway/<route-path>`, where `<route-path>` matches the Traefik router rule for the target service.

Direct container DNS (`http://<service-name>:<port>`) is prohibited for inter-service communication regardless of whether it resolves.

This is CLAUDE-4: "Never route around Traefik."

## Alternatives considered

| Alternative | Reason rejected |
|---|---|
| Direct Docker DNS (`http://app-spring-partner:8080`) | Bypasses all middleware; does not exist in production topology |
| Service mesh sidecar (Envoy, Linkerd) | Significant operational overhead for a demo stack; Traefik already provides the same guarantees at the edge |
| Kubernetes `Service` DNS (`http://app-spring-partner.namespace.svc.cluster.local`) | Viable in a pure-k8s topology, but bypasses the ingress controller — same middleware-bypass failure mode as Docker DNS. On k8s, the gateway maps to the Ingress/IngressRoute; internal callers must still target it, not the cluster-internal `Service` address. |
| Hardcoded IP addresses | Violates CLAUDE-3 (dev/prod parity); IPs are not stable across Compose restarts |
| Internal Traefik entrypoint (non-TLS) | Would restore load balancing and middleware but lose TLS enforcement — partial fix that creates its own prod/dev divergence |

## Consequences

- Every backend service that calls another backend must configure its HTTP client base URL as `https://gateway`.
- TLS trust: the gateway certificate is self-signed in dev. Internal callers must either trust the dev CA or disable certificate verification **only** in the dev build context (not via a stage-specific config file — see CLAUDE-2).
- Slightly longer request path in dev (container → Traefik → container) compared to direct DNS. This overhead is intentional and accepted as the price of topology parity.
- New service authors must be told about `https://gateway` explicitly — direct DNS is a natural first instinct that the tooling does not prevent.
- **Kubernetes migration path.** If the stack moves to Kubernetes in production, the `gateway` hostname maps to the Traefik `IngressRoute` (or an equivalent ingress controller). The calling code does not change — only the DNS record backing `gateway` changes. Kubernetes `Service` DNS (`*.svc.cluster.local`) must still be avoided for inter-service calls for the same reasons as Docker DNS: it bypasses the ingress, and therefore bypasses all middleware.

## Token efficiency note

CLAUDE-4 is a one-line axiom. Without this ADR, every session involving a new backend integration requires re-explaining why direct DNS is prohibited, what the failure mode is, and why the longer path is worth it — roughly 400 tokens of re-discovery per session. This ADR reduces that to a single reference. The alternatives table eliminates re-litigating the service-mesh and internal-entrypoint options.
