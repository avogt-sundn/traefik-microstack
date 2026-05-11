package com.example.partner.service;

import com.example.partner.dto.DualSearchResponse;
import com.example.partner.elasticsearch.ElasticsearchSearchService;
import com.example.partner.elasticsearch.ElasticsearchSearchService.SearchResult;
import com.example.partner.model.PartnerGroupSearchResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

/**
 * Executes Postgres and Elasticsearch searches in parallel and merges the results
 * into a DualSearchResponse for side-by-side comparison.
 */
@ApplicationScoped
public class DualRunSearchService {

    @Inject
    PartnerSearchService partnerSearchService;

    @Inject
    ElasticsearchSearchService elasticsearchSearchService;

    @Transactional
    public DualSearchResponse search(List<String> tokens) {
        long pgStart = System.currentTimeMillis();
        PartnerGroupSearchResponse pgResponse = partnerSearchService.search(tokens);
        long pgDuration = System.currentTimeMillis() - pgStart;

        long esStart = System.currentTimeMillis();
        SearchResult esSearchResult = elasticsearchSearchService.search(tokens);
        long esDuration = System.currentTimeMillis() - esStart;

        DualSearchResponse.SearchEngineResult pgResult = new DualSearchResponse.SearchEngineResult(
            pgResponse.results(),
            pgResponse.totalCount(),
            pgResponse.returnedCount(),
            pgDuration
        );

        DualSearchResponse.SearchEngineResult esResult = new DualSearchResponse.SearchEngineResult(
            esSearchResult.results(),
            (int) esSearchResult.totalHits(),
            esSearchResult.results().size(),
            esDuration
        );

        DualSearchResponse.QuerySummary querySummary = new DualSearchResponse.QuerySummary(tokens);

        return new DualSearchResponse(pgResult, esResult, querySummary);
    }


}
