---
id: PARTNER-SEARCH-003
status: done
domain: partner-search
area: elasticsearch
---

## Goal

Enable German umlaut-equivalent search so that `mueller` finds `Müller`, `schoen`
finds `Schön`, and `munchen` finds `München`. Apply the fix to both search engines
(Elasticsearch and PostgreSQL) in both backends (Spring and Quarkus) so the
dual-engine comparison remains meaningful.

## Context

**Current behaviour:**
- `q=Mull` finds `Müller` because `*mull*` is a substring of `Müller` (ü contains "u").
- `q=Mueller` does **not** find `Müller` — `ue` is not a substring of `ü`.
- `q=munchen` does **not** find `München` — `u` ≠ `ü`.

**Elasticsearch fix — ASCII folding + umlaut char_filter:**
Both Spring (`partner-search/spring/…/elasticsearch/PartnerIndexService.java`) and
Quarkus (`partner-search/quarkus/…/elasticsearch/PartnerIndexService.java`) define
`INDEX_MAPPING` as an inline JSON constant. The analysis section must:
1. Add `asciifolding` token filter to `german_search` and `autocomplete_index`
   analyzers so that at index time `Müller` is stored as both `Müller` and `muller`.
2. Add a `char_filter` of type `mapping` named `umlaut_mapping` that expands umlauts
   at query time: `ä→ae`, `ö→oe`, `ü→ue`, `ß→ss` (and uppercase variants `Ä→Ae`,
   `Ö→Oe`, `Ü→Ue`). Attach this char_filter to `german_search` and
   `autocomplete_search` analyzers.

Because the index mapping changes, the `partners` index must be deleted and rebuilt.
`PartnerIndexService` already deletes and recreates the index when it finds 0 documents.
**To force a full rebuild, run `make down && make up` after deploying this change.** (`make down` removes all volumes including `es-partner-search-data`.)

The ES search services must also emit **two** wildcard clauses per token — one for the
original token, one for the umlaut-expanded form (OR) — so that a query for `mueller`
generates `*mueller*` AND `*müller*`-equivalent coverage even before the char_filter
acts.

**Postgres fix — `unaccent` extension:**
PostgreSQL's `unaccent` extension strips diacritic marks:
`unaccent('Müller') = 'Muller'`. The LIKE predicates in both
`PartnerSearchService.java` files must wrap text columns and the search token:
`unaccent(lower(name1)) LIKE unaccent(lower(?))`.
The extension is enabled via a new Flyway migration owned by `partner-edit` (next
version: V7).

`partner_number::text LIKE ?` and `postal_code LIKE ?` are left unchanged — those
fields contain no diacritics.

**Frontend:** no changes — the raw `q=` string is passed through unchanged;
normalisation happens entirely on the backend.

## Acceptance criteria

- [ ] `GET /api/partner/spring/search?q=Mueller` returns ≥1 result with
  `elasticsearch.results[*].name1` containing `Müller`.
- [ ] `GET /api/partner/spring/search?q=Mueller` returns ≥1 result with
  `postgres.results[*].name1` containing `Müller` (seed partner 100001).
- [ ] `GET /api/partner/spring/search?q=munchen` returns ≥1 result with
  `elasticsearch.results[*].city` equal to `München`.
- [ ] `GET /api/partner/spring/search?q=munchen` returns ≥1 result with
  `postgres.results[*].city` equal to `München`.
- [ ] `GET /api/partner/quarkus/search?q=Mueller` returns ≥1 result with
  `elasticsearch.results[*].name1` containing `Müller`.
- [ ] `GET /api/partner/quarkus/search?q=Mueller` returns ≥1 result with
  `postgres.results[*].name1` containing `Müller`.
- [ ] All existing e2e tests in `tests/playwright/e2e/partner-search.spec.ts` pass
  unchanged (especially `q=Mull` wildcard test and München tests).
- [ ] New e2e test in `tests/playwright/e2e/partner-search.spec.ts` describe block
  `"Umlaut-equivalent search"`: `GET /api/partner/spring/search?q=Mueller` returns
  a result with `name1` containing `Müller` in both `postgres.results` and
  `elasticsearch.results`.

## Files affected

**Created:**
- `partner-edit/spring/src/main/resources/db/migration/V7__add_unaccent.sql`
  — `CREATE EXTENSION IF NOT EXISTS unaccent;`

**Modified:**
- `partner-search/spring/src/main/java/com/example/partner/elasticsearch/PartnerIndexService.java`
  — add `umlaut_mapping` char_filter + `asciifolding` token filter to `german_search`
  and `autocomplete_index`/`autocomplete_search` analyzers in `INDEX_MAPPING`
- `partner-search/quarkus/src/main/java/com/example/partner/elasticsearch/PartnerIndexService.java`
  — same `INDEX_MAPPING` change as Spring
- `partner-search/spring/src/main/java/com/example/partner/elasticsearch/ElasticsearchPartnerSearchService.java`
  — add private `expandUmlauts(String token)` method mapping `ä→ae, ö→oe, ü→ue,
  ß→ss, Ä→Ae, Ö→Oe, Ü→Ue`; in `search()`, for each token emit two wildcard
  clauses in the inner bool `should`: `*original*` and `*expanded*`
  (if expanded == original, emit only one)
- `partner-search/quarkus/src/main/java/com/example/partner/elasticsearch/ElasticsearchSearchService.java`
  — same dual-wildcard + `expandUmlauts` change as Spring
- `partner-search/spring/src/main/java/com/example/partner/service/PartnerSearchService.java`
  — wrap text columns and parameter: `unaccent(lower(name1)) LIKE unaccent(lower(?))`,
  same for `name2`, `name3`, `firstname`, `city`, `street`, `alpha_code`; leave
  `partner_number::text LIKE ?` and `postal_code LIKE ?` unchanged
- `partner-search/quarkus/src/main/java/com/example/partner/service/PartnerSearchService.java`
  — same `unaccent` wrapping as Spring
- `tests/playwright/e2e/partner-search.spec.ts`
  — add describe block `"Umlaut-equivalent search"` with the new `q=Mueller` test

## Deferred

- Frontend umlaut normalisation — not needed since the raw query goes to the backend.
- Phonetic matching (Soundex/Metaphone) — out of scope.
- Adding `unaccent`-expression GIN indexes for `city`/`street` — the predicate will
  do a sequential scan until indexed; deferred as a separate performance ticket.
- `ss` ↔ `ß` in Postgres — `unaccent` handles `ß→ss` automatically.

## Dependencies

- PARTNER-SEARCH-002 — done (establishes the push-payload reindex pattern; this
  ticket modifies the same ES service files and must follow it)

## Token usage

Last updated: 2026-04-22 15:37 UTC — sessions counted: 2

| Metric | Tokens |
|--------|--------|
| Input | 40,292 |
| Cache creation | 482,854 |
| Cache read | 27,566,930 |
| **Total input** | **28,090,076** |
| Output | 60,245 |
| **Grand total** | **28,150,321** |

<!-- tracked-agents: agent-a2c8f1f1d52ef8792,agent-aa6a7ba05b86e6a27 -->
