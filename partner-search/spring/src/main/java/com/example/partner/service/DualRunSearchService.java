package com.example.partner.service;

import com.example.partner.dto.DualSearchResponse;
import com.example.partner.elasticsearch.ElasticsearchPartnerSearchService;
import com.example.partner.elasticsearch.ElasticsearchPartnerSearchService.SearchResult;
import com.example.partner.elasticsearch.PartnerDocument;
import com.example.partner.model.PartnerGroupSearchDto;
import com.example.partner.model.PartnerGroupSearchResponse;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Executes Postgres and Elasticsearch searches sequentially and merges the results
 * into a DualSearchResponse for side-by-side comparison.
 *
 * Note: Sequential execution avoids JPA transaction-context issues that arise when
 * Spring @Transactional methods are called from a different thread via CompletableFuture.
 */
@Service
public class DualRunSearchService {

    private final PartnerSearchService partnerSearchService;
    private final ElasticsearchPartnerSearchService elasticsearchPartnerSearchService;

    public DualRunSearchService(PartnerSearchService partnerSearchService,
                                ElasticsearchPartnerSearchService elasticsearchPartnerSearchService) {
        this.partnerSearchService = partnerSearchService;
        this.elasticsearchPartnerSearchService = elasticsearchPartnerSearchService;
    }

    public DualSearchResponse search(List<String> tokens) {
        long pgStart = System.currentTimeMillis();
        PartnerGroupSearchResponse pgResponse;
        try {
            pgResponse = partnerSearchService.search(tokens);
        } catch (Exception e) {
            pgResponse = new PartnerGroupSearchResponse(List.of(), 0, 0, 0);
        }
        long pgDuration = System.currentTimeMillis() - pgStart;

        long esStart = System.currentTimeMillis();
        SearchResult esSearchResult;
        try {
            esSearchResult = elasticsearchPartnerSearchService.search(tokens);
        } catch (Exception e) {
            esSearchResult = new SearchResult(List.of(), 0, 0);
        }
        long esDuration = System.currentTimeMillis() - esStart;

        List<PartnerGroupSearchDto> esResults = esSearchResult.documents().stream()
            .map(this::toDto)
            .toList();

        DualSearchResponse.SearchEngineResult pgResult = new DualSearchResponse.SearchEngineResult(
            pgResponse.partners(),
            pgResponse.totalCount(),
            pgResponse.returnedCount(),
            pgDuration,
            pgResponse.storeTotalCount()
        );

        DualSearchResponse.SearchEngineResult esResult = new DualSearchResponse.SearchEngineResult(
            esResults,
            (int) esSearchResult.totalHits(),
            esResults.size(),
            esDuration,
            (int) esSearchResult.storeTotal()
        );

        DualSearchResponse.QuerySummary querySummary = new DualSearchResponse.QuerySummary(tokens);

        return new DualSearchResponse(pgResult, esResult, querySummary);
    }

    private PartnerGroupSearchDto toDto(PartnerDocument doc) {
        return new PartnerGroupSearchDto(
            doc.getPartnerNumber(),
            doc.getGroupNumber(),
            doc.getType(),
            doc.getAlphaCode(),
            doc.getName1(),
            doc.getName2(),
            doc.getName3(),
            doc.getFirstname(),
            doc.getStreet(),
            doc.getHouseNumber(),
            doc.getPostalCode(),
            doc.getCity(),
            doc.getGroupType()
        );
    }
}
