# ADR-0012: Angular Native Federation — domain boundaries, coupling trade-offs, and honest limits

**Date**: 2026-04-22
**Status**: Accepted — with documented caveats
**Session context**: Architectural review of NF remote boundaries after implementing PARTNER-EDIT-004 and observing the search→edit handover failure caused by a misaligned DI boundary.

---

## Context

The frontend is built as a Native Federation (NF) micro-frontend shell hosting several Angular remotes:

| Remote | Path prefix | Domain |
|---|---|---|
| `platform/shell` | `/` (host) | navigation, layout |
| `partner-search` | `/partner-search` | search, result list |
| `partner-edit` | `/partner-edit` | detail view, edit form |
| `ekf` | `/ekf` | EKF form |
| `loans` | `/loans` | loan calculator |

Each remote is an independent Angular workspace, built separately, served from its own Nginx container, and loaded at runtime by the shell via `loadRemoteModule()`. The shared library (`@traefik-microstack/shared`) is published to a local Verdaccio registry and declared as a singleton in every remote's `federation.config.js`.

This decision record examines whether the NF remote boundary is the right granularity for domain-driven decoupling, with specific focus on the `partner-search` ↔ `partner-edit` relationship.

---

## Decision

Keep NF as the deployment and code boundary for all remotes. Accept the search→edit handover cost (one extra GET, ~50 ms) as the price of the clean URL contract.

**Do not** attempt to share `PartnerDetailService` across remotes via `platform/shared` — it would couple `partner-search`'s build to `partner-edit`'s internal domain model, which is precisely what DDD says not to do across a context boundary.

**Do** implement `NavigationExtras.state` as the fast-path optimisation for the search→edit handover, with a clearly documented fallback to `loadPartnerFromUrl` for direct navigation.

Reconsider the `partner-search` / `partner-edit` split if and when they are assigned to genuinely different teams with different deployment cadences. Until that moment, the split is organizational aspiration rather than operational necessity — but it is a useful forcing function that keeps the coupling honest.

### The honest cost of this decision

If `partner-search` and `partner-edit` are never assigned to different teams, this boundary will remain organizational aspiration. The extra GET, the `expect.poll`, and the `make shared` publish cycle are real taxes paid against a benefit that may never be collected. This is documented here so that future maintainers can make a deliberate choice rather than inherit an unexamined one.

---

## Native Federation in one paragraph

NF replaces Webpack Module Federation's custom loader with native browser ESM. The shell fetches each remote's `remoteEntry.json` at runtime, resolves shared singletons by semver negotiation, and loads remote chunks via plain `import()`. There is no build-time knowledge of remote internals — the shell and each remote are compiled independently.

The shell resolves the remote at route activation:

```typescript
// platform/shell — lazy route definition
{
  path: 'partner-search',
  loadChildren: () =>
    loadRemoteModule('partner-search', './Module')
      .then(m => m.PartnerSearchModule),
}
```

After `loadRemoteModule` resolves, Angular's DI bootstraps the remote module into the shell's router outlet. From this point the remote behaves exactly like a lazily loaded local module — same change detection, same zone, same router instance. The boundary is deployment-time, not runtime.

---

## What DDD says about bounded contexts

A bounded context boundary is justified when the subdomain has a distinct ubiquitous language, when the team owning it deploys independently, and when the data model is genuinely separate.

For `partner-search` and `partner-edit` in this project, none of these hold cleanly:

- Both use the word "partner" to mean exactly the same entity (same Postgres table, same `partnerNumber` PK)
- Both live in the same repository and are committed together
- `partner-edit` owns the Postgres database; `partner-search` reads from it via Elasticsearch, which is re-indexed by `partner-edit`'s `SearchNotifier` after every PUT

The data dependency is synchronous in the user's mental model: edit a partner, immediately search for that partner, see the updated name. The NF boundary adds observable latency (async ES re-index, ~2–3 s) and two extra HTTP calls without buying independent deployability. Whether that tradeoff is worth it is what the rest of this ADR argues.

---

## The search→edit handover: where the boundary bites

`partner-search`'s `onRowClick` has the partner DTO in hand:

```typescript
// partner-search — knows partnerNumber AND the full PartnerGroupSearchDto
async onRowClick(node: FlatNode<PartnerGroupSearchDto>): Promise<void> {
  const { data } = node;
  if (data.type === 'P' && data.partnerNumber) {
    const client = this.router.url.split('/')[1];
    this.router.navigate([`/${client}/partner-edit/view`, data.partnerNumber]);
    // data (PartnerGroupSearchDto) is discarded here — cannot cross the remote boundary
  }
}
```

`partner-edit`'s `ViewPartner.ngOnInit` then fires a fresh GET to reconstruct what was already fetched:

```typescript
// partner-edit — must re-fetch because it can't see partner-search's DI tree
ngOnInit(): void {
  const partnerId = this.route.snapshot.paramMap.get('partnerId');
  if (partnerId) {
    this.loadPartnerFromUrl(+partnerId);   // → GET /api/partner-edit/spring/{id}
  }
}
```

