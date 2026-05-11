package com.example.partner.elasticsearch;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

class ElasticsearchSearchServiceTest {

    private ElasticsearchClient esClient;
    private ElasticsearchSearchService service;

    @BeforeEach
    void setUp() {
        esClient = mock(ElasticsearchClient.class);
        service = new ElasticsearchSearchService();
        service.esClient = esClient;
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private void stubEsDown() throws Exception {
        doThrow(new RuntimeException("ES down"))
            .when(esClient)
            .search((java.util.function.Function) any(), any(Class.class));
    }

    @Test
    void search_noTokens_esDown_returnsEmpty() throws Exception {
        stubEsDown();
        ElasticsearchSearchService.SearchResult result = service.search(List.of());
        assertNotNull(result);
        assertTrue(result.results().isEmpty());
        assertEquals(0, result.totalHits());
    }

    @Test
    void search_withTokens_esDown_returnsEmpty() throws Exception {
        stubEsDown();
        ElasticsearchSearchService.SearchResult result = service.search(List.of("Müller"));
        assertNotNull(result);
        assertTrue(result.results().isEmpty());
        assertEquals(0, result.totalHits());
    }

    @Test
    void search_numericToken_esDown_returnsEmpty() throws Exception {
        stubEsDown();
        ElasticsearchSearchService.SearchResult result = service.search(List.of("100002"));
        assertNotNull(result);
        assertTrue(result.results().isEmpty());
        assertEquals(0, result.totalHits());
    }
}
