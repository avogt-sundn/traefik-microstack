package com.example.simplerestapi.service;

import org.springframework.boot.ssl.SslBundle;
import org.springframework.boot.ssl.SslBundles;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;

import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import reactor.netty.http.client.HttpClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient(SslBundles sslBundles) throws Exception {

        SslBundle bundle = sslBundles.getBundle("client-bundle");

        SslContext nettySslContext = SslContextBuilder
                .forClient()
                .keyManager(bundle.getManagers().getKeyManagerFactory())
                .trustManager(bundle.getManagers().getTrustManagerFactory())
                .build();

        HttpClient httpClient = HttpClient.create()
                .secure(sslSpec -> sslSpec.sslContext(nettySslContext));

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

}