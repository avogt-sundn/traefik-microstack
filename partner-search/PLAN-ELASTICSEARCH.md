# Elasticsearch for Partner Search

## Goal

Introduce Elasticsearch as a parallel search engine alongside PostgreSQL for the partner search. Both engines execute every query and the response includes results and timing from both, enabling a live comparison of:

- PostgreSQL tsvector + pg_trgm (Spring) vs. Elasticsearch fuzzy/multi-match
- PostgreSQL plain LIKE (Quarkus) vs. Elasticsearch
- Relevance scoring (ES `_score`) vs. insertion-order (PostgreSQL)

The search endpoints remain unchanged from the frontend perspective — the same 6 structured parameters are accepted. Only the response shape is extended with comparison metadata.

---

## Architecture

```
Browser  →  Angular (tokenize + chips)  →  POST /api/partner/search/structured
                                                      |
                                         Traefik  PathPrefix(/api/partner)
                                                      |
                              +-----------------------+-----------------------+
                              |                                               |
                        spring-partner                               quarkus-partner
                     (dual-run: PG + ES)                          (dual-run: PG + ES)
                              |                                               |
                  +-----------+-----------+                     +-------------+-------------------+
                  |                       |                     |                                 |
          postgres-partner   elasticsearch-spring-partner  postgres-quarkus-partner  elasticsearch-quarkus-partner
        (tsvector + trgm)     (german analyzer,             (Panache LIKE)            (german analyzer,
                               fuzzy, edge_ngram)                                      fuzzy, edge_ngram)
```

Each backend has its own ES node. The `partners` index name is identical in both nodes — no coordination or shared state needed.

Each backend owns its own single-node Elasticsearch instance, defined inside the same compose file as the backend and its Postgres service. This mirrors the existing pattern (`postgres-partner` in `partner/spring/docker-compose.yaml`, `postgres-quarkus-partner` in `partner/quarkus/docker-compose.yaml`) and eliminates all cross-file service dependencies, race conditions on shared index creation, and the need for a separate `infrastructure/elasticsearch/` directory.

---

## Infrastructure

### Pattern: one ES per backend (mirrors the Postgres pattern)

There is no shared `infrastructure/elasticsearch/` directory. Each backend declares its own ES service in its own compose file, exactly as it does for Postgres. No changes to the root `docker-compose.yaml`.

| Service name | Compose file | Backend it serves |
|---|---|---|
| `elasticsearch-spring-partner` | `partner/spring/docker-compose.yaml` | `app-spring-partner` |
| `elasticsearch-quarkus-partner` | `partner/quarkus/docker-compose.yaml` | `app-quarkus-partner` (profile: `run-quarkus`) |

### Modify: `partner/spring/docker-compose.yaml`

Add the ES service and wire `app-spring-partner` to it:

```yaml
services:
  elasticsearch-spring-partner:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.17.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - xpack.security.http.ssl.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
      - cluster.name=spring-partner
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:9200/_cluster/health | grep -qE '\"status\":\"(green|yellow)\"'"]
      interval: 10s
      timeout: 10s
      retries: 12
      start_period: 30s

  app-spring-partner:
    # existing fields unchanged, extend:
    depends_on:
      postgres-partner:
        condition: service_healthy
      elasticsearch-spring-partner:
        condition: service_healthy
```

### Modify: `partner/quarkus/docker-compose.yaml`

Add the ES service under the same `run-quarkus` profile as the rest of the Quarkus stack:

```yaml
services:
  elasticsearch-quarkus-partner:
    profiles: [run-quarkus]
    image: docker.elastic.co/elasticsearch/elasticsearch:8.17.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - xpack.security.http.ssl.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
      - cluster.name=quarkus-partner
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:9200/_cluster/health | grep -qE '\"status\":\"(green|yellow)\"'"]
      interval: 10s
      timeout: 10s
      retries: 12
      start_period: 30s

  app-quarkus-partner:
    # existing fields unchanged, extend:
    depends_on:
      postgres-quarkus-partner:
        condition: service_healthy
      elasticsearch-quarkus-partner:
        condition: service_healthy
```

