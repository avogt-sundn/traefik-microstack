# ADR-0010: Migrate Quarkus ES Layer from `RestClient` to `ElasticsearchClient`

**Date**: 2026-04-16  
**Status**: Accepted  
**Scope**: `partner/quarkus` — `ElasticsearchSearchService`, `ElasticsearchCompletionService`, `PartnerIndexService`

---

## Context

The original Quarkus Elasticsearch integration used `quarkus-elasticsearch-rest-client`, which exposes the Apache HTTP-level `RestClient`. This is the lowest possible abstraction: every request is a manually assembled HTTP call, and every response is a raw byte stream that must be parsed by hand.

The Quarkus ecosystem also ships `quarkus-elasticsearch-java-client`, which wraps the official Elasticsearch Java API Client. This client provides a type-safe, fluent DSL — the same underlying library that Spring Data Elasticsearch builds its `ElasticsearchOperations` abstraction on top of.

This ADR documents why the switch was made and what was gained and lost.

---

## Code comparison: Search

### Before — `RestClient` (90 lines for search alone)

```java
// ElasticsearchSearchService.java (before)
public List<PartnerGroupSearchDto> search(List<String> tokens) {
    try {
        String query = buildQuery(tokens);              // 25 lines of string manipulation
        Request req = new Request("POST", "/partners/_search");
        req.setJsonEntity(query);
        Response resp = restClient.performRequest(req);
        String body = new String(resp.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8);
        return parseHits(body);                        // 130 lines of hand-written JSON parser
    } catch (Exception e) { ... }
}

String buildQuery(List<String> tokens) {
    // Builds:  {"query":{"bool":{"must":[{"bool":{"minimum_should_match":1,"should":[
    //            {"wildcard":{"name1":{"value":"*token*","case_insensitive":true}}},
    //            ...9 fields...
    //          ]}}]}},"size":200}
    List<String> mustClauses = new ArrayList<>();
    for (String token : tokens) {
        String escaped = jsonEscape(token.toLowerCase()); // manual escape
        String wildcardValue = "*" + escaped + "*";
        List<String> shouldClauses = new ArrayList<>();
        for (String field : List.of("name1","name2","name3","firstname","city","street")) {
            shouldClauses.add("{\"wildcard\":{\"" + field + "\":{\"value\":\""
                + wildcardValue + "\",\"case_insensitive\":true}}}");
        }
        shouldClauses.add("{\"wildcard\":{\"alphaCode\":{...}}}");
        shouldClauses.add("{\"wildcard\":{\"postalCode\":{...}}}");
        shouldClauses.add("{\"wildcard\":{\"partnerNumber.keyword\":{...}}}");
        mustClauses.add("{\"bool\":{\"minimum_should_match\":1,\"should\":["
            + String.join(",", mustClauses) + "]}}");
    }
    return "{\"query\":{\"bool\":{\"must\":[" + String.join(",", mustClauses) + "]}},\"size\":200}";
}
```

### After — `ElasticsearchClient` (60 lines total including `toDto`)

```java
// ElasticsearchSearchService.java (after)
public List<PartnerGroupSearchDto> search(List<String> tokens) {
    try {
        BoolQuery.Builder bool = new BoolQuery.Builder();
        if (tokens == null || tokens.isEmpty()) {
            bool.must(m -> m.matchAll(ma -> ma));
        } else {
            for (String token : tokens) {
                String wc = "*" + token.toLowerCase() + "*";
                bool.must(mu -> mu.bool(inner -> inner
                    .should(s -> s.wildcard(w -> w.field("name1").value(wc).caseInsensitive(true)))
                    // ... 8 more fields, same pattern
                    .minimumShouldMatch("1")));
            }
        }
        SearchResponse<PartnerDocument> resp = esClient.search(s -> s
                .index("partners").size(200)
                .query(q -> q.bool(bool.build())),
            PartnerDocument.class);
        return resp.hits().hits().stream().map(h -> toDto(h.source())).toList();
    } catch (Exception e) { ... }
}
```

---

## Code comparison: Completion

### Before — `RestClient` + hand-rolled aggregation parser (191 lines)

