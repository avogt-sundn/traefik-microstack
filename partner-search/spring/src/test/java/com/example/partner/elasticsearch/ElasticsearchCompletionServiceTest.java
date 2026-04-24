package com.example.partner.elasticsearch;

import com.example.partner.dto.CompletionResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ElasticsearchCompletionServiceTest {

    @Mock
    ElasticsearchOperations elasticsearchOperations;

    // maxResults injected manually since @InjectMocks doesn't handle @Value
    ElasticsearchCompletionService service;

    @Test
    void complete_blankPrefix_returnsEmpty() {
        service = new ElasticsearchCompletionService(elasticsearchOperations, 15);

        CompletionResponse result = service.complete("  ");

        assertThat(result.completions()).isEmpty();
    }

    @Test
    void complete_nullPrefix_returnsEmpty() {
        service = new ElasticsearchCompletionService(elasticsearchOperations, 15);

        CompletionResponse result = service.complete(null);

        assertThat(result.completions()).isEmpty();
    }

    @Test
    void complete_whenElasticsearchThrows_returnsEmpty() {
        service = new ElasticsearchCompletionService(elasticsearchOperations, 15);
        when(elasticsearchOperations.search(any(Query.class), eq(PartnerDocument.class)))
                .thenThrow(new RuntimeException("ES unavailable"));

        CompletionResponse result = service.complete("Mün");

        assertThat(result.completions()).isEmpty();
    }

    @Test
    @SuppressWarnings("unchecked")
    void complete_withPrefix_callsElasticsearch() {
        service = new ElasticsearchCompletionService(elasticsearchOperations, 15);
        SearchHits<PartnerDocument> hits = mock(SearchHits.class);
        when(hits.hasAggregations()).thenReturn(false);
        when(elasticsearchOperations.search(any(Query.class), eq(PartnerDocument.class)))
                .thenReturn(hits);

        CompletionResponse result = service.complete("Mün");

        assertThat(result.completions()).isEmpty(); // no aggregations in mock → empty but no exception
    }
}
