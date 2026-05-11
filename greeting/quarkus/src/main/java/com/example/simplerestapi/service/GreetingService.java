package com.example.simplerestapi.service;

import com.example.simplerestapi.model.Greeting;
import com.example.simplerestapi.repository.GreetingRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

/**
 * Greeting Service - Quarkus version.
 *
 * Differences from Spring:
 * - Uses @ApplicationScoped instead of @Service (CDI scopes are more explicit)
 * - Uses @Inject instead of constructor injection (though both work)
 * - Cleaner dependency management with Quarkus CDI
 * - Better startup time due to build-time optimizations
 */
@ApplicationScoped
public class GreetingService {

    @Inject
    GreetingRepository greetingRepository;

    public Greeting saveGreeting(String name) {
        String message = "Hello, " + name + "!";
        Greeting greeting = new Greeting(name, message);
        greetingRepository.persist(greeting);
        return greeting;
    }

    public List<Greeting> getAllGreetings() {
        return greetingRepository.listAll();
    }
}