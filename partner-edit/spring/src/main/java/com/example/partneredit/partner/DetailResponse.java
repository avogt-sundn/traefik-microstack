package com.example.partneredit.partner;

public record DetailResponse(
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
    static DetailResponse from(Partner p) {
        return new DetailResponse(
                p.getPartnerNumber(),
                p.getAlphaCode(),
                p.getName1(),
                p.getName2(),
                p.getName3(),
                p.getFirstname(),
                p.getStreet(),
                p.getHouseNumber(),
                p.getPostalCode(),
                p.getCity(),
                p.getType(),
                p.getGroupType(),
                p.getGroupNumber()
        );
    }
}
