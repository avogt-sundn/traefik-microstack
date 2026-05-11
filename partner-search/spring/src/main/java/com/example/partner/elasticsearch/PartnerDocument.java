package com.example.partner.elasticsearch;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;

/**
 * Elasticsearch document mapping for the "partners" index.
 * Separate from the JPA Partner entity — ES is a read-side projection.
 */
@Document(indexName = "partners", createIndex = false)
public class PartnerDocument {

    @Id
    private Long partnerNumber;

    private String alphaCode;
    private String name1;
    private String name2;
    private String name3;
    private String firstname;
    private String street;
    private String houseNumber;
    private String postalCode;
    private String city;
    private String type;
    private String groupType;
    private Long groupNumber;

    private Float score;

    public PartnerDocument() {}

    public Long getPartnerNumber() { return partnerNumber; }
    public void setPartnerNumber(Long partnerNumber) { this.partnerNumber = partnerNumber; }

    public String getAlphaCode() { return alphaCode; }
    public void setAlphaCode(String alphaCode) { this.alphaCode = alphaCode; }

    public String getName1() { return name1; }
    public void setName1(String name1) { this.name1 = name1; }

    public String getName2() { return name2; }
    public void setName2(String name2) { this.name2 = name2; }

    public String getName3() { return name3; }
    public void setName3(String name3) { this.name3 = name3; }

    public String getFirstname() { return firstname; }
    public void setFirstname(String firstname) { this.firstname = firstname; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getHouseNumber() { return houseNumber; }
    public void setHouseNumber(String houseNumber) { this.houseNumber = houseNumber; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getGroupType() { return groupType; }
    public void setGroupType(String groupType) { this.groupType = groupType; }

    public Long getGroupNumber() { return groupNumber; }
    public void setGroupNumber(Long groupNumber) { this.groupNumber = groupNumber; }

    public Float getScore() { return score; }
    public void setScore(Float score) { this.score = score; }
}
