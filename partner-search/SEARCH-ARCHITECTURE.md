# Search Architecture

This project has two search features:

- **Partner Search** — smart single-input field that tokenizes free text into structured criteria, executed against PostgreSQL using tsvector full-text search and trigram indexes.
- **Loan Search** — traditional multi-field form with 9 individual parameters and no tokenization.

The Partner Search tokenizer pipeline is replicated in three languages (TypeScript, Java/Spring, Java/Quarkus) so that the frontend can provide live chip feedback while the backend executes the same classification logic for query construction.

```
Browser  →  Angular (tokenize + chips)  →  GET /api/partner/spring/search?q=
                                               GET /api/partner/spring/search/postgres?q=
                                               GET /api/partner/spring/search/elasticsearch?q=
                                               GET /api/partner/quarkus/search/postgres?q=
                                               GET /api/partner/quarkus/search/elasticsearch?q=
                                                      |
                                         Traefik  PathPrefix(/api/partner/spring)  priority 1000
                                                  PathPrefix(/api/partner/quarkus) priority 1000
                                                      |
                              +-----------------------+-----------------------+
                              |                                               |
                     app-spring-partner                            app-quarkus-partner
                  (Spring Boot + JPA)                         (Quarkus + Panache)
                              |                                               |
                  +-----------+-----------+                     +-------------+
                  |                       |                     |             |
           postgres-partner     elasticsearch-partner    postgres-partner  elasticsearch-partner
          (shared, tsvector +  (shared, german analyzer, (same container)  (same container)
           trgm)                fuzzy, edge_ngram)
```

Both backends share a single `postgres-partner` container (Flyway distributed lock prevents
migration conflicts) and a single `elasticsearch-partner` container (`PartnerIndexService`
checks `indexHasDocuments()` before seeding — the second backend to boot skips reindexing).

---

## API Contract

### Partner Search Endpoints

| Method | Path | Key parameters | Response |
|--------|------|---------------|----------|
| `GET` | `/api/partner/search` | `q=<raw text>` — tokenized on the server | `PartnerGroupSearchResponse` |
| `GET` | `/api/partner/search/structured` | `partnerNr`, `alphaCode`, `name`, `postalCode`, `city`, `street` (all optional) | `PartnerGroupSearchResponse` |
| `GET` | `/api/partner/complete` | `field` (required), `prefix` (required), `limit` (default 15) | `CompletionResponse` |

The frontend always calls `/search/structured` after tokenizing the raw input client-side. The `/search?q=` endpoint tokenizes server-side and is available for direct API use.

**`SearchCriteria` fields**

| Field | Type | Notes |
|-------|------|-------|
| `partnerNr` | String | Substring match on `partner_number::text` |
| `alphaCode` | String | `*` replaced with `%` for ILIKE |
| `name` | String | Full-text search (Spring) or LIKE (Quarkus) |
| `postalCode` | String | `*` replaced with `%` for LIKE |
| `city` | String | Case-insensitive LIKE with `%` wrapping |
| `street` | String | Case-insensitive LIKE with `%` wrapping |

**Response shape**

Both backends return a `DualSearchResponse` that wraps parallel results from PostgreSQL and Elasticsearch:

```json
{
  "postgres":      { "results": [...], "totalCount": 3, "returnedCount": 3, "durationMs": 12 },
  "elasticsearch": { "results": [...], "totalCount": 3, "returnedCount": 3, "durationMs": 8 },
  "query":         { "city": "München" }
}
```

The `returnedCount` reflects the applied `partner.search.max-results` limit (default 200). Results in the `postgres` block are ordered by insertion order; results in the `elasticsearch` block are ordered by `_score` descending.

**Completion endpoint** returns per-field prefix suggestions for the autocomplete dropdown:

```
GET /api/partner/complete?field=postalCode&prefix=331&limit=15
→ { "completions": [{ "value": "33100", "display": "33100 Paderborn" }, ...] }
```

Valid `field` values: `postalCode`, `city`, `street`, `alphaCode`, `partnerNumber`, `name`. Unknown field returns HTTP 400.

---

## Tokenizer Pipeline

### Concept

