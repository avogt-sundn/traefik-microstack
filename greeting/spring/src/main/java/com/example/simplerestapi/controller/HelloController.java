
package com.example.simplerestapi.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.simplerestapi.model.Greeting;
import com.example.simplerestapi.service.GreetingService;

import jakarta.annotation.security.RolesAllowed;

@RestController
@RequestMapping("/api/two")
public class HelloController {

    private final GreetingService greetingService;

    public HelloController(GreetingService greetingService) {
        this.greetingService = greetingService;
    }

    @GetMapping("/hello")
    public String sayHello() {
        return "Hello, World!";
    }

    @PostMapping(value = "/greet", consumes = MediaType.TEXT_PLAIN_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @RolesAllowed({ "USER" })
    @ResponseStatus(HttpStatus.CREATED)
    public Greeting greetUser(@RequestBody String name) {
        return greetingService.saveGreeting(name);
    }

    @GetMapping(value = "/greetings", produces = MediaType.APPLICATION_JSON_VALUE)
    @RolesAllowed({ "USER" })
    public List<Greeting> getAllGreetings() {
        return greetingService.getAllGreetings();
    }
}
