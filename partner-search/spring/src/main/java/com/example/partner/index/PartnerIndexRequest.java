package com.example.partner.index;

/**
 * Payload pushed by partner-edit when a partner is updated.
 * Mirrors {@code com.example.partneredit.partner.DetailResponse} — all 13 partner fields.
 * Eliminates the cross-domain Postgres re-read that was previously needed to
 * build a {@link com.example.partner.elasticsearch.PartnerDocument}.
 */
public record PartnerIndexRequest(
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
) {}