```
raw input string
      │
      ▼
 QuerySplitter         splits on whitespace; respects double-quoted spans
      │                (e.g. `"Max Mustermann"` stays one token)
      ▼
 RawToken[]
      │
      ▼ (for each token, in priority order)
 TokenClassifier[]     first classifier whose canClassify() returns true wins
      │
      ▼
 RecognizedToken[]
      │
      ▼
 Name merging          consecutive name tokens collapsed into one
      │
      ▼
 SearchCriteria        passed to the search service / API
```

The `ClassificationContext` tracks which fields have already been claimed. Each field can only be claimed once per query — a second token of the same type falls through to a lower-priority classifier.

### Classifier Reference

| Priority | Classifier | Target Field | Match Rule |
|----------|-----------|-------------|------------|
| 10 | `ExplicitPrefixClassifier` | varies | Token starts with a known prefix (`nr:`, `code:`, `name:`, `str:`, `strasse:`, `plz:`, `zip:`, `stadt:`, `city:`). Token state becomes LOCKED — not subject to reconsideration. |
| 20 | `PartnerNumberClassifier` | *(removed — numeric tokens fall through to FallbackName)* | Numeric-only tokens are no longer routed to an exact partner-number lookup; they become substring tokens matching any field that contains the digits. |
| 30 | `PostalCodeClassifier` | `postalCode` | `/^[0-9]{3,5}\*?$/` — 3–5 digits with optional wildcard |
| 40 | `StreetClassifier` | `street` | Token ends with a German street suffix: `straße`, `strasse`, `str.`, `str`, `weg`, `allee`, `platz`, `gasse`, `ring`, `damm`, `ufer`, `stieg` |
| 50 | `AlphaCodeClassifier` | `alphacode` | `/^(?=[A-Z0-9]*[A-Z])[A-Z0-9]{3,10}\*?$/` — 3–10 uppercase alphanumeric with at least one letter |
| 60 | `CityClassifier` | `city` | `/^[\p{L}.\-]{2,35}$/u` Unicode word — **only when the raw input contains a single word token** (multi-word queries let single words fall through to FallbackName) |
| 999 | `FallbackNameClassifier` | `name` | Always matches. Does not claim the field — allows multiple name tokens. |

### Name Merging

After classification, consecutive `name` tokens are collapsed into a single token. `Max Mustermann` becomes one token with value `"Max Mustermann"`. This merged value is passed directly to the name search predicate.

### Worked Examples

| Input | Tokens | Resulting `SearchCriteria` |
|-------|--------|---------------------------|
| `33100 Paderborn` | postalCode:33100, city:Paderborn | postalCode=`33100`, city=`Paderborn` |
| `1234567 München Musterstraße` | name:1234567, city:München, street:Musterstraße | name=`1234567` (substring), city=`München`, street=`Musterstraße` |
| `nr:33100` | [ExplicitPrefix→partnerNr]:33100 | partnerNr=`33100` (explicit prefix overrides natural 5-digit postalCode classification) |
| `Max Mustermann` | name:Max, name:Mustermann → merged → name:"Max Mustermann" | name=`Max Mustermann` |

### Three-Layer Parity

The tokenizer is implemented identically in three places:

| Layer | Location |
|-------|----------|
| TypeScript (Angular) | `partner/frontend/src/app/services/partner-search-tokenizer.service.ts` + `classifiers/` |
| Java — Spring | `partner/spring/src/main/java/com/example/partner/search/` |
| Java — Quarkus | `partner/quarkus/src/main/java/com/example/partner/search/` |

The frontend tokenizes for immediate visual feedback (chip display, autocomplete triggers, alternatives). The backend tokenizes the `/search?q=` endpoint for query construction. Both follow identical classification rules.

---

## Frontend Architecture

### Component and State

`PartnerSearch` (`partner/frontend/src/app/components/pages/partner-search/partner-search.ts`) uses Angular Signals — no NgRx or external state library:

