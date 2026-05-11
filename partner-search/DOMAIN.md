# Partner-Search Domain

## Purpose

A **read-side query projection** over the partner master data owned by `partner-edit`. Users can look up company and group partner records (German business data) by name, address, postal code, or alpha code. The domain also serves as a live comparison of PostgreSQL full-text search vs. Elasticsearch, returning both result sets in a single API response.

## Bounded Context

> **Q: How can `partner-search` be a separate domain when it reads data owned by `partner-edit`?**
>
> This is textbook CQRS / read-model separation. `partner-edit` is the **write side**: owns the schema, runs Flyway, enforces consistency. `partner-search` is the **read side**: a query projection with its own search-specific models and dual-engine comparison logic. Sharing a database is normally an anti-pattern, but a **read-only participant** via a dedicated DB role is the accepted CQRS exception — it is an integration mechanism, not domain merging.
>
> The boundary is defined by *responsibility*, not data ownership:
> - `partner-edit` answers: *"What is the current state of partner X?"*
> - `partner-search` answers: *"Which partners match this query, and which engine finds them faster?"*
>
> Those are different problems, different change rates, different expertise. Merging them would conflate schema integrity concerns with search engine strategy.
>
> Put differently: `partner-search` may be described as an **extension context** over `partner-edit`, but only in the sense of a **downstream bounded context with a well-defined purpose**. It extends the partner capability with search, ranking, indexing, and engine comparison; it does **not** extend into write ownership, master-data invariants, or schema control.
>
> That distinction keeps the context clean:
> - `partner-edit` defines what a partner **is** and whether a change is valid.
> - `partner-search` defines how partners are **found**, compared, and returned for query use cases.
>
> As long as `partner-search` stays on the read/query side, it remains a legitimate bounded context rather than "just extra code inside `partner-edit`".
>
> The coupling is explicit and one-directional: `partner-edit` publishes a domain event (`SearchNotifier` fires `POST .../index/partner/{partnerNumber}` after every PUT); `partner-search` reacts by re-indexing. Failures are isolated (logged at WARN, do not affect the edit response). In DDD context-mapping terms this is a **Customer-Supplier** relationship: `partner-edit` is the upstream (Published Language: the `partner` table schema + the re-index HTTP event); `partner-search` is the downstream conformist.

`partner-search` owns no schema migrations. It reads partner records via the read-only role `partner_search_ro` (created by `partner-edit` migration V6) and maintains its own Elasticsearch index as a one-way read-side cache. Partners are identified by `partnerNumber`. The search engine comparison is first-class: every response carries both a Postgres result set and an Elasticsearch result set with per-engine timing.

## Glossary

German business terms authorized as code identifiers in this domain ([CLAUDE-14]). OpenAPI-generated files (`src/app/api/`) are exempt — their identifiers come from the upstream spec.

| German term | English gloss | Usage | Example identifier |
|---|---|---|---|
| Verbund | group, association | partner group entity linking multiple partners | `InternerVerbund`, `NormalerVerbund` |
| Hauptanschrift | main address | primary registered address of a partner | `HAUPTANSCHRIFT`, `PARTNER_HAUPTANSCHRIFT` |
| Zusatzanschrift | additional address | secondary address | `ZUSATZANSCHRIFT`, `PARTNER_ZUSATZANSCHRIFT` |
| Betriebsstaette | place of business | operational site address | `BETRIEBSSTAETTE` |
| Versandanschrift | shipping address | dispatch/mailing address | `VERSANDANSCHRIFT`, `VERSANDADRESSE` |
| Rechnungsanschrift | billing address | invoice address | `RECHNUNGSANSCHRIFT` |
| Postfachanschrift | PO box address | post office box address | `POSTFACHANSCHRIFT` |
| Geschaeftsfuehrer | managing director | legal representative role (GmbH) | `GESCHAEFTSFUEHRER` |
| Inhaber | owner | sole proprietor role | `INHABER` |
| Vorstand | board member | executive board role (AG) | `VORSTAND` |
| Ansprechpartner | contact person | designated contact at a partner | `PARTNER_ANSPRECHPARTNER` |
| Hauptnummer | main phone number | primary telephone | `HAUPTNUMMER` |
| Mobiltelefon | mobile phone | mobile telephone number | `MOBILTELEFON` |
| Vorankuendigung | pre-notification | advance notice communication channel | `EMAIL_VORANKUENDIGUNG` |
| Herr | Mr. | male salutation code | `Herr` |
| Frau | Mrs./Ms. | female salutation code | `Frau` |
| Dachgesellschaft | holding company | parent/umbrella company in a Verbund | `Dachgesellschaft` |
| Kreditwesengesetz | Banking Act | KWG regulatory classification flag | `kwgFlag` (JSDoc: `Kreditwesengesetz`) |

## Services

| Service | Framework | Route | Notes |
|---|---|---|---|
| `app-spring-partner-search` | Spring Boot 3 + JPA | `/api/partner/spring` priority 1000 | Always active |
| `app-quarkus-partner-search` | Quarkus (RESTEasy Reactive) | `/api/partner/quarkus` priority 1000 | Always active — distinct prefix, no profile needed |
| `elasticsearch-partner-search` | Custom ES image | internal | Read-side cache; seeded from `postgres-partner-edit` on first boot |
| `partner-search` (frontend) | Angular + Nginx | `/partner` (strip prefix) | Micro-frontend remote |

**Database**: both backends connect read-only to `postgres-partner-edit` (owned by the `partner-edit` domain). No Flyway migrations run here.

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
