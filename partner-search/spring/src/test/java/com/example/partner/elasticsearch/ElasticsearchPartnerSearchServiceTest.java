package com.example.partner.elasticsearch;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ElasticsearchPartnerSearchServiceTest {

    @Mock
    ElasticsearchOperations elasticsearchOperations;

    @InjectMocks
    ElasticsearchPartnerSearchService service;

    @Test
    @SuppressWarnings("unchecked")
    void search_emptyTokens_callsElasticsearchAndReturnsEmptyList() {
        SearchHits<PartnerDocument> hits = mock(SearchHits.class);
        when(hits.getSearchHits()).thenReturn(List.of());
        when(hits.getTotalHits()).thenReturn(0L);
        when(elasticsearchOperations.search(any(Query.class), eq(PartnerDocument.class)))
                .thenReturn(hits);

        ElasticsearchPartnerSearchService.SearchResult result = service.search(List.of());

        assertThat(result.documents()).isEmpty();
        assertThat(result.totalHits()).isEqualTo(0);
        verify(elasticsearchOperations).search(any(Query.class), eq(PartnerDocument.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void search_withToken_mapsDocumentScoreIntoResult() {
        PartnerDocument doc = new PartnerDocument();
        doc.setPartnerNumber(100001L);

        SearchHit<PartnerDocument> hit = mock(SearchHit.class);
        when(hit.getContent()).thenReturn(doc);
        when(hit.getScore()).thenReturn(1.5f);

        SearchHits<PartnerDocument> hits = mock(SearchHits.class);
        when(hits.getSearchHits()).thenReturn(List.of(hit));
        when(hits.getTotalHits()).thenReturn(1L);

        when(elasticsearchOperations.search(any(Query.class), eq(PartnerDocument.class)))
                .thenReturn(hits);

        ElasticsearchPartnerSearchService.SearchResult result = service.search(List.of("München"));

        assertThat(result.documents()).hasSize(1);
        assertThat(result.documents().get(0).getPartnerNumber()).isEqualTo(100001L);
        assertThat(result.documents().get(0).getScore()).isEqualTo(1.5f);
        assertThat(result.totalHits()).isEqualTo(1L);
    }

    @Test
    void search_whenElasticsearchThrows_returnsEmptyList() {
        when(elasticsearchOperations.search(any(Query.class), eq(PartnerDocument.class)))
                .thenThrow(new RuntimeException("ES unavailable"));

        ElasticsearchPartnerSearchService.SearchResult result = service.search(List.of("test"));

        assertThat(result.documents()).isEmpty();
        assertThat(result.totalHits()).isEqualTo(0);
    }
}
