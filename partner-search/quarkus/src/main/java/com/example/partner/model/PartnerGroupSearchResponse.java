package com.example.partner.model;

import java.util.List;

/**
 * Top-level search response envelope.
 */
public record PartnerGroupSearchResponse(
        List<PartnerGroupSearchDto> results,
        int totalCount,
        int returnedCount
) {
}
