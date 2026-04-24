package com.example.partner.elasticsearch;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * ES document for the "partners" index — read-side projection, not the JPA entity.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class PartnerDocument {

    public Long partnerNumber;
    public String alphaCode;
    public String name1;
    public String name2;
    public String name3;
    public String firstname;
    public String street;
    public String houseNumber;
    public String postalCode;
    public String city;
    public String type;
    public String groupType;
    public Long groupNumber;
}