No `ports:` mapping is needed on either ES service — backends reach them by service name on the shared Docker network, and no external tooling needs direct access. If ad-hoc inspection is needed, use `docker compose exec elasticsearch-spring-partner curl http://localhost:9200`.

Security is disabled (consistent with the project's demo posture — `postgres/postgres` credentials, self-signed certs, `insecureSkipVerify`). No Traefik labels — ES is internal infrastructure only.

---

## Index Mapping

**Index name**: `partners`

Complete `PUT /partners` request body — use this verbatim in `PartnerIndexService` for both backends:

```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "german_search": {
          "type": "german"
        },
        "autocomplete_index": {
          "tokenizer": "autocomplete_tokenizer",
          "filter": ["lowercase"]
        },
        "autocomplete_search": {
          "tokenizer": "standard",
          "filter": ["lowercase"]
        }
      },
      "tokenizer": {
        "autocomplete_tokenizer": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 20,
          "token_chars": ["letter", "digit"]
        }
      },
      "normalizer": {
        "lowercase_norm": {
          "type": "custom",
          "filter": ["lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "partnerNumber": { "type": "long" },
      "alphaCode": {
        "type": "keyword",
        "normalizer": "lowercase_norm"
      },
      "name1": {
        "type": "text",
        "analyzer": "german_search",
        "copy_to": "fullName",
        "fields": {
          "autocomplete": {
            "type": "text",
            "analyzer": "autocomplete_index",
            "search_analyzer": "autocomplete_search"
          }
        }
      },
      "name2": {
        "type": "text",
        "analyzer": "german_search",
        "copy_to": "fullName"
      },
      "name3": {
        "type": "text",
        "analyzer": "german_search",
        "copy_to": "fullName"
      },
      "firstname": {
        "type": "text",
        "analyzer": "german_search",
        "copy_to": "fullName",
        "fields": {
          "autocomplete": {
            "type": "text",
            "analyzer": "autocomplete_index",
            "search_analyzer": "autocomplete_search"
          }
        }
      },
      "fullName": {
        "type": "text",
        "analyzer": "german_search"
      },
      "street": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "houseNumber": {
        "type": "keyword",
        "index": false
      },
      "postalCode": { "type": "keyword" },
      "city": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "autocomplete": {
            "type": "text",
            "analyzer": "autocomplete_index",
            "search_analyzer": "autocomplete_search"
          }
        }
      },
      "type": { "type": "keyword" },
      "groupType": { "type": "keyword" },
      "groupNumber": { "type": "long" }
    }
  }
}
```

### Design notes

- `fullName` is declared explicitly so `german_search` is applied; it receives values via `copy_to` from `name1`, `name2`, `name3`, and `firstname` and is never written directly. A `match` query on `fullName^3` + individual fields gives both precision and recall.
- `.autocomplete` sub-fields on `name1`, `firstname`, and `city` use `autocomplete_index` at index time (edge_ngram) and `autocomplete_search` at query time (standard tokenizer). Without the explicit `search_analyzer`, ES would also edge_ngram the query term and massively over-match.
- `alphaCode` is a single `keyword` with `normalizer: lowercase_norm` — case-insensitive exact and prefix queries without a sub-field.
- `houseNumber` has `"index": false` — stored in `_source` for display but never queried.
- `max_gram: 20` (raised from 15) covers long German compound names up to 20 characters per token.

---

## Response Shape Change

Both backends extend their response to include dual-engine results. The existing `PartnerGroupSearchResponse` is wrapped:

```json
{
  "postgres": {
    "results": [ { "partnerNumber": 100001, "name1": "Müller GmbH", ... } ],
    "totalCount": 3,
    "returnedCount": 3,
    "durationMs": 12
  },
  "elasticsearch": {
    "results": [ { "partnerNumber": 100001, "name1": "Müller GmbH", "score": 4.23, ... } ],
    "totalCount": 3,
    "returnedCount": 3,
    "durationMs": 8
  },
  "query": {
    "name": "Müller",
    "city": "München"
  }
}
```

The `score` field on ES results is the raw `_score` from Elasticsearch. Results are ordered by score descending (ES) and by insertion order (Postgres — existing behaviour).

The existing `/search/structured` and `/search?q=` endpoints return this new shape. **This is a breaking change for the frontend**: the previous flat `partners` array is gone. The Angular app must be updated to read `postgres.results` — see the Frontend Changes section. No route or query-parameter changes are required.

---

## Spring Boot Integration

### Dependencies — `partner/spring/pom.xml`

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
</dependency>
```

### Configuration — `application.properties`

```properties
spring.elasticsearch.uris=http://elasticsearch-spring-partner:9200
```

### New classes under `partner/spring/src/main/java/com/example/partner/`

| Class | Package | Responsibility |
|-------|---------|---------------|
| `PartnerDocument` | `elasticsearch` | `@Document(indexName="partners")` — ES mapping POJO, separate from JPA `Partner` entity |
| `PartnerEsRepository` | `elasticsearch` | `ElasticsearchRepository<PartnerDocument, Long>` for simple operations |
| `PartnerIndexService` | `elasticsearch` | Creates index with custom mapping; bulk-indexes all partners from JPA on `ApplicationReadyEvent`; skips if index already healthy |
| `ElasticsearchPartnerSearchService` | `elasticsearch` | Builds `BoolQuery` via Spring Data Elasticsearch `NativeQuery`: `term` for partnerNr, `prefix` for alphaCode/postalCode, `multi_match` with `fuzziness: AUTO` across fullName/name1/name2/name3/firstname for name, `match` with `fuzziness: AUTO` for city/street. Returns `List<PartnerDocument>` with scores |
| `ElasticsearchCompletionService` | `elasticsearch` | **Replaces** the existing Postgres completion logic. Serves `GET /api/partner/complete`. Uses `prefix` query + `terms` aggregation for postalCode/alphaCode/partnerNumber; `match` on `.autocomplete` sub-field + `terms` agg for city/name. Response shape `{ completions: [{value, display}] }` is unchanged — no frontend changes needed |
| `DualRunSearchService` | `service` | Executes both `PartnerSearchService` (Postgres) and `ElasticsearchPartnerSearchService` in parallel (two virtual threads or `CompletableFuture`), merges results into `DualSearchResponse` |
| `DualSearchResponse` | `dto` | Wraps `postgres` + `elasticsearch` result blocks with timing |

### Controller changes — `PartnerSearchController` + `PartnerCompletionController`

- `PartnerSearchController`: inject `DualRunSearchService` instead of `PartnerSearchService`. Return type becomes `DualSearchResponse`. No route changes.
- `PartnerCompletionController`: inject `ElasticsearchCompletionService` instead of the existing Postgres completion service. Return type and route (`GET /api/partner/complete`) unchanged.

### Docker Compose — `partner/spring/docker-compose.yaml`

See the Infrastructure section above. `app-spring-partner` gains a `depends_on` entry for `elasticsearch-spring-partner`. No env var is needed — the hostname is hardcoded directly in `application.properties`.

---

## Quarkus Integration

### Dependencies — `partner/quarkus/pom.xml`

```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-elasticsearch-rest-client</artifactId>
</dependency>
```

Uses the low-level `RestClient` with manual JSON query construction (appropriate for a demo — keeps ES query structure explicit and readable).

### Configuration — `application.properties`

```properties
quarkus.elasticsearch.hosts=elasticsearch-quarkus-partner:9200
```

### New classes under `partner/quarkus/src/main/java/com/example/partner/`

| Class | Package | Responsibility |
|-------|---------|---------------|
| `PartnerIndexService` | `elasticsearch` | `@Observes StartupEvent` — creates index + bulk-indexes all Panache partners; skips if index healthy. Uses `RestClient` for HTTP calls to ES |
| `ElasticsearchSearchService` | `elasticsearch` | Builds ES bool query JSON manually; executes `POST /partners/_search`; parses hits into `PartnerDto` with score |
| `ElasticsearchCompletionService` | `elasticsearch` | **Replaces** the existing Panache completion logic. Serves `GET /api/partner/complete`. Same query logic as the Spring version, built manually via `RestClient`. Response shape unchanged — no frontend changes needed |
| `DualRunSearchService` | `service` | CDI `@ApplicationScoped` — parallel execution of Panache search + ES search; merges into `DualSearchResponse` |
| `DualSearchResponse` | `dto` | Same shape as Spring DTO (shared JSON contract) |

### Resource changes — `PartnerSearchResource` + `PartnerCompletionResource`

- `PartnerSearchResource`: inject `DualRunSearchService`. Return type becomes `DualSearchResponse`. No route changes.
- `PartnerCompletionResource`: inject `ElasticsearchCompletionService` instead of the existing Panache completion service. Return type and route (`GET /api/partner/complete`) unchanged.

### Docker Compose — `partner/quarkus/docker-compose.yaml`

See the Infrastructure section above. `app-quarkus-partner` gains a `depends_on` entry for `elasticsearch-quarkus-partner`. No env var is needed — the hostname is hardcoded directly in `application.properties`. Both services carry `profiles: [run-quarkus]`, so neither starts unless the profile is active.

---

## Search Improvements over PostgreSQL

| Capability | PostgreSQL (current) | Elasticsearch (new) |
|-----------|---------------------|---------------------|
| Name typo tolerance | None — `tsvector` requires correct spelling | `fuzziness: AUTO` allows 1–2 edits. "Muller" matches "Müller" |
| Multi-field name search | Spring: all name parts via `to_tsvector`; Quarkus: `name1` only | `multi_match` on fullName, name1–3, firstname with field boosting (fullName^3, name1^2) |
| Autocomplete quality | `DISTINCT ... LIKE prefix%` — exact prefix only | `edge_ngram` index — "Mün" matches "München" from position 0, works mid-word |
| City/street fuzzy | None | `match` with `fuzziness: AUTO` — "Munchen" → "München" |
| Relevance ordering | Insertion order | `_score` descending — best match first |
| German stemming | Spring only, via `plainto_tsquery('german',...)` | Both backends via `german` analyzer — "Versicherung" matches "Versicherungen" |

---

## Data Sync — Startup Reindex

**Spring**: `PartnerIndexService` listens on `ApplicationReadyEvent` (fires after the app is fully started, healthcheck passes). Steps:
1. Check if `partners` index exists and has documents — if yes, skip.
2. Create index with custom mapping (PUT `/partners`).
3. Load all partners via `PartnerRepository.findAll()`.
4. Bulk-index using `ElasticsearchOperations.save(Iterable)`.

**Quarkus**: `PartnerIndexService` observes `StartupEvent`. Same 3-step logic using `RestClient` POST to `/_bulk`.

With ~1000 partners the full reindex completes in under 500 ms. No incremental sync is needed for static demo data. If partners become mutable, a `@EntityListeners` on the JPA entity (Spring) or Panache `@PrePersist`/`@PostUpdate` (Quarkus) can trigger single-document updates.

---

## Frontend Changes

### Overview

The frontend has three concerns:
1. Adapt the API layer to the new `DualSearchResponse` shape (breaking change — the flat `partners` array is gone).
2. Feed the existing result table from `postgres.results` so existing behaviour is preserved.
3. Show a **source indicator** after each search: which engine's results are displayed and how long each engine took.

---

### 1. New TypeScript types

Add a new file `partner/frontend/src/app/api/model/dual-search-response.ts`:

```typescript
import { PartnerGroupSearchDto } from './partner-group-search-dto';
import { PartnerGroupSearchCriteriaSummary } from './partner-group-search-criteria-summary';

export interface SearchEngineResult {
  results: Array<PartnerGroupSearchDto>;
  totalCount: number;
  returnedCount: number;
  durationMs: number;
}

export interface DualSearchResponse {
  postgres: SearchEngineResult;
  elasticsearch: SearchEngineResult;
  query: Partial<PartnerGroupSearchCriteriaSummary>;
}
```

`PartnerGroupSearchResponse` is no longer returned by the search endpoint and can be kept only for type-checking the table inputs (its `partners` field maps to `SearchEngineResult.results`).

---

### 2. API service update — `partner-gateway.service.ts`

The file is OpenAPI-generated. Until the spec is regenerated, patch the return type manually in `searchPartnersAndGroups()` (line ~610):

```typescript
// Before
): Observable<PartnerGroupSearchResponse>

