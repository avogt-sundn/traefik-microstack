package com.example.partner.resource;

import com.example.partner.dto.CompletionResponse;
import com.example.partner.elasticsearch.ElasticsearchCompletionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

/**
 * Autocomplete suggestions for a given prefix.
 * GET /api/partner/complete?q=<prefix>
 */
@Path("/api/partner/quarkus")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Partner Search", description = "Search for partners")
public class PartnerCompletionResource {

    @Inject
    ElasticsearchCompletionService completionService;

    @GET
    @Path("/complete")
    @Operation(
        summary = "Autocomplete suggestions",
        description = "Returns up to max-results suggestions matching the given prefix."
    )
    public CompletionResponse complete(@QueryParam("q") String q) {
        return completionService.complete(q);
    }
}
