package com.example.partner.elasticsearch;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.aggregations.StringTermsBucket;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import com.example.partner.dto.CompletionResponse;
import com.example.partner.dto.CompletionResponse.CompletionItem;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class ElasticsearchCompletionService {

    private static final Logger log = Logger.getLogger(ElasticsearchCompletionService.class);

    @Inject
    ElasticsearchClient esClient;

    @ConfigProperty(name = "partner.complete.max-results", defaultValue = "15")
    int maxResults;

    public CompletionResponse complete(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return new CompletionResponse(List.of());
        }
        try {
            String p = prefix.trim();
            String pLower = p.toLowerCase();
            int size = maxResults;

            SearchResponse<Void> resp = esClient.search(s -> s
                    .index("partners")
                    .size(0)
                    .query(q -> q.bool(b -> b
                        .minimumShouldMatch("1")
                        .should(sh -> sh.match(m -> m.field("name1.autocomplete").query(p)))
                        .should(sh -> sh.match(m -> m.field("firstname.autocomplete").query(p)))
                        .should(sh -> sh.match(m -> m.field("city.autocomplete").query(p)))
                        .should(sh -> sh.prefix(pr -> pr.field("postalCode").value(p)))
                        .should(sh -> sh.prefix(pr -> pr.field("alphaCode").value(pLower)))))
                    .aggregations("name1_terms", a -> a.terms(t -> t.field("name1.keyword").size(size)))
                    .aggregations("city_terms",  a -> a.terms(t -> t.field("city.keyword").size(size)))
                    .aggregations("postal_terms", a -> a.terms(t -> t.field("postalCode").size(size)))
                    .aggregations("alpha_terms",  a -> a.terms(t -> t.field("alphaCode").size(size))),
                Void.class);

            Set<String> seen = new LinkedHashSet<>();
            for (String agg : List.of("name1_terms", "city_terms", "postal_terms", "alpha_terms")) {
                resp.aggregations().get(agg).sterms().buckets().array().stream()
                    .map(StringTermsBucket::key)
                    .map(k -> k.stringValue())
                    .filter(v -> v.toLowerCase().startsWith(pLower))
                    .forEach(seen::add);
            }

            List<CompletionItem> items = seen.stream()
                .limit(size)
                .map(v -> new CompletionItem(v, v))
                .toList();

            return new CompletionResponse(items);

        } catch (Exception e) {
            log.errorf(e, "ES completion failed — returning empty result.");
            return new CompletionResponse(List.of());
        }
    }
}
