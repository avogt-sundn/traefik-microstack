package com.example.simplerestapi.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.example.simplerestapi.model.Greeting;

@Service
public class ForwardingGreetingService {

    private static final String API_TWO_HOST = "gateway";
    private final WebClient webClient;

    public ForwardingGreetingService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Greeting saveGreeting(String g) {
        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host(API_TWO_HOST)
                        .path("/api/two/greet")
                        .build())
                .bodyValue(g)
                .retrieve()
                .bodyToMono(Greeting.class)
                .block();
    }

    public List<Greeting> getAllGreetings() {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host(API_TWO_HOST)
                        .path("/api/two/greetings")
                        .build())
                .retrieve()
                .bodyToFlux(Greeting.class)
                .collectList()
                .block();
    }
}