The completion query was built as a multi-line JSON string with `%s` formatting and `.replaceAll("\\s+", " ")` to collapse whitespace. The aggregation response was parsed by:

1. `body.indexOf("\"" + aggName + "\":{")` — find the aggregation block by string scanning
2. `findMatchingBracket()` — 30-line bracket-depth tracker to find the end of the object
3. `splitJsonObjects()` — 15-line function to split the `buckets` array into individual hit strings
4. `parseString()` — field extraction by `indexOf` + manual quote scanning

Total: ~130 lines of JSON infrastructure that reimplements a subset of a JSON parser, with no error recovery for malformed responses.

### After — `ElasticsearchClient` (65 lines)

```java
SearchResponse<Void> resp = esClient.search(s -> s
    .index("partners").size(0)
    .query(q -> q.bool(b -> b
        .minimumShouldMatch("1")
        .should(sh -> sh.match(m -> m.field("name1.autocomplete").query(p)))
        // ...
        .should(sh -> sh.prefix(pr -> pr.field("postalCode").value(p)))))
    .aggregations("name1_terms", a -> a.terms(t -> t.field("name1.keyword").size(size)))
    // ... 3 more
    , Void.class);

resp.aggregations().get("name1_terms").sterms().buckets().array().stream()
    .map(StringTermsBucket::key)
    .map(FieldValue::stringValue)
    .filter(v -> v.toLowerCase().startsWith(pLower))
    .forEach(seen::add);
```

The entire aggregation traversal is two method chains. No bracket counting, no string scanning, no `indexOf`.

---

## Code comparison: Index management (`PartnerIndexService`)

### Before

`indexHasDocuments()` — string-scanned the `{"count":N,...}` response body character by character to extract the integer. `bulkIndex()` — hand-built the NDJSON bulk payload with `StringBuilder`, manual `toJson()` that called `appendString()` / `appendLong()` helpers replicating Jackson behaviour.

### After

```java
// Count
long count = esClient.count(c -> c.index("partners")).count();

// Bulk index
List<BulkOperation> ops = partners.stream()
    .map(p -> BulkOperation.of(op -> op
        .index(i -> i.index("partners").id(String.valueOf(p.partnerNumber))
                     .document(toDocument(p)))))
    .toList();
esClient.bulk(BulkRequest.of(r -> r.operations(ops)));
```

Jackson handles serialization of `PartnerDocument` — no manual field enumeration.

---

## Quantitative diff

| Metric | Before | After | Delta |
|---|---|---|---|
| `ElasticsearchSearchService` lines | 237 | 67 | −72% |
| `ElasticsearchCompletionService` lines | 191 | 68 | −64% |
| `PartnerIndexService` lines | 184 | 128 | −30% |
| **Total ES layer lines** | **612** | **263** | **−57%** |
| Custom JSON parser methods | 5 (`parseString`, `parseLong`, `parseFloat`, `findMatchingBracket`, `splitJsonObjects`) | 0 | −5 |
| Manual JSON builder methods | 3 (`buildQuery`, `toJson`, `appendString`/`appendLong`) | 0 | −3 |
| Test lines (ES unit tests) | 134 | 95 | −29% |

---

## Comparison with Spring

The Spring backend uses `spring-data-elasticsearch` / `ElasticsearchOperations`, which sits one level above the Java API Client. The Quarkus `ElasticsearchClient` is the shared underlying library — the DSL (`BoolQuery.Builder`, `WildcardQuery`, etc.) is now structurally identical between the two backends.

