package com.example.partner.service;
import com.example.partner.model.Partner;
import com.example.partner.model.PartnerGroupSearchDto;
import com.example.partner.model.PartnerGroupSearchResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PartnerSearchService {

    private static final String SELECT_COLS =
        "SELECT id, partner_number, alpha_code, name1, name2, name3, firstname," +
        " street, house_number, postal_code, city, type, group_type, group_number" +
        " FROM partner WHERE 1=1";

    private final EntityManager entityManager;
    private final int maxResults;

    public PartnerSearchService(
            EntityManager entityManager,
            @Value("${partner.search.max-results:200}") int maxResults) {
        this.entityManager = entityManager;
        this.maxResults = maxResults;
    }

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

    public PartnerGroupSearchResponse search(List<String> tokens) {
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();
        int paramIdx = 1;

        for (String token : tokens) {
            if (token == null || token.isBlank()) {
                continue;
            }
            String likePattern = "%" + token + "%";
            String expanded = expandUmlauts(token);
            String expandedPattern = "%" + expanded + "%";
            boolean hasExpanded = !expanded.equals(token);

            // Each token generates an OR group across fields + optional umlaut-expanded duplicate.
            // unaccent(lower(col)) LIKE unaccent(lower(?)) handles ß→ss and strips diacritics.
            // The expanded form (mueller→müller) provides an additional path so that:
            //   unaccent(lower(name1)) LIKE unaccent(lower('%müller%'))
            //   → 'muller gmbh' LIKE '%muller%' → TRUE.
            whereClause.append(" AND (partner_number::text LIKE ?").append(paramIdx)
               .append(" OR unaccent(lower(alpha_code)) LIKE unaccent(lower(?").append(paramIdx + 1).append("))")
               .append(" OR unaccent(lower(name1)) LIKE unaccent(lower(?").append(paramIdx + 2).append("))")
               .append(" OR unaccent(lower(name2)) LIKE unaccent(lower(?").append(paramIdx + 3).append("))")
               .append(" OR unaccent(lower(name3)) LIKE unaccent(lower(?").append(paramIdx + 4).append("))")
               .append(" OR unaccent(lower(firstname)) LIKE unaccent(lower(?").append(paramIdx + 5).append("))")
               .append(" OR postal_code LIKE ?").append(paramIdx + 6)
               .append(" OR unaccent(lower(city)) LIKE unaccent(lower(?").append(paramIdx + 7).append("))")
               .append(" OR unaccent(lower(street)) LIKE unaccent(lower(?").append(paramIdx + 8).append("))")
               ;
            for (int i = 0; i < 9; i++) {
                params.add(likePattern);
            }
            paramIdx += 9;

            if (hasExpanded) {
                whereClause
                   .append(" OR unaccent(lower(name1)) LIKE unaccent(lower(?").append(paramIdx).append("))")
                   .append(" OR unaccent(lower(name2)) LIKE unaccent(lower(?").append(paramIdx + 1).append("))")
                   .append(" OR unaccent(lower(name3)) LIKE unaccent(lower(?").append(paramIdx + 2).append("))")
                   .append(" OR unaccent(lower(firstname)) LIKE unaccent(lower(?").append(paramIdx + 3).append("))")
                   .append(" OR unaccent(lower(city)) LIKE unaccent(lower(?").append(paramIdx + 4).append("))")
                   .append(" OR unaccent(lower(street)) LIKE unaccent(lower(?").append(paramIdx + 5).append("))")
                   ;
                for (int i = 0; i < 6; i++) {
                    params.add(expandedPattern);
                }
                paramIdx += 6;
            }
            whereClause.append(")");
        }

        Query storeTotalQuery = entityManager.createNativeQuery("SELECT COUNT(*) FROM partner");
        int storeTotalCount = ((Number) storeTotalQuery.getSingleResult()).intValue();

        Query countQuery = entityManager.createNativeQuery(
            "SELECT COUNT(*) FROM partner WHERE 1=1" + whereClause);
        for (int i = 0; i < params.size(); i++) {
            countQuery.setParameter(i + 1, params.get(i));
        }
        int totalCount = ((Number) countQuery.getSingleResult()).intValue();

        Query query = entityManager.createNativeQuery(
            SELECT_COLS + whereClause + " LIMIT " + maxResults, Partner.class);
        for (int i = 0; i < params.size(); i++) {
            query.setParameter(i + 1, params.get(i));
        }

        @SuppressWarnings("unchecked")
        List<Partner> results = query.getResultList();

        List<PartnerGroupSearchDto> dtos = results.stream().map(this::toDto).toList();
        return new PartnerGroupSearchResponse(dtos, totalCount, dtos.size(), storeTotalCount);
    }

    private PartnerGroupSearchDto toDto(Partner p) {
        return new PartnerGroupSearchDto(
            p.getPartnerNumber(),
            p.getGroupNumber(),
            p.getType(),
            p.getAlphaCode(),
            p.getName1(),
            p.getName2(),
            p.getName3(),
            p.getFirstname(),
            p.getStreet(),
            p.getHouseNumber(),
            p.getPostalCode(),
            p.getCity(),
            p.getGroupType()
        );
    }
}