// After
): Observable<DualSearchResponse>
```

No other change in the HTTP call itself — the same 6 query params are sent.

---

### 3. Treetable service update — `partner-treetable.service.ts`

`PartnerTreetableService` currently reads `response.partners`. Change the data extraction to read from the `postgres` block and expose the full dual response for the indicator:

```typescript
// Add import
import { DualSearchResponse, SearchEngineResult } from '../api/model/dual-search-response';

// Replace the BehaviorSubject that held PartnerGroupSearchResponse
lastDualResponse = new BehaviorSubject<DualSearchResponse | null>(null);

// In the method that processes the HTTP response, replace:
//   this.setData(response.partners)
// with:
this.lastDualResponse.next(response);
this.setData(response.postgres.results);
```

`setData()` signature stays unchanged — it still receives `Array<PartnerGroupSearchDto>`.

---

### 4. Source indicator — inline in `partner-search.html`

Add a single `<div>` block between the chip-input area and the results table. No new component is needed.

**Template addition (`partner-search.html`)**:

```html
@if (partnerTreetableService?.lastDualResponse | async; as dual) {
  <div class="search-source-indicator">
    <span class="engine-badge engine-badge--active">
      PG {{ dual.postgres.durationMs }}&thinsp;ms
    </span>
    <span class="engine-badge"
          [class.engine-badge--faster]="dual.elasticsearch.durationMs < dual.postgres.durationMs">
      ES {{ dual.elasticsearch.durationMs }}&thinsp;ms
    </span>
  </div>
}
```

Placement: directly above `<partner-treetable>`, below `<shared-info-panel>` for the no-results state. This keeps the indicator visible even when the table is empty.

**Visual design rules:**
- `engine-badge--active`: the source whose results are currently shown (always `PG` for now — filled background, full opacity)
- `engine-badge--faster`: ES badge gets a small green accent when `elasticsearch.durationMs < postgres.durationMs`, so the user notices when ES would have been faster
- Both badges are always visible after a search, grayed out if 0 ms (shouldn't happen but guards against backend errors)
- The indicator disappears when no search has been performed (no `lastDualResponse` emitted)

**Styles addition (`partner-search.scss`)**:

```scss
.search-source-indicator {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 8px 0 4px;
  font-size: 11px;
  font-family: monospace;
}

