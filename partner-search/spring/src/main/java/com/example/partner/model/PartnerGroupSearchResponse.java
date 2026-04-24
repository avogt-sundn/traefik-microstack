package com.example.partner.model;

import java.util.List;

public record PartnerGroupSearchResponse(
    List<PartnerGroupSearchDto> partners,
    int totalCount,
    int returnedCount,
    int storeTotalCount
) {}
