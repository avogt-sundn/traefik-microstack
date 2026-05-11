package com.example.partner.index;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Internal re-index endpoint. Called by partner-edit after a successful partner update
 * to keep the Elasticsearch index in sync with Postgres.
 */
@RestController
@RequestMapping("/api/partner/spring/index")
public class IndexController {

    private final IndexService indexService;

    public IndexController(IndexService indexService) {
        this.indexService = indexService;
    }

    /**
     * POST /api/partner/spring/index/partner/{partnerNumber}
     * Upserts the Elasticsearch document from the pushed payload — no Postgres read.
     *
     * @return 204 No Content on success
     */
    @PostMapping("/partner/{partnerNumber}")
    public ResponseEntity<Void> reindex(
            @PathVariable Long partnerNumber,
            @RequestBody PartnerIndexRequest request) {
        indexService.reindex(request);
        return ResponseEntity.noContent().build();
    }
}