.engine-badge {
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid currentColor;
  color: var(--mat-sys-outline);
  opacity: 0.6;
  transition: opacity 0.15s, background-color 0.15s;

  &--active {
    background-color: var(--mat-sys-primary-container);
    color: var(--mat-sys-on-primary-container);
    opacity: 1;
    border-color: transparent;
  }

  &--faster {
    color: var(--mat-sys-tertiary);
    border-color: var(--mat-sys-tertiary);
    opacity: 1;
  }
}
```

Uses Angular Material Design tokens so the indicator follows the app theme automatically.

---

### 5. What the indicator looks like

After a typical search:

```
[PG 14ms]  ES 9ms         ← ES was faster, gets green accent; PG results are shown
```

After a search where Postgres wins:

```
[PG 6ms]   ES 11ms        ← PG active and faster; ES badge is dimmed
```

The `[brackets]` denote the filled/active badge. The user can immediately read: "I'm seeing Postgres results, but Elasticsearch answered in 9 ms vs 14 ms."

---

### 6. No toggle in this iteration

Switching the displayed results between engines is deferred. The indicator is read-only for now. This avoids changing the treetable's data flow and keeps the scope minimal. A future toggle would change `lastDualResponse`'s active engine and re-call `setData()` with `elasticsearch.results`.

---

### Implementation steps (frontend only)

| Step | What | File |
|------|------|------|
| F1 | Add `DualSearchResponse` type | `api/model/dual-search-response.ts` |
| F2 | Patch return type in gateway service | `api/api/partner-gateway.service.ts` |
| F3 | Add `lastDualResponse` subject; read `postgres.results` | `services/partner-treetable-service/partner-treetable.service.ts` |
| F4 | Add indicator block | `components/pages/partner-search/partner-search.html` |
| F5 | Add indicator styles | `components/pages/partner-search/partner-search.scss` |
| F6 | Update E2E assertions to use `postgres.results` path | `tests/playwright/` |

---

## Testing Strategy

### Unit tests
- `ElasticsearchPartnerSearchServiceTest` (Spring): mock `ElasticsearchOperations`, assert query shape for each criteria combination
- `ElasticsearchSearchServiceTest` (Quarkus): assert JSON query string construction via string assertions or JSON path

### Integration tests
- Spring: `@Testcontainers` + `ElasticsearchContainer` in a `@SpringBootTest` test class. Seed index, call `/search/structured`, assert both `postgres` and `elasticsearch` blocks are populated
- Quarkus: `@QuarkusTest` + `ElasticsearchTestResource` backed by Testcontainers

### E2E tests
Existing Playwright tests that assert on the search response shape will fail after the backend change — the flat `partners` array is replaced by `postgres.results`. All such assertions must be updated as part of this work (implementation step 18). Once updated, add:
- Fuzzy name search: `q=Muller` returns `Müller GmbH` in the ES block
- Timing fields present: `durationMs` > 0 in both blocks
- Both blocks have same partner count for an exact query

---

## Implementation Sequence

| Step | What | Files |
|------|------|-------|
| 1 | Add `elasticsearch-spring-partner` service + wire `app-spring-partner` | `partner/spring/docker-compose.yaml` |
| 2 | Define `DualSearchResponse` DTO (Spring) | `partner/spring/.../dto/DualSearchResponse.java` |
| 3 | Add `spring-boot-starter-data-elasticsearch` | `partner/spring/pom.xml` |
| 4 | Create `PartnerDocument` + `PartnerIndexService` (Spring) | `partner/spring/.../elasticsearch/` |
| 5 | Create `ElasticsearchPartnerSearchService` (Spring) | `partner/spring/.../elasticsearch/` |
| 6 | Create `ElasticsearchCompletionService` (Spring); wire into `PartnerCompletionController` | `partner/spring/.../elasticsearch/`, `partner/spring/.../controller/` |
| 7 | Create `DualRunSearchService` (Spring) | `partner/spring/.../service/` |
| 8 | Update `PartnerSearchController` return type | `partner/spring/.../controller/PartnerSearchController.java` |
| 9 | Add `elasticsearch-quarkus-partner` service + wire `app-quarkus-partner` | `partner/quarkus/docker-compose.yaml` |
| 10 | Add `quarkus-elasticsearch-rest-client` | `partner/quarkus/pom.xml` |
| 11 | Create ES classes (Quarkus) | `partner/quarkus/.../elasticsearch/` |
| 12 | Create `ElasticsearchCompletionService` (Quarkus); wire into `PartnerCompletionResource` | `partner/quarkus/.../elasticsearch/`, `partner/quarkus/.../resource/` |
| 13 | Create `DualRunSearchService` (Quarkus) | `partner/quarkus/.../service/` |
| 14 | Update `PartnerSearchResource` return type | `partner/quarkus/.../resource/PartnerSearchResource.java` |
| 15 | Add integration tests | `partner/spring/src/test/...`, `partner/quarkus/src/test/...` |
| 16 | Add `DualSearchResponse` type | `partner/frontend/.../api/model/dual-search-response.ts` |
| 17 | Patch gateway service return type | `partner/frontend/.../api/api/partner-gateway.service.ts` |
| 18 | Add `lastDualResponse` subject; read `postgres.results` | `partner/frontend/.../services/partner-treetable-service/partner-treetable.service.ts` |
| 19 | Add indicator block + styles | `partner-search.html`, `partner-search.scss` |
| 20 | Update E2E test assertions | `tests/playwright/` |
| 21 | Update `SEARCH-ARCHITECTURE.md` | `SEARCH-ARCHITECTURE.md` |

Step 1 can be verified in isolation: `docker compose up elasticsearch-spring-partner && docker compose exec elasticsearch-spring-partner curl http://localhost:9200`. Steps 1–8 (Spring) and 9–14 (Quarkus) are independent and can proceed in parallel. Steps 16–19 (frontend) can start as soon as the backend response shape is final (after step 2).

---

**Note**: This plan will be executed in future steps. No code changes are made yet.
