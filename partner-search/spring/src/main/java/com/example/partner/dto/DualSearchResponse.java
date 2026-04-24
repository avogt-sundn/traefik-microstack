package com.example.partner.dto;

import com.example.partner.model.PartnerGroupSearchDto;

import java.util.List;

public record DualSearchResponse(
    SearchEngineResult postgres,
    SearchEngineResult elasticsearch,
    QuerySummary query
) {

    public record SearchEngineResult(
        List<PartnerGroupSearchDto> results,
        int totalCount,
        int returnedCount,
        long durationMs,
        int storeTotalCount
    ) {}

    public record QuerySummary(List<String> tokens) {}
}