The route carries only the ID. Everything else the user already fetched gets thrown away at the boundary. That is not a bug — it is the contract. The question the Decision section answers is whether this contract is worth the independence it buys.

`partner-edit` also declares `PartnerDetailService` as `providedIn: 'root'`, which in a NF context means "root of this remote's DI tree", not "root of the shell's DI tree". `providedIn: 'root'` means the root of the remote's own DI tree, not the shell's — cross-remote injection is structurally impossible. A `partner-search` component cannot inject it, and if it could, it would be exactly the coupling NF is supposed to prevent.

---

## Route-based handover: the URL as contract

The URL-as-contract approach (`/partner-edit/view/:partnerNumber`) is sound in principle:

- **Deep-linkable** — a user can bookmark or share the URL
- **Stateless** — browser refresh works (when the API path is correct)
- **Zero coupling** — `partner-search` does not import anything from `partner-edit`
- **Testable** — e2e tests can assert the URL without knowing remote internals

`NavigationExtras.state` is a practical middle-ground that eliminates the redundant round-trip for the hot path without introducing a compile-time dependency:

```typescript
// partner-search — pass summary as router state (survives the NF boundary via the shared router)
this.router.navigate([`/${client}/partner-edit/view`, data.partnerNumber], {
  state: { summary: data satisfies PartnerGroupSearchDto },
});

// partner-edit — use summary for instant render, fetch full DTO in background
ngOnInit(): void {
  const nav = this.router.getCurrentNavigation();
  const summary = nav?.extras?.state?.['summary'] as PartnerGroupSearchDto | undefined;
  if (summary) {
    this.detailService.showPartnerDetails(summary as unknown as PartnerDto); // fast render
  }
  const partnerId = this.route.snapshot.paramMap.get('partnerId');
  if (partnerId) {
    this.loadPartnerFromUrl(+partnerId); // authoritative fetch, replaces summary
  }
}
```

The state must be read synchronously in `ngOnInit` — Angular discards it after the navigation completes. If your component lifecycle introduces a microtask before `ngOnInit` fires — an async guard, a resolver, a zone-escaping side-effect — the state will already be null. Test this path explicitly. It will break silently.

---

## Pros and cons of the NF remote boundary at this granularity

### What NF genuinely delivers

**Independent Docker builds.** Each remote is its own multi-stage Dockerfile. A CSS change in `partner-edit` does not trigger a rebuild of `partner-search` or the shell. At scale this is real CI time saved.

**Failure isolation.** If `partner-edit`'s bundle fails to load, the shell and `partner-search` remain functional. The shell can render an error state for the failed remote without crashing the entire SPA. A monorepo bundle failure takes everything down.

**Runtime version negotiation.** The `remoteEntry.json` manifest means the shell can load different versions of each remote without a coordinated release. This is the theoretical basis for independent deployability — even if not exercised in practice today.

**Enforced interface discipline.** Because `partner-search` genuinely cannot import `partner-edit`'s internals, the route URL becomes the enforced public API. This constraint prevents the accretion of implicit coupling that happens naturally in a monorepo over time.

### What NF costs at this granularity

**Redundant network calls.** The search→edit handover always fires at least one extra GET. At typical API latency (~50 ms internal) this is invisible, but it is waste.

**Broken direct navigation.** A user who bookmarks `/abc/partner-edit/view/100002` and navigates directly will trigger `loadPartnerFromUrl`, which must call the API. If the API path is wrong (as it was before ADR-0011), the component errors and redirects back to search — silently, from the user's perspective. The route-as-contract promise breaks if the API path is not maintained.

**Shared library publish friction.** Any type or service that must cross the remote boundary must be versioned, published to Verdaccio, and consumed via `package.json`. A one-line interface change that would take 30 seconds in a monorepo takes a `make shared` + version bump + `npm install` cycle.

**`federation.config.js` semver drift.** If `partner-search` and `partner-edit` diverge in their `@angular/core` version requirements beyond what the `strictVersion: false` tolerance allows, both copies of Angular load in the same page. Change detection stops working across the boundary. There is no build-time warning — it only manifests at runtime.

**Testing the boundary requires a running stack.** Unit tests inside each remote test that remote in isolation. The search→edit navigation, the ES re-index after a PUT, and the URL contract between remotes can only be verified against the full Docker Compose stack. This is why `expect.poll` with a 10-second timeout appears in the e2e suite — async side-effects that cross domain boundaries have no unit-testable surface.

---

## Comparison: what a monorepo would look like

In a single Angular workspace the same use case would be:

