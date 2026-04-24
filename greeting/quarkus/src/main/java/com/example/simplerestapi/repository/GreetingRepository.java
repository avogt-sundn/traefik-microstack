package com.example.simplerestapi.repository;

import com.example.simplerestapi.model.Greeting;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

/**
 * Greeting Repository using Quarkus Panache.
 *
 * Advantages over Spring Data JPA:
 * - No need to extend a complex interface
 * - Get common CRUD operations automatically (find(), list(), persist(), delete())
 * - Less boilerplate code
 * - Works seamlessly with Quarkus CDI injection
 * - Better compile-time optimizations
 */
@ApplicationScoped
public class GreetingRepository implements PanacheRepository<Greeting> {

    // Panache provides all CRUD methods automatically:
    // - find(id) / getById(id)
    // - list() / listAll()
    // - persist() / persistAndFlush()
    // - delete() / deleteAll()
    // And more...
}