| Aspect | Spring | Quarkus (after) | Quarkus (before) |
|---|---|---|---|
| Client abstraction | `ElasticsearchOperations` | `ElasticsearchClient` | `RestClient` |
| Query building | `NativeQuery` + `BoolQuery.Builder` | `BoolQuery.Builder` directly | String concatenation |
| Response deserialization | `@Document`-annotated class | `@JsonIgnoreProperties` POJO | Hand-written parser |
| Score access | `hit.getScore()` | not used (Quarkus doesn't expose it) | `_score` extracted by regex |
| Dependency | `spring-boot-starter-data-elasticsearch` | `quarkus-elasticsearch-java-client` | `quarkus-elasticsearch-rest-client` |

---

## Pros

**Readability.** The query structure is visible in the code. A reader can see the `bool` → `must` → `should` nesting as Java method calls that mirror the Elasticsearch query DSL tree. The string-concatenation version required mentally parsing JSON embedded in Java strings.

**Type safety.** Mistyped field names, wrong query types, or structurally invalid queries are caught at compile time or by the fluent builder's null checks. The `RestClient` approach compiled and silently returned empty results for any structural error.

**No bespoke JSON infrastructure.** The five helper methods (`findMatchingBracket`, `splitJsonObjects`, `parseString`, `parseLong`, `parseFloat`) were each individually correct but collectively a maintenance liability: they handled only the subset of JSON that the current response shape happened to produce, with no guarantee of correctness under schema changes.

**Jackson serialization in bulk indexing.** `toJson(Partner p)` enumerated every field by name in code. Adding a new field to `Partner` required also updating `toJson` — a silent coupling that no compiler enforced. Jackson serializes `PartnerDocument` reflexively; adding a field to the document class automatically includes it in the index.

**Symmetry with Spring.** The two backends now use the same query DSL. A developer reading both can compare them directly. Before, understanding the Quarkus search required understanding a bespoke JSON builder that had no equivalent in Spring.

**Testability.** The previous `buildQuery` unit tests verified that specific JSON substrings appeared in the output string (e.g. `assertTrue(query.contains("*müller*"))`). These tests verified formatting, not semantics. The new tests verify observable behaviour (fallback on ES failure), which is the only aspect worth testing without a live ES instance.

---

## Cons

**Loss of full control.** The `RestClient` approach gave exact visibility into every byte sent to and received from Elasticsearch. Debugging an unexpected query required only logging `buildQuery(tokens)`. With the Java client, the serialized JSON is opaque unless Elasticsearch request logging is enabled at the transport level. For production debugging of subtle query issues, this is a real cost.

**Aggregation API verbosity.** The `sterms().buckets().array()` chain to traverse aggregation results is not intuitive. The API distinguishes `sterms()` (string terms), `lterms()` (long terms), etc. — the caller must know the aggregation type statically. The old `extractBucketKeys()` was generic and would have worked for any bucket type.

**Singleton scope friction in tests.** `ElasticsearchClient` is registered as `@Singleton` by Quarkus, which is not proxiable. `@InjectMock` requires a normal (proxiable) scope. The workaround — plain JUnit5 with field injection — is simpler but loses `@QuarkusTest` container lifecycle. Any test that needs a live ES instance cannot mock this bean without a custom producer.

**`quarkus-elasticsearch-rest-client` remains on the classpath.** The Java client extension pulls in the low-level client transitively. Both `elasticsearch-java-client` and `elasticsearch-rest-client` appear in the installed features log. This is cosmetic (the old beans are unused) but adds weight and potential confusion.

**`Void.class` for aggregation-only queries.** Passing `Void.class` as the document type for the completion query (which returns `size: 0` hits) is correct but reads oddly. The Java API Client offers no dedicated "aggregations-only" entry point.

---

## Decision

Switch to `quarkus-elasticsearch-java-client`. The −57% reduction in ES layer code, elimination of all bespoke JSON infrastructure, and structural parity with Spring outweigh the loss of raw-byte visibility. The `RestClient` remains available on the classpath for any future use case that requires fine-grained HTTP control (e.g., custom index lifecycle requests not covered by the high-level API).

---

## Consequences

- `PartnerIndexService`, `ElasticsearchSearchService`, `ElasticsearchCompletionService` all inject `ElasticsearchClient` — no more `RestClient` injections in production code.
- `PartnerDocument` (new) replaces hand-written JSON parsing for hits. It must be kept in sync with the ES index mapping in `PartnerIndexService.INDEX_MAPPING`.
- Unit tests for the ES layer no longer test query string content; they test resilience (empty-result fallback on exception). Integration correctness is covered by the `PartnerSearchResourceTest` `@QuarkusTest` suite against a live Postgres/ES DevServices stack.
- The `buildQuery` and `buildCompletion` methods (previously `package-private` for testability) are gone. There is no string representation of the query to assert against; this is intentional.
