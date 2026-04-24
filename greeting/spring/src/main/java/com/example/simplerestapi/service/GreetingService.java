package com.example.simplerestapi.service;

import com.example.simplerestapi.model.Greeting;
import com.example.simplerestapi.repository.GreetingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GreetingService {

    private final GreetingRepository greetingRepository;

    public GreetingService(GreetingRepository greetingRepository) {
        this.greetingRepository = greetingRepository;
    }

    public Greeting saveGreeting(String name) {
        String message = "Hello, " + name + "!";
        Greeting greeting = new Greeting(name, message);
        return greetingRepository.save(greeting);
    }

    public List<Greeting> getAllGreetings() {
        return greetingRepository.findAll();
    }
}