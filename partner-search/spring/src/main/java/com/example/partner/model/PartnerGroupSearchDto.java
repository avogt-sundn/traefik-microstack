package com.example.partner.model;

public record PartnerGroupSearchDto(
    Long partnerNumber,
    Long groupNumber,
    String type,
    String alphaCode,
    String name1,
    String name2,
    String name3,
    String firstname,
    String street,
    String houseNumber,
    String postalCode,
    String city,
    String groupType
) {}
