package com.example.partner.model;

/**
 * DTO representing a single partner result in the search response.
 */
public record PartnerGroupSearchDto(
        Long partnerNumber,
        String alphaCode,
        String name1,
        String name2,
        String name3,
        String firstname,
        String street,
        String houseNumber,
        String postalCode,
        String city,
        String type,
        String groupType,
        Long groupNumber
) {
}
