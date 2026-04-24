package com.example.partner.elasticsearch;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import com.example.partner.model.PartnerGroupSearchDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class ElasticsearchSearchService {

    private static final Logger log = Logger.getLogger(ElasticsearchSearchService.class);

    @Inject
    ElasticsearchClient esClient;

    public record SearchResult(List<PartnerGroupSearchDto> results, long totalHits) {}

    /** Maps ASCII umlaut sequences to their umlaut characters (e.g. mueller → müller). */
    private static String expandUmlauts(String token) {
        return token
            .replace("ae", "ä").replace("oe", "ö").replace("ue", "ü").replace("ss", "ß")
            .replace("Ae", "Ä").replace("Oe", "Ö").replace("Ue", "Ü");
    }

    public SearchResult search(List<String> tokens) {
        try {
            BoolQuery.Builder bool = new BoolQuery.Builder();

            if (tokens == null || tokens.isEmpty()) {
                bool.must(m -> m.matchAll(ma -> ma));
            } else {
                for (String token : tokens) {
                    String wc = "*" + token.toLowerCase() + "*";
                    String expanded = expandUmlauts(token.toLowerCase());
                    String wcExpanded = "*" + expanded + "*";
                    // Two wildcard clauses per field per token: original + umlaut-expanded (OR).
                    // If expanded equals original (no umlaut sequences), only one clause is emitted.
                    bool.must(mu -> mu.bool(inner -> {
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
                        inner.minimumShouldMatch("1");
                        return inner;
                    }));
                }
            }

            SearchResponse<PartnerDocument> resp = esClient.search(s -> s
                    .index("partners")
                    .size(200)
                    .trackTotalHits(t -> t.enabled(true))
                    .query(q -> q.bool(bool.build())),
                PartnerDocument.class);

            long totalHits = resp.hits().total() != null ? resp.hits().total().value() : 0;
            List<PartnerGroupSearchDto> results = resp.hits().hits().stream()
                .map(h -> toDto(h.source()))
                .toList();

            return new SearchResult(results, totalHits);

        } catch (Exception e) {
            log.errorf(e, "ES search failed — returning empty result.");
            return new SearchResult(List.of(), 0);
        }
    }

    private PartnerGroupSearchDto toDto(PartnerDocument d) {
        if (d == null) return null;
        return new PartnerGroupSearchDto(
            d.partnerNumber, d.alphaCode,
            d.name1, d.name2, d.name3, d.firstname,
            d.street, d.houseNumber, d.postalCode, d.city,
            d.type, d.groupType, d.groupNumber);
    }
}
