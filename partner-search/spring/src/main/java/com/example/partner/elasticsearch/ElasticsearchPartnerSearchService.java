package com.example.partner.elasticsearch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Executes partner searches against Elasticsearch using a BoolQuery.
 * Each token generates one must clause (wildcard across all fields) — matching PG LIKE %token% semantics.
 * Returns PartnerDocument list with scores populated.
 */
@Service
public class ElasticsearchPartnerSearchService {

    private static final Logger log = LoggerFactory.getLogger(ElasticsearchPartnerSearchService.class);

    private final ElasticsearchOperations elasticsearchOperations;

    public ElasticsearchPartnerSearchService(ElasticsearchOperations elasticsearchOperations) {
        this.elasticsearchOperations = elasticsearchOperations;
    }

    public record SearchResult(List<PartnerDocument> documents, long totalHits, long storeTotal) {}

    /** Maps ASCII umlaut sequences to their umlaut characters (e.g. mueller → müller). */
    private static String expandUmlauts(String token) {
        return token
            .replace("ae", "ä").replace("oe", "ö").replace("ue", "ü").replace("ss", "ß")
            .replace("Ae", "Ä").replace("Oe", "Ö").replace("Ue", "Ü");
    }

    public SearchResult search(List<String> tokens) {
        try {
            // Collect non-blank tokens
            List<String> activeTokens = new ArrayList<>();
            if (tokens != null) {
                for (String t : tokens) {
                    if (t != null && !t.isBlank()) {
                        activeTokens.add(t);
                    }
                }
            }

            BoolQuery.Builder boolQuery = new BoolQuery.Builder();

            if (activeTokens.isEmpty()) {
                boolQuery.must(m -> m.matchAll(ma -> ma));
            } else {
                for (String token : activeTokens) {
                    final String t = token;
                    final String wildcardValue = "*" + t.toLowerCase() + "*";
                    final String expanded = expandUmlauts(t.toLowerCase());
                    final String wildcardExpanded = "*" + expanded + "*";
                    // AND across tokens: each token must match at least one field (OR across fields).
                    // Two wildcard clauses per token: original + umlaut-expanded (OR) so that
                    // mueller → *mueller* | *müller*, munchen → *munchen* | *münchen*.
                    // Numeric tokens use wildcard on partnerNumber.keyword for substring matching,
                    // consistent with PG LIKE %token% behaviour.
                    boolQuery.must(mu -> mu.bool(inner -> {
                        addFieldWildcards(inner, wildcardValue, wildcardExpanded);
                        inner.minimumShouldMatch("1");
                        return inner;
                    }));
                }
            }

            Query query = NativeQuery.builder()
                .withQuery(q -> q.bool(boolQuery.build()))
                .withMaxResults(200)
                .withTrackTotalHits(true)
                .build();

            SearchHits<PartnerDocument> hits = elasticsearchOperations.search(query, PartnerDocument.class);
            long totalHits = hits.getTotalHits();
            long storeTotal = elasticsearchOperations.count(Query.findAll(), PartnerDocument.class);

            List<PartnerDocument> documents = hits.getSearchHits().stream()
                .map(hit -> {
                    PartnerDocument doc = hit.getContent();
                    doc.setScore(hit.getScore());
                    return doc;
                })
                .toList();

            return new SearchResult(documents, totalHits, storeTotal);

        } catch (Exception e) {
            log.error("ES search failed — returning empty result.", e);
            return new SearchResult(List.of(), 0, 0);
        }
    }

    /**
     * Adds two wildcard should-clauses per field: one for the original token, one for the
     * umlaut-expanded form. If both are identical (no umlaut sequences in token), only one
     * clause is emitted.
     */
    private static void addFieldWildcards(BoolQuery.Builder inner, String wc, String wcExpanded) {
        inner.should(s -> s.wildcard(w -> w.field("name1").value(wc).caseInsensitive(true)));
        inner.should(s -> s.wildcard(w -> w.field("name2").value(wc).caseInsensitive(true)));
        inner.should(s -> s.wildcard(w -> w.field("name3").value(wc).caseInsensitive(true)));
        inner.should(s -> s.wildcard(w -> w.field("firstname").value(wc).caseInsensitive(true)));
        inner.should(s -> s.wildcard(w -> w.field("alphaCode").value(wc).caseInsensitive(true)));
        inner.should(s -> s.wildcard(w -> w.field("postalCode").value(wc)));
        inner.should(s -> s.wildcard(w -> w.field("city").value(wc).caseInsensitive(true)));
        inner.should(s -> s.wildcard(w -> w.field("street").value(wc).caseInsensitive(true)));
        inner.should(s -> s.wildcard(w -> w.field("partnerNumber.keyword").value(wc)));
        if (!wcExpanded.equals(wc)) {
            inner.should(s -> s.wildcard(w -> w.field("name1").value(wcExpanded).caseInsensitive(true)));
            inner.should(s -> s.wildcard(w -> w.field("name2").value(wcExpanded).caseInsensitive(true)));
            inner.should(s -> s.wildcard(w -> w.field("name3").value(wcExpanded).caseInsensitive(true)));
            inner.should(s -> s.wildcard(w -> w.field("firstname").value(wcExpanded).caseInsensitive(true)));
            inner.should(s -> s.wildcard(w -> w.field("city").value(wcExpanded).caseInsensitive(true)));
            inner.should(s -> s.wildcard(w -> w.field("street").value(wcExpanded).caseInsensitive(true)));
        }
    }

}
