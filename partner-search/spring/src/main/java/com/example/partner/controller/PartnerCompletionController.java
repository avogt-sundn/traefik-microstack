package com.example.partner.controller;

import com.example.partner.dto.CompletionResponse;
import com.example.partner.elasticsearch.ElasticsearchCompletionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner/spring")
public class PartnerCompletionController {

    private final ElasticsearchCompletionService completionService;

    public PartnerCompletionController(ElasticsearchCompletionService completionService) {
        this.completionService = completionService;
    }

    /**
     * Autocomplete suggestions for a given prefix.
     * GET /api/partner/complete?q=<prefix>
     */
    @GetMapping("/complete")
    public ResponseEntity<CompletionResponse> complete(
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(completionService.complete(q));
    }
}
