package com.example.partner.controller;

import com.example.partner.dto.DualSearchResponse;
import com.example.partner.elasticsearch.ElasticsearchPartnerSearchService;
import com.example.partner.elasticsearch.ElasticsearchPartnerSearchService.SearchResult;
import com.example.partner.elasticsearch.PartnerDocument;
import com.example.partner.model.PartnerGroupSearchDto;
import com.example.partner.model.PartnerGroupSearchResponse;
import com.example.partner.service.DualRunSearchService;
import com.example.partner.service.PartnerSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/partner/spring")
public class PartnerSearchController {

    private final DualRunSearchService dualRunSearchService;
    private final PartnerSearchService partnerSearchService;
    private final ElasticsearchPartnerSearchService elasticsearchPartnerSearchService;

    public PartnerSearchController(
            DualRunSearchService dualRunSearchService,
            PartnerSearchService partnerSearchService,
            ElasticsearchPartnerSearchService elasticsearchPartnerSearchService) {
        this.dualRunSearchService = dualRunSearchService;
        this.partnerSearchService = partnerSearchService;
        this.elasticsearchPartnerSearchService = elasticsearchPartnerSearchService;
    }

    /**
     * Legacy dual search — kept alive until PARTNER-ES-011 migrates e2e tests.
     * GET /api/partner/spring/search?q=<raw>
     */
    @GetMapping("/search")
    public ResponseEntity<DualSearchResponse> search(
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(dualRunSearchService.search(tokenize(q)));
    }

    /**
     * Per-engine Postgres search — returns SearchEngineResult directly.
     * GET /api/partner/spring/search/postgres?q=<raw>
     */
    @GetMapping("/search/postgres")
    public ResponseEntity<DualSearchResponse.SearchEngineResult> searchPostgres(
            @RequestParam(required = false) String q) {
        List<String> tokens = tokenize(q);
        long start = System.currentTimeMillis();
        PartnerGroupSearchResponse response = partnerSearchService.search(tokens);
        long duration = System.currentTimeMillis() - start;
        return ResponseEntity.ok(new DualSearchResponse.SearchEngineResult(
            response.partners(), response.totalCount(), response.returnedCount(), duration, response.storeTotalCount()));
    }

    /**
     * Per-engine Elasticsearch search — returns SearchEngineResult directly.
     * GET /api/partner/spring/search/elasticsearch?q=<raw>
     */
    @GetMapping("/search/elasticsearch")
    public ResponseEntity<DualSearchResponse.SearchEngineResult> searchElasticsearch(
            @RequestParam(required = false) String q) {
        List<String> tokens = tokenize(q);
        long start = System.currentTimeMillis();
        SearchResult searchResult = elasticsearchPartnerSearchService.search(tokens);
        long duration = System.currentTimeMillis() - start;
        List<PartnerGroupSearchDto> results = searchResult.documents().stream().map(this::toDto).toList();
        return ResponseEntity.ok(new DualSearchResponse.SearchEngineResult(
            results, (int) searchResult.totalHits(), results.size(), duration, (int) searchResult.storeTotal()));
    }

    private List<String> tokenize(String q) {
        if (q == null || q.isBlank()) {
            return List.of();
        }
        return Arrays.stream(q.trim().split("\\s+"))
            .filter(t -> !t.isBlank())
            .toList();
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
