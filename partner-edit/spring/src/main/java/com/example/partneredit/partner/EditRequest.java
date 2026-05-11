package com.example.partneredit.partner;

public record EditRequest(
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
