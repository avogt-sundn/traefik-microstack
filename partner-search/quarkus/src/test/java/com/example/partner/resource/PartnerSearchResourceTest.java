package com.example.partner.resource;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;

/**
 * Integration tests for PartnerSearchResource against the DevServices Postgres container.
 * Seed data loaded by Flyway V1–V4 (same scripts as Spring). Assertions use
 * greaterThanOrEqualTo so they hold whether or not V5 bulk data is present.
 */
@QuarkusTest
class PartnerSearchResourceTest {

    // --- GET /api/partner/quarkus/search ---

    @Test
    void search_noQuery_returnsAllSeedPartners() {
        given()
            .when().get("/api/partner/quarkus/search")
            .then()
            .statusCode(200)
            .body("postgres.totalCount", greaterThanOrEqualTo(51));
    }

    @Test
    void search_byCity_returnsMünchenPartners() {
        given()
            .queryParam("q", "München")
            .when().get("/api/partner/quarkus/search")
            .then()
            .statusCode(200)
            // seed: 200001 Bayern Finanz AG, 200002 Münchner Softwarehaus GmbH, etc.
            .body("postgres.totalCount", greaterThanOrEqualTo(3))
            .body("postgres.results.city", everyItem(is("München")));
    }

    @Test
    void search_byPartnerNumber_returnsMatchingPartners() {
        // seed: 100002 SCHM Schmidt & Partner KG, Paderborn
        // Substring search: '100002' may match other partner_numbers containing those digits.
        given()
            .queryParam("q", "100002")
            .when().get("/api/partner/quarkus/search")
            .then()
            .statusCode(200)
            .body("postgres.totalCount", greaterThanOrEqualTo(1))
            .body("postgres.results.find { it.alphaCode == 'SCHM' }.city", is("Paderborn"));
    }

    @Test
    void search_byAlphaCode_returnsExactPartner() {
        // seed: 100001 MULL Müller GmbH, Paderborn — alpha code is unique in V2–V4 data
        // 'MULL' won't match any bulk-generated alpha code (bulk uses 3-letter prefix + digits)
        given()
            .queryParam("q", "MULL")
            .when().get("/api/partner/quarkus/search")
            .then()
            .statusCode(200)
            .body("postgres.totalCount", is(1))
            .body("postgres.results[0].name1", is("Müller GmbH"));
    }

    @Test
    void search_byPostalCode_returnsBothBerlinPartners() {
        // seed: 400001 Berliner Innovations GmbH and 400002 Brandenburg Tech AG share postal 10117
        given()
            .queryParam("q", "10117")
            .when().get("/api/partner/quarkus/search")
            .then()
            .statusCode(200)
            .body("postgres.totalCount", greaterThanOrEqualTo(2));
    }

    @Test
    void search_unknownTerm_returnsEmpty() {
        given()
            .queryParam("q", "XYZNOTEXIST99999")
            .when().get("/api/partner/quarkus/search")
            .then()
            .statusCode(200)
            .body("postgres.totalCount", is(0))
            .body("postgres.results", hasSize(0));
    }

    // --- GET /api/partner/quarkus/{partnerNumber} ---

    @Test
    void getPartner_returns404() {
        given()
            .when().get("/api/partner/quarkus/100001")
            .then()
            .statusCode(404);
    }
}
