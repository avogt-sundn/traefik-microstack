
package com.example.simplerestapi.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.simplerestapi.model.Greeting;
import com.example.simplerestapi.service.ForwardingGreetingService;

@RestController
@RequestMapping("/api/one")
public class HelloController {

    private final ForwardingGreetingService greetingService;

    public HelloController(ForwardingGreetingService greetingService) {
        this.greetingService = greetingService;
    }

    @GetMapping("/hello")
    public String sayHello() {
        return "Hello, World!";
    }

    @PostMapping("/greet")
    public Greeting greetUser(@RequestBody String name) {
        return greetingService.saveGreeting(name);
    }

    @GetMapping("/greetings")
    public List<Greeting> getAllGreetings() {
        return greetingService.getAllGreetings();
    }
}