| Signal | Type | Purpose |
|--------|------|---------|
| `recognizedTokens` | `RecognizedToken[]` | Current tokenized query state |
| `activeCompletions` | `CompletionItem[]` | Dropdown suggestions for the active token |
| `searchPerformed` | `boolean` | Whether a search has been executed |
| `hasResults` | `boolean` | Whether results are present |
| `examplesVisible` | `boolean` | Examples panel toggle (persisted to localStorage) |

A single `FormControl<string>` with **300 ms debounce** triggers retokenization on every change.

### Token Lifecycle

```
INCOMPLETE  →  CLASSIFYING  →  COMPLETING  →  SUGGESTED  →  CONFIRMED
                                                                  ↑
                                                               LOCKED  (explicit prefix)
```

Each token renders as a Material chip. Chips are color-coded by state and show icons (spinner, check, lock). The `activeToken` computed signal identifies the last non-CONFIRMED, non-LOCKED token as the one eligible for autocomplete.

### Autocomplete Flow

1. When the active token reaches 2+ characters, `PartnerCompletionService` fires `GET /api/partner/complete?field=...&prefix=...&limit=15` (debounced 150 ms, `switchMap` cancels previous in-flight request).
2. Results populate the Material Autocomplete dropdown with display-enriched labels (e.g. `"33100 Paderborn"`).
3. Selecting a completion **splices** the completed value into the raw input string at the token's `startIndex`/`endIndex` character offsets and marks the token CONFIRMED.

### URL Deep-Linking

- After each search, `?q=<rawQuery>` is written to the URL via `Router.navigate` with `queryParamsHandling: 'replace'`.
- On page load, `?q=` is read and the search auto-executes.
- **Backward compatibility**: if old 6-param URLs are detected (`?partnerNr=...&alphacode=...`), `TokenizerService.detokenize()` reconstructs an explicit-prefix string (e.g. `plz:33100 stadt:Paderborn`) and proceeds normally.

### Results

Displayed in a `<partner-treetable>` component. Type `V` (Verbund/Group) rows are expandable — clicking loads group members lazily via `GET /api/partner/groups/{groupNumber}/members`.

---

## Database Schema and Search Techniques

