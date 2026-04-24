# ADR-0013: Bounded context — no cross-domain database reads

**Date**: 2026-04-22
**Status**: Accepted
**Session context**: PARTNER-SEARCH-002 — removing cross-domain Postgres re-read from the ES incremental reindex path

## Context

`partner-search`'s incremental reindex path was reading from `postgres-partner-edit` after receiving a reindex notification from `partner-edit`. The notification was a body-less POST (just a partner ID), so `partner-search` had to fetch the full record itself. This required `partner-search` to know `partner-edit`'s Postgres hostname, schema, and entity structure.

This violates [CLAUDE-8] (domain == team boundary): the search domain was coupled to the edit domain's database schema. Any schema change in `partner-edit` — adding a column, renaming a field, splitting a table — would silently break the search indexer without any compile-time signal.

## Decision

`partner-edit` is responsible for pushing the full partner payload to `partner-search` when a record changes. The notification call is a `POST /api/partner-search/index` with a `PartnerIndexRequest` body containing all 13 fields needed to build a `PartnerDocument`.

`partner-search` builds `PartnerDocument` entirely from the received `PartnerIndexRequest`. It has no knowledge of, and no connection to, `postgres-partner-edit`.

The 13 fields in `PartnerIndexRequest` match `Partner.java` exactly: `id`, `partnerNumber`, `type`, `groupType`, `groupNumber`, `salutation`, `title`, `firstname`, `name1`, `name2`, `street`, `postalCode`, `city`.

## Consequences

**Easier:**
- `partner-edit` schema changes do not silently break `partner-search` — any field change requires an explicit update to `PartnerIndexRequest` and `SearchNotifier`, which is a compile-time change.
- `partner-search` can be deployed and scaled independently of `partner-edit`'s database.
- The cross-domain data flow is explicit and auditable: `partner-edit` → HTTP POST → `partner-search`.

**Harder:**
- `partner-edit` must serialize the full `DetailResponse` object into the notification call. `SearchNotifier.notifyReindex(DetailResponse)` replaces the former `notifyReindex(Long id)`.
- If the payload fields needed for indexing grow beyond 13, `PartnerIndexRequest` must be updated in `partner-search` *and* `SearchNotifier` in `partner-edit` must be updated — a two-domain change.

**Pattern established:**
When any domain service needs data from another domain's backing store, the owning domain must push the data (synchronous POST or event). Cross-domain database connections are prohibited under this axiom regardless of whether the schemas are technically accessible.

## Token efficiency note

This ADR makes the bounded-context rule concrete and searchable. Future sessions encountering a similar cross-domain data access question can reference this ADR instead of re-deriving the rationale. Estimated saving: 1–2 minutes of frontier-model context reconstruction per session that touches inter-domain data flows.