```typescript
// No loadRemoteModule — just a lazy-loaded route in app-routing.module.ts
{
  path: 'partner-edit',
  loadChildren: () => import('./partner-edit/partner-edit.module').then(m => m.PartnerEditModule),
}

// partner-search can inject PartnerDetailService directly
constructor(private detailService: PartnerDetailService) {}

onRowClick(node: FlatNode<PartnerGroupSearchDto>): void {
  this.detailService.showPartnerDetails(node.data); // zero extra HTTP call
  this.router.navigate([`/${client}/partner-edit/view`, node.data.partnerNumber]);
}
```

The DTO never leaves memory. The type contract is enforced at compile time. The test is a unit test with a mocked `PartnerDetailService`. The tradeoff is that a bad change to `PartnerDetailService` can break `partner-search` at compile time — which is the point. You want the compiler to catch cross-domain contract violations, not a 2 AM production incident.

---

## When the monorepo splits into separate git repos

Everything that looks like overhead in the monorepo becomes load-bearing infrastructure the moment a separate team owns a separate repo.

### The URL contract becomes the enforced API between teams

In the monorepo a developer can reach across and import. The NF boundary prevents that. After the split:

```
team-search/partner-search.git   →  can only navigate to /:client/partner-edit/view/:id
team-edit/partner-edit.git       →  exposes that URL as its public surface
```

The URL is now a versioned public API in the same way a REST endpoint is. `partner-edit` can rename every internal component, refactor every service, change its entire state model — as long as `/:client/partner-edit/view/:partnerNumber` still works and `GET /api/partner-edit/spring/:id` still returns the same shape. `partner-search`'s team finds out about breaking changes at runtime via `remoteEntry.json`, not at compile time via an import. That is the correct decoupling direction for autonomous teams.

### `platform/shared` becomes a genuine platform contract with a version history

Today `make shared` + Verdaccio is friction. In a split-repo world it is the mechanism by which the platform team publishes breaking vs. non-breaking changes:

```
@traefik-microstack/shared@1.4.0  →  minor: new FormValidationService method
@traefik-microstack/shared@2.0.0  →  major: ValidationErrorService API changed
```

Each domain team pins their `package.json` to the version they tested against and upgrades on their own schedule. Nobody gets broken by another team's refactor. This is the npm dependency model applied to internal platform code — it only has value when teams actually move at different speeds, which only happens with separate repos.

### Independent CI/CD becomes real, not theoretical

- `partner-search` ships a hotfix on a Thursday with zero coordination with `partner-edit`
- `partner-edit` can be in a feature freeze while `partner-search` iterates
- The shell fetches each remote's `remoteEntry.json` at **user browser load time** — the shell always loads whatever is currently deployed at `/partner-search/remoteEntry.json`, with no shell redeploy required

Runtime version negotiation, which is theoretical in the monorepo, becomes the daily operational model.

### The Traefik routing layer is already the seam

Each domain already owns its Nginx container and its Traefik route prefix. The Docker image name (`partner-search`, `partner-edit`) already is the deployment unit. Splitting the git repo makes the ownership of that deployment unit explicit. A team that owns `partner-search.git` owns:

```
partner-search/
  frontend/           →  builds partner-search Docker image
  docker-compose.yaml →  defines its Traefik route at /partner-search
```

No change to the runtime topology. The split is a social boundary (git, CI, on-call) that maps onto an existing technical boundary (container, route, NF remote). That alignment is the strongest argument for the split: the seams are already cut correctly.

### The shared database stops being acceptable

Today `partner-edit` owns `postgres-partner-edit` and `partner-search` reads from Elasticsearch fed by `partner-edit`'s `SearchNotifier`. When separate teams own these repos, that synchronous data dependency becomes a cross-team coordination problem:

- `partner-edit` team changes the schema → `partner-search` team's ES index breaks silently
- `SearchNotifier` fails → search team gets paged for data their team doesn't own or control

The split forces the teams to address this properly: either make `SearchNotifier` an explicit published domain event on a message bus, or give `partner-search` its own versioned read-model fed by `partner-edit`. Both are better architectures than a direct in-process call dressed as "async". The NF boundary surfacing this problem is the architecture doing its job — making implicit coupling visible and painful enough to fix.

### `federation.config.js` semver strictness becomes a testable release gate

In the monorepo a broken semver negotiation manifests as a mysterious runtime bug. In separate repos each team's CI pipeline can include a `remoteEntry.json` compatibility smoke test against the live shell before merge. The shared singleton version table becomes a documented cross-team contract, verified automatically rather than discovered in production.

### The one cost that gets worse

The `partner-search` / `partner-edit` UX coupling — search for a partner, click a row, edit it, search again and see the updated name — spans a team boundary. The `expect.poll` with a 10-second timeout in the e2e suite is a symptom of this coupling. In a split-repo world that e2e test either lives in a third integration repo (maintained jointly) or in the shell repo against the running stack. Neither is free. This is the honest cost: the UX coupling is real, and splitting the repos does not remove it — it makes the coordination overhead explicit rather than hidden in the monorepo. The correct resolution is the domain event approach above, not ignoring the test.
