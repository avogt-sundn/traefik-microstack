# Partner-Search Domain

## Purpose

A **business partner registry** with dual-engine search. Users can look up company and group partner records (German business data) by name, address, postal code, or alpha code. The domain also serves as a live comparison of PostgreSQL full-text search vs. Elasticsearch, returning both result sets in a single API response.

## Bounded Context

Stores partner records (individuals and Verbund/groups) and exposes a search API. Partners are identified by `partnerNumber`. The search engine comparison is first-class: every response carries both a Postgres result set and an Elasticsearch result set with per-engine timing.

## Services

| Service | Framework | Route | Notes |
|---|---|---|---|
| `app-spring-partner-search` | Spring Boot 3 + JPA | `/api/partner/spring` priority 1000 | Always active |
| `app-quarkus-partner-search` | Quarkus (RESTEasy Reactive) | `/api/partner/quarkus` priority 1000 | Always active — distinct prefix, no profile needed |
| `postgres-partner-search` | PostgreSQL 15 | internal | Shared by both backends; Flyway distributed lock prevents conflicts |
| `elasticsearch-partner-search` | Custom ES image | internal | Shared by both backends; seeded from Postgres on first boot |
| `partner-search` (frontend) | Angular + Nginx | `/partner` (strip prefix) | Micro-frontend remote |

## API Shape

Each framework exposes per-engine endpoints (all four fire in parallel from the browser):

```
GET /api/partner/spring/search/postgres?q=        → SearchEngineResult (Spring + Postgres)
GET /api/partner/spring/search/elasticsearch?q=   → SearchEngineResult (Spring + ES)
GET /api/partner/quarkus/search/postgres?q=       → SearchEngineResult (Quarkus + Postgres)
GET /api/partner/quarkus/search/elasticsearch?q=  → SearchEngineResult (Quarkus + ES)

GET /api/partner/spring/complete?q=               → CompletionResponse
GET /api/partner/quarkus/complete?q=              → CompletionResponse

GET /api/partner/spring/{partnerNumber}            → 404 (stub)
GET /api/partner/quarkus/{partnerNumber}           → 404 (stub)
```

Legacy dual-engine endpoint (kept alive for direct API and e2e use):
```
GET /api/partner/spring/search?q=   → DualSearchResponse
GET /api/partner/quarkus/search?q=  → DualSearchResponse
```

`SearchEngineResult`: `{ results[], totalCount, returnedCount, durationMs }`

## Search Logic

Queries are split on whitespace (quoted spans stay together). Each token is matched as a substring (`%token%`) across **all** fields including `partner_number::text` — so entering `331` finds every partner whose number, postal code, name, city, or street contains those three digits. `AND` across tokens, `OR` across fields per token.
- **Postgres**: native SQL with `ILIKE`/`LIKE` `%token%`. Max 200 results.
- **Elasticsearch**: `must` bool query with `wildcard *token*` across all fields. Max 200 results.

## Database (Flyway migrations)

- **V1**: `partner` table with `pg_trgm`, trigram GIN indexes, and a `name_search_vec` tsvector (German dictionary).
- **V2**: 45 individual partners + 6 Verbund/group records (real-looking German company data).
- **V3**: 20 disambiguation test partners — designed to validate edge cases (same street across cities, city-in-name, postal prefix groups). The migration file doubles as an integration test specification.
- **V4**: Renames V3 partners to single-word stems for better German FTS stemming.

## Key Architectural Decisions

- **Per-framework path prefixes**: Each backend owns a distinct Traefik prefix — `/api/partner/spring` and `/api/partner/quarkus`. Both run at priority 1000. Equal priorities are safe because the prefixes never overlap. See ADR-0002.
- **Four-way parallel search**: The frontend fires all four `(framework × engine)` calls simultaneously via `forkJoin`. `PartnerFrameworkSearchService` aggregates the results into `QuadSearchResponse`. Quarkus calls use `catchError` fallback — if Quarkus is unreachable, only the framework toggle is disabled.
- **Legacy DualRunSearchService**: Both backends keep the combined `/search` endpoint alive for direct API use. `DualRunSearchService` can be deleted once no callers remain.
- **ES as read-side cache**: `PartnerIndexService` seeds ES from Postgres at startup. ES is one-way synced — Postgres is the source of truth.
- **Request logging to ES**: A Servlet filter logs all POST requests asynchronously to `request-logs` ES index for lightweight observability without external tooling.

## Further Reading

| File | Contents |
|---|---|
| `partner-search/SEARCH-ARCHITECTURE.md` | Full tokenizer pipeline, classifier reference, frontend architecture, DB schema, ES index mapping, test strategy |
| `partner-search/PLAN-ELASTICSEARCH.md` | Elasticsearch integration plan — infrastructure, index mapping, Spring/Quarkus implementation steps, frontend changes |
| `partner-search/POSTGRESQL-SEARCH-TECHNIQUES.md` | PostgreSQL search techniques explained (English) — tsvector, pg_trgm, LIKE, GIN indexes |
| `partner-search/POSTGRESQL-SEARCH-TECHNIQUES-DE.md` | Same content in German |
| `partner-search/spring/ELASTICSEARCH.md` | Observing request logs via the ES `request-logs` index |
