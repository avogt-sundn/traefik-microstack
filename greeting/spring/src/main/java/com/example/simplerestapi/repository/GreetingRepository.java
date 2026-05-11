package com.example.simplerestapi.repository;

import com.example.simplerestapi.model.Greeting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GreetingRepository extends JpaRepository<Greeting, Long> {
}