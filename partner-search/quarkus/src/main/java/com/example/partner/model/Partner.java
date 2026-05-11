package com.example.partner.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "partner")
public class Partner extends PanacheEntity {

    @Column(name = "partner_number")
    public Long partnerNumber;

    @Column(name = "alpha_code", length = 10)
    public String alphaCode;

    @Column(name = "name1", length = 35)
    public String name1;

    @Column(name = "name2", length = 35)
    public String name2;

    @Column(name = "name3", length = 35)
    public String name3;

    @Column(name = "firstname", length = 35)
    public String firstname;

    @Column(name = "street", length = 35)
    public String street;

    @Column(name = "house_number", length = 10)
    public String houseNumber;

    @Column(name = "postal_code", length = 5)
    public String postalCode;

    @Column(name = "city", length = 35)
    public String city;

    @Column(name = "type", length = 1)
    public String type;

    @Column(name = "group_type", length = 10)
    public String groupType;

    @Column(name = "group_number")
    public Long groupNumber;

    // name_search_vec is DB-managed (GENERATED ALWAYS), not mapped here
}
