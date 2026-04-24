package com.example.partner.elasticsearch;

import com.example.partner.dto.CompletionResponse;
import com.example.partner.dto.CompletionResponse.CompletionItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregation;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregations;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.stereotype.Service;

import co.elastic.clients.elasticsearch._types.aggregations.Aggregation;
import co.elastic.clients.elasticsearch._types.aggregations.StringTermsBucket;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Autocomplete suggestions using edge-ngram prefix matching on .autocomplete sub-fields
 * and terms aggregations for keyword fields (postalCode, alphaCode, partnerNumber).
 */
@Service
public class ElasticsearchCompletionService {

    private static final Logger log = LoggerFactory.getLogger(ElasticsearchCompletionService.class);

    private final ElasticsearchOperations elasticsearchOperations;
    private final int maxResults;

    public ElasticsearchCompletionService(
            ElasticsearchOperations elasticsearchOperations,
            @Value("${partner.complete.max-results:15}") int maxResults) {
        this.elasticsearchOperations = elasticsearchOperations;
        this.maxResults = maxResults;
    }

    public CompletionResponse complete(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return new CompletionResponse(List.of());
        }
        try {
            String p = prefix.trim();

            BoolQuery.Builder filter = new BoolQuery.Builder()
                .should(s -> s.match(m -> m.field("name1.autocomplete").query(p)))
                .should(s -> s.match(m -> m.field("firstname.autocomplete").query(p)))
                .should(s -> s.match(m -> m.field("city.autocomplete").query(p)))
                .should(s -> s.prefix(pq -> pq.field("postalCode").value(p)))
                .should(s -> s.prefix(pq -> pq.field("alphaCode").value(p.toLowerCase())))
                .minimumShouldMatch("1");

            Query query = NativeQuery.builder()
                .withQuery(q -> q.bool(filter.build()))
                .withMaxResults(0) // hits not needed — aggregations only
                .withAggregation("name1_terms", Aggregation.of(a -> a
                    .terms(t -> t.field("name1.keyword").size(maxResults))))
                .withAggregation("city_terms", Aggregation.of(a -> a
                    .terms(t -> t.field("city.keyword").size(maxResults))))
                .withAggregation("postal_terms", Aggregation.of(a -> a
                    .terms(t -> t.field("postalCode").size(maxResults))))
                .withAggregation("alpha_terms", Aggregation.of(a -> a
                    .terms(t -> t.field("alphaCode").size(maxResults))))
                .build();

            SearchHits<PartnerDocument> hits = elasticsearchOperations.search(query, PartnerDocument.class);

            Set<String> seen = new LinkedHashSet<>();
            if (hits.hasAggregations()) {
                ElasticsearchAggregations aggs = (ElasticsearchAggregations) hits.getAggregations();
                for (String aggName : List.of("name1_terms", "city_terms", "postal_terms", "alpha_terms")) {
                    ElasticsearchAggregation agg = aggs.get(aggName);
                    if (agg != null) {
                        agg.aggregation().getAggregate().sterms().buckets().array()
                            .stream()
                            .map(StringTermsBucket::key)
                            .map(k -> k.stringValue())
                            .filter(v -> v.toLowerCase().startsWith(p.toLowerCase()))
                            .forEach(seen::add);
                    }
                }
            }

            List<CompletionItem> completions = seen.stream()
                .limit(maxResults)
                .map(v -> new CompletionItem(v, v))
                .toList();

            return new CompletionResponse(completions);

        } catch (Exception e) {
            log.error("ES completion failed — returning empty result.", e);
            return new CompletionResponse(List.of());
        }
    }
}
