package com.example.partner.resource;

import com.example.partner.dto.DualSearchResponse;
import com.example.partner.elasticsearch.ElasticsearchSearchService;
import com.example.partner.elasticsearch.ElasticsearchSearchService.SearchResult;
import com.example.partner.model.PartnerGroupSearchResponse;
import com.example.partner.service.DualRunSearchService;
import com.example.partner.service.PartnerSearchService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.Arrays;
import java.util.List;

/**
 * REST resource for partner search.
 * Returns a DualSearchResponse with results from both Postgres and Elasticsearch.
 */
@Path("/api/partner/quarkus")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Partner Search", description = "Search for partners")
public class PartnerSearchResource {

    @Inject
    DualRunSearchService dualRunSearchService;

    @Inject
    PartnerSearchService partnerSearchService;

    @Inject
    ElasticsearchSearchService elasticsearchSearchService;

    /**
     * Legacy dual search — kept alive until PARTNER-ES-011 migrates e2e tests.
     * GET /api/partner/quarkus/search?q=<raw>
     */
    @GET
    @Path("/search")
    @Operation(
        summary = "Search partners (dual)",
        description = "Search using ?q= (split on whitespace into tokens). Returns both PG and ES results."
    )
    public DualSearchResponse search(@QueryParam("q") String q) {
        return dualRunSearchService.search(tokenize(q));
    }

    /**
     * Per-engine Postgres search — returns SearchEngineResult directly.
     * GET /api/partner/quarkus/search/postgres?q=<raw>
     */
    @GET
    @Path("/search/postgres")
    @Operation(summary = "Postgres search", description = "Returns SearchEngineResult from Postgres only.")
    public DualSearchResponse.SearchEngineResult searchPostgres(@QueryParam("q") String q) {
        List<String> tokens = tokenize(q);
        long start = System.currentTimeMillis();
        PartnerGroupSearchResponse response = partnerSearchService.search(tokens);
        long duration = System.currentTimeMillis() - start;
        return new DualSearchResponse.SearchEngineResult(
            response.results(), response.totalCount(), response.returnedCount(), duration);
    }

    /**
     * Per-engine Elasticsearch search — returns SearchEngineResult directly.
     * GET /api/partner/quarkus/search/elasticsearch?q=<raw>
     */
    @GET
    @Path("/search/elasticsearch")
    @Operation(summary = "Elasticsearch search", description = "Returns SearchEngineResult from Elasticsearch only.")
    public DualSearchResponse.SearchEngineResult searchElasticsearch(@QueryParam("q") String q) {
        List<String> tokens = tokenize(q);
        long start = System.currentTimeMillis();
        SearchResult searchResult = elasticsearchSearchService.search(tokens);
        long duration = System.currentTimeMillis() - start;
        return new DualSearchResponse.SearchEngineResult(
            searchResult.results(), (int) searchResult.totalHits(), searchResult.results().size(), duration);
    }

    private List<String> tokenize(String q) {
        if (q == null || q.isBlank()) {
            return List.of();
        }
        return Arrays.stream(q.trim().split("\\s+"))
            .filter(t -> !t.isBlank())
            .toList();
    }
}
