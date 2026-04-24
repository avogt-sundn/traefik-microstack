package com.example.simplerestapi.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;

/**
 * Greeting entity - same as Spring version but using Quarkus/Hibernate ORM.
 * Quarkus Panache provides simplified ORM access with less boilerplate.
 * Extends PanacheEntity to get Id management automatically.
 */
@Entity
public class Greeting extends PanacheEntity {

    public String name;
    public String message;

    public Greeting() {
    }

    public Greeting(String name, String message) {
        this.name = name;
        this.message = message;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}