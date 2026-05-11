package com.example.partner.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for PartnerSearchController against the live postgres-partner container.
 * Seed data is loaded by Flyway (V2__seed_demo_partners.sql).
 */
@SpringBootTest
@AutoConfigureMockMvc
class PartnerSearchControllerTest {

    @Autowired
    MockMvc mockMvc;

    // --- GET /api/partner/search ---

    @Test
    void search_noQuery_returnsAllSeedPartners() throws Exception {
        mockMvc.perform(get("/api/partner/spring/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postgres.totalCount", greaterThanOrEqualTo(51)));
    }

    @Test
    void search_byCity_returnsMünchenPartners() throws Exception {
        mockMvc.perform(get("/api/partner/spring/search").param("q", "München"))
                .andExpect(status().isOk())
                // seed: 200001 Bayern Finanz AG, 200002 Münchner Softwarehaus GmbH, etc.
                .andExpect(jsonPath("$.postgres.totalCount", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.postgres.results[*].city", everyItem(is("München"))));
    }

    @Test
    void search_byPartnerNumber_returnsMatchingPartners() throws Exception {
        // seed: 100002 SCHM Schmidt & Partner KG, Paderborn
        // Substring search: '100002' also matches any partner_number containing those digits,
        // so only assert that the seed partner is present in the results.
        mockMvc.perform(get("/api/partner/spring/search").param("q", "100002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postgres.totalCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.postgres.results[?(@.alphaCode == 'SCHM')].city", hasItem("Paderborn")));
    }

    @Test
    void search_byAlphaCode_returnsExactPartner() throws Exception {
        // seed: 100001 MULL Müller GmbH, Paderborn — alpha code is unique
        // 'MULL' won't match any bulk-generated name (Müller → prefix MÜL ≠ MUL) or street
        mockMvc.perform(get("/api/partner/spring/search").param("q", "MULL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postgres.totalCount", is(1)))
                .andExpect(jsonPath("$.postgres.results[0].name1", is("Müller GmbH")));
    }

    @Test
    void search_byPostalCode_returnsBothBerlinPartners() throws Exception {
        // seed: 400001 Berliner Innovations GmbH and 400002 Brandenburg Tech AG share postal code 10117
        // Substring search: '10117' matches any field containing those digits.
        mockMvc.perform(get("/api/partner/spring/search").param("q", "10117"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postgres.totalCount", greaterThanOrEqualTo(2)));
    }

    @Test
    void search_unknownTerm_returnsEmpty() throws Exception {
        mockMvc.perform(get("/api/partner/spring/search").param("q", "XYZNOTEXIST99999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postgres.totalCount", is(0)))
                .andExpect(jsonPath("$.postgres.results", hasSize(0)));
    }

    // --- GET /api/partner/{partnerNumber} ---

    @Test
    void getPartner_returns404() throws Exception {
        mockMvc.perform(get("/api/partner/spring/100001"))
                .andExpect(status().isNotFound());
    }
}
