package com.example.partner.elasticsearch;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import com.example.partner.dto.CompletionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

class ElasticsearchCompletionServiceTest {

    private ElasticsearchClient esClient;
    private ElasticsearchCompletionService service;

    @BeforeEach
    void setUp() {
        esClient = mock(ElasticsearchClient.class);
        service = new ElasticsearchCompletionService();
        service.esClient = esClient;
        service.maxResults = 15;
    }

    @Test
    void complete_nullPrefix_returnsEmpty() {
        CompletionResponse result = service.complete(null);
        assertNotNull(result);
        assertTrue(result.completions().isEmpty());
    }

    @Test
    void complete_blankPrefix_returnsEmpty() {
        CompletionResponse result = service.complete("  ");
        assertNotNull(result);
        assertTrue(result.completions().isEmpty());
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void complete_esDown_returnsEmpty() throws Exception {
        doThrow(new RuntimeException("ES down"))
            .when(esClient)
            .search((java.util.function.Function) any(), any(Class.class));

        CompletionResponse result = service.complete("Mü");
        assertNotNull(result);
        assertTrue(result.completions().isEmpty());
    }
}
