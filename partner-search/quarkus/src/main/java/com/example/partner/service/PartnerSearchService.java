package com.example.partner.service;

import com.example.partner.model.Partner;
import com.example.partner.model.PartnerGroupSearchResponse;
import com.example.partner.model.PartnerGroupSearchDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.ArrayList;
import java.util.List;

/**
 * Executes partner search queries using native SQL via EntityManager.
 * Each token generates an AND-group that ORs across all searchable columns.
 */
@ApplicationScoped
public class PartnerSearchService {

    @ConfigProperty(name = "partner.search.max-results", defaultValue = "200")
    int maxResults;

    @Inject
    EntityManager em;

    /**
     * Expands ASCII umlaut digraphs to actual umlaut characters so that a PG
     * search for "mueller" also matches "Müller" via unaccent:
     * unaccent('Müller') = 'Muller', unaccent('müller') = 'muller'.
     * By also searching for '%müller%' we cover the umlaut form directly.
     */
    private static String expandUmlauts(String token) {
        return token
            .replace("ae", "ä").replace("oe", "ö").replace("ue", "ü").replace("ss", "ß")
            .replace("Ae", "Ä").replace("Oe", "Ö").replace("Ue", "Ü");
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public PartnerGroupSearchResponse search(List<String> tokens) {
        if (tokens == null || tokens.isEmpty()) {
            List<Partner> all = em.createQuery("FROM Partner p", Partner.class)
                    .setMaxResults(maxResults)
                    .getResultList();
            List<PartnerGroupSearchDto> dtos = all.stream().map(this::toDto).toList();
            return new PartnerGroupSearchResponse(dtos, dtos.size(), dtos.size());
        }

        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();
        int paramIndex = 1;

        for (String token : tokens) {
            String likeParam = "%" + token + "%";
            String expanded = expandUmlauts(token);
            String expandedParam = "%" + expanded + "%";
            boolean hasExpanded = !expanded.equals(token);

            whereClause.append(" AND (")
               .append("p.partner_number::text LIKE ?").append(paramIndex++).append(" OR ")
               .append("unaccent(lower(p.alpha_code)) LIKE unaccent(lower(?").append(paramIndex++).append(")) OR ")
               .append("unaccent(lower(p.name1)) LIKE unaccent(lower(?").append(paramIndex++).append(")) OR ")
               .append("unaccent(lower(p.name2)) LIKE unaccent(lower(?").append(paramIndex++).append(")) OR ")
               .append("unaccent(lower(p.name3)) LIKE unaccent(lower(?").append(paramIndex++).append(")) OR ")
               .append("unaccent(lower(p.firstname)) LIKE unaccent(lower(?").append(paramIndex++).append(")) OR ")
               .append("p.postal_code LIKE ?").append(paramIndex++).append(" OR ")
               .append("unaccent(lower(p.city)) LIKE unaccent(lower(?").append(paramIndex++).append(")) OR ")
               .append("unaccent(lower(p.street)) LIKE unaccent(lower(?").append(paramIndex++).append("))");

            params.add(likeParam);  // partner_number LIKE
            params.add(likeParam);  // alpha_code unaccent
            params.add(likeParam);  // name1 unaccent
            params.add(likeParam);  // name2 unaccent
            params.add(likeParam);  // name3 unaccent
            params.add(likeParam);  // firstname unaccent
            params.add(likeParam);  // postal_code LIKE
            params.add(likeParam);  // city unaccent
            params.add(likeParam);  // street unaccent

            if (hasExpanded) {
                // Add expanded umlaut form so mueller→müller matches via unaccent
                whereClause
                   .append(" OR unaccent(lower(p.name1)) LIKE unaccent(lower(?").append(paramIndex++).append("))")
                   .append(" OR unaccent(lower(p.name2)) LIKE unaccent(lower(?").append(paramIndex++).append("))")
                   .append(" OR unaccent(lower(p.name3)) LIKE unaccent(lower(?").append(paramIndex++).append("))")
                   .append(" OR unaccent(lower(p.firstname)) LIKE unaccent(lower(?").append(paramIndex++).append("))")
                   .append(" OR unaccent(lower(p.city)) LIKE unaccent(lower(?").append(paramIndex++).append("))")
                   .append(" OR unaccent(lower(p.street)) LIKE unaccent(lower(?").append(paramIndex++).append("))");
                params.add(expandedParam);  // name1 expanded
                params.add(expandedParam);  // name2 expanded
                params.add(expandedParam);  // name3 expanded
                params.add(expandedParam);  // firstname expanded
                params.add(expandedParam);  // city expanded
                params.add(expandedParam);  // street expanded
            }
            whereClause.append(")");
        }

        var countQuery = em.createNativeQuery("SELECT COUNT(*) FROM partner p WHERE 1=1" + whereClause);
        for (int i = 0; i < params.size(); i++) {
            countQuery.setParameter(i + 1, params.get(i));
        }
        int totalCount = ((Number) countQuery.getSingleResult()).intValue();

        var query = em.createNativeQuery("SELECT p.* FROM partner p WHERE 1=1" + whereClause + " LIMIT " + maxResults, Partner.class);
        for (int i = 0; i < params.size(); i++) {
            query.setParameter(i + 1, params.get(i));
        }

        List<Partner> results = query.getResultList();
        List<PartnerGroupSearchDto> dtos = results.stream().map(this::toDto).toList();
        return new PartnerGroupSearchResponse(dtos, totalCount, dtos.size());
    }

    private PartnerGroupSearchDto toDto(Partner p) {
        return new PartnerGroupSearchDto(
            p.partnerNumber, p.alphaCode,
            p.name1, p.name2, p.name3, p.firstname,
            p.street, p.houseNumber, p.postalCode, p.city,
            p.type, p.groupType, p.groupNumber
        );
    }
}
