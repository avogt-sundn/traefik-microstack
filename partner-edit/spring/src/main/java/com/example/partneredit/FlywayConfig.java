package com.example.partneredit;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jpa.autoconfigure.EntityManagerFactoryDependsOnPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Explicit Flyway configuration — required because Spring Boot 4 moved Flyway
 * autoconfiguration to a separate module (spring-boot-flyway) that is not yet
 * transitively included via spring-boot-starter-data-jpa.
 *
 * EntityManagerFactoryDependsOnPostProcessor ensures the EntityManagerFactory
 * bean waits for "flyway" to finish migrating before it initializes.
 */
@Configuration
public class FlywayConfig {

    @Bean(initMethod = "migrate")
    public Flyway flyway(
            DataSource dataSource,
            @Value("${spring.flyway.locations:classpath:db/migration}") String[] locations) {
        return Flyway.configure()
            .dataSource(dataSource)
            .locations(locations)
            .load();
    }

    /** Makes the JPA EntityManagerFactory depend on the "flyway" bean. */
    @Bean
    public static EntityManagerFactoryDependsOnPostProcessor flywayEntityManagerFactoryDependsOn() {
        return new EntityManagerFactoryDependsOnPostProcessor("flyway");
    }
}