### Schema

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE partner (
    id              BIGSERIAL PRIMARY KEY,
    partner_number  BIGINT UNIQUE,
    alpha_code      VARCHAR(10),
    name1           VARCHAR(35),
    name2           VARCHAR(35),
    name3           VARCHAR(35),
    firstname       VARCHAR(35),
    street          VARCHAR(35),
    house_number    VARCHAR(10),
    postal_code     VARCHAR(5),
    city            VARCHAR(35),
    type            CHAR(1) NOT NULL DEFAULT 'P',   -- 'P'artner or 'V'erbund (group)
    group_type      VARCHAR(10),
    group_number    BIGINT,
    name_search_vec TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('german',
            coalesce(name1,'') || ' ' || coalesce(name2,'') || ' ' ||
            coalesce(name3,'') || ' ' || coalesce(firstname,''))
    ) STORED
);
```

`name_search_vec` is a DB-managed stored column — it is not mapped to JPA/Panache. The German text search configuration applies stemming (e.g. "Versicherung" matches "Versicherungen").

### Index Strategy

| Index | Type | Expression | Used for |
|-------|------|------------|----------|
| `idx_partner_postal_code` | B-tree | `postal_code` | `LIKE '331%'` prefix search |
| `idx_partner_alpha_code` | B-tree | `alpha_code` | `ILIKE 'FISCH%'` prefix search |
| `idx_partner_name_tsv` | GIN | `name_search_vec` | `@@ plainto_tsquery(...)` full-text |
| `idx_partner_city_trgm` | GIN (pg_trgm) | `lower(city)` | `LIKE '%mun%'` substring search |
| `idx_partner_street_trgm` | GIN (pg_trgm) | `lower(street)` | `LIKE '%haupt%'` substring search |
| `idx_partner_name1_trgm` | GIN (pg_trgm) | `lower(name1)` | Quarkus LIKE fallback for name |

### Search Operators by Field

| Field | Spring Boot | Quarkus |
|-------|-------------|---------|
| `partnerNr` | `partner_number::text LIKE ?` (`%token%` substring) | `partner_number::text LIKE :partnerNr` (`%token%` substring) |
| `alphaCode` | `alpha_code ILIKE ?` (`*`→`%`) | `lower(alphaCode) LIKE lower(:alphaCode)` with auto-appended `%` |
| `name` | `name_search_vec @@ plainto_tsquery('german', ?)` | `lower(name1) LIKE lower(:name)` with `%` wrapping |
| `postalCode` | `postal_code LIKE ?` (`*`→`%`) | `postalCode LIKE :postalCode` with auto-appended `%` |
| `city` | `lower(city) LIKE lower(?)` (`*`→`%`) | `lower(city) LIKE lower(:city)` with `%` wrapping |
| `street` | `lower(street) LIKE lower(?)` (`*`→`%`) | `lower(street) LIKE lower(:street)` with `%` wrapping |

**Key difference**: Spring uses PostgreSQL `tsvector` with German stemming for the `name` field. This means searching "Versicherung" also matches "Versicherungen". Quarkus uses a plain `LIKE` on `name1` only — a deliberate contrast to demonstrate both approaches side by side.

Both services build the SQL dynamically, appending only the predicates for non-null, non-blank criteria fields. The query ends with `LIMIT <maxResults>` (default 200).

---

## Elasticsearch Integration

Both Spring and Quarkus backends run a dual-engine search on every request, executing the same `SearchCriteria` against PostgreSQL and Elasticsearch in parallel and returning results from both in a single `DualSearchResponse`.

### Search Operators Comparison

| Capability | PostgreSQL (current) | Elasticsearch (new) |
|-----------|---------------------|---------------------|
| Name typo tolerance | None — `tsvector` requires correct spelling | Wildcard `*token*` is case-insensitive. "mull" matches "Müller"; exact typos (e.g. "Muller") do not match without the umlaut. |
| Multi-field name search | Spring: all name parts via `to_tsvector`; Quarkus: `name1` only | `multi_match` on fullName, name1–3, firstname with field boosting (fullName^3, name1^2) |
| Autocomplete quality | `DISTINCT ... LIKE prefix%` — exact prefix only | `edge_ngram` index — "Mün" matches "München" from position 0, works mid-word |
| City/street fuzzy | None | `match` with `fuzziness: AUTO` — "Munchen" → "München" |
| Relevance ordering | Insertion order | `_score` descending — best match first |
| German stemming | Spring only, via `plainto_tsquery('german',...)` | Both backends via `german` analyzer — "Versicherung" matches "Versicherungen" |

### Index Mapping (`partners` index)

| Field | ES type | Analyzer / Normalizer |
|-------|---------|-----------------------|
| `partnerNumber` | `long` | — |
| `alphaCode` | `keyword` | `lowercase_norm` normalizer (case-insensitive exact/prefix) |
| `name1` | `text` + `.autocomplete` sub-field | `german_search`; sub-field uses `autocomplete_index` / `autocomplete_search` |
| `name2` | `text` | `german_search`; `copy_to: fullName` |
| `name3` | `text` | `german_search`; `copy_to: fullName` |
| `firstname` | `text` + `.autocomplete` sub-field | `german_search`; sub-field uses `autocomplete_index` / `autocomplete_search` |
| `fullName` | `text` | `german_search`; populated via `copy_to` from name1–3 and firstname; never written directly |
| `street` | `text` + `.keyword` sub-field | `standard` analyzer |
| `houseNumber` | `keyword` | `"index": false` — stored for display, never queried |
| `postalCode` | `keyword` | — |
| `city` | `text` + `.autocomplete` sub-field | `standard` analyzer; sub-field uses `autocomplete_index` / `autocomplete_search` |
| `type` | `keyword` | — |
| `groupType` | `keyword` | — |
| `groupNumber` | `long` | — |

The `autocomplete_index` analyzer uses an `edge_ngram` tokenizer (`min_gram: 2`, `max_gram: 20`) at index time and the `standard` tokenizer at query time (`autocomplete_search`), preventing over-matching when the query term is also edge-ngrammed.

### Startup Reindex

`PartnerIndexService` seeds the Elasticsearch index from Postgres on startup and skips
reindexing if the index already contains documents (`indexHasDocuments()` check).

- **Spring**: listens on `ApplicationReadyEvent`; loads all partners via
  `PartnerRepository.findAll()`; bulk-indexes using `ElasticsearchOperations.save(Iterable)`.
- **Quarkus**: observes `StartupEvent`; pages through all Panache partners in batches of 1000
  (`Partner.findAll().page(page, 1000)`); bulk-indexes each page via `RestClient` POST to
  `/_bulk`.

With the shared `elasticsearch-partner` container the second backend to boot will find the
index already populated and skip reindexing entirely, logging:
`ES index 'partners' already has documents — skipping reindex.`

No incremental sync is needed for static demo data.

---

## Routing

Each backend owns a distinct Traefik path prefix so both run simultaneously without conflict:

| Service | Rule | Priority |
|---------|------|----------|
| `app-spring-partner` | `PathPrefix(/api/partner/spring)` | 1000 |
| `app-quarkus-partner` | `PathPrefix(/api/partner/quarkus)` | 1000 |

Equal priorities are safe because the prefixes never overlap (see ADR-0002). Both services
are always active — no Docker Compose profile required.

The Angular frontend fires all four `(framework × engine)` requests in parallel via `forkJoin`
and aggregates them into a `QuadSearchResponse`. The Playwright API tests target each backend
directly by its prefix:

```typescript
await request.get('/api/partner/spring/search?q=München')
await request.get('/api/partner/quarkus/search?q=München')
```

---


---

## Test Strategy

```
          /\
         /  \  UI E2E         Playwright browser
        /----\
       /      \  API E2E      Playwright request-only
      /--------\
     /          \  Integration  SpringBootTest (MockMvc) + QuarkusTest (RestAssured)
    /------------\
   /              \  Unit       Vitest (TypeScript) + JUnit pure (no framework context)
  /______________  \
```

All layers anchor to the same seed data in `partner/*/src/main/resources/db/migration/V2__seed_demo_partners.sql` (52 partners: 45 type P, 6 type V, partner numbers 100001–100045 and 200001–200006).

### Unit Tests (no framework context)

| File | Framework | What it tests |
|------|-----------|---------------|
| `partner/frontend/src/app/services/partner-search-tokenizer.service.spec.ts` | Vitest | 25+ cases: tokenize(), buildCriteria(), detokenize(), round-trips, alternatives |
| `partner/spring/src/test/java/.../TokenizerPipelineTest.java` | JUnit 5 | Direct instantiation of pipeline + 7 classifiers |
| `partner/quarkus/src/test/java/.../TokenizerPipelinePureTest.java` | JUnit 5 | Same pattern, no Quarkus context |
| `partner/spring/src/test/java/.../elasticsearch/ElasticsearchPartnerSearchServiceTest.java` | JUnit 5 + Mockito | Mocks ElasticsearchOperations; verifies search called, document mapping, error fallback |
| `partner/quarkus/src/test/java/.../elasticsearch/ElasticsearchSearchServiceTest.java` | JUnit 5 | Direct instantiation; 9 cases asserting JSON query shape per criteria field |

### Integration Tests

| File | Framework | Highlights |
|------|-----------|-----------|
| `partner/spring/src/test/java/.../controller/PartnerSearchControllerTest.java` | `@SpringBootTest` + MockMvc | City/partnerNr/alphaCode/postalCode searches; combined criteria; empty result; 404 on detail |
| `partner/quarkus/src/test/java/.../TokenizerPipelineTest.java` | `@QuarkusTest` + RestAssured | `/search?q=`, `/complete`, `/search/structured`, `/q/health` |

### E2E API Tests

| File | Tool | Highlights |
|------|------|-----------|
| `tests/playwright/e2e/partner-search.spec.ts` | Playwright `request` | No browser; city/partnerNr/alphaCode/postalCode/empty/unknown/multi-word/fuzzy/timing assertions. Calls `/api/partner/spring/search?q=`. |

### E2E UI Tests

| File | Tool | Highlights |
|------|------|-----------|
| `tests/playwright/e2e/partner-search-ui.spec.ts` | Playwright browser | 8 tests; typing + Enter, live search, result rows, chip appearance, reset, no-results panel |
