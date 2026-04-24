package com.example.partner.elasticsearch;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.indices.PutIndicesSettingsRequest;
import com.example.partner.model.Partner;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.data.elasticsearch.core.document.Document;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Creates the "partners" ES index with custom mapping on startup and bulk-indexes
 * all partners from the JPA repository. Skips reindex if the index already has documents.
 */
@Service
public class PartnerIndexService {

    private static final Logger log = LoggerFactory.getLogger(PartnerIndexService.class);

    private static final String INDEX_MAPPING = """
        {
          "settings": {
            "number_of_replicas": 0,
            "analysis": {
              "char_filter": {
                "umlaut_mapping": {
                  "type": "mapping",
                  "mappings": ["ä => ae", "ö => oe", "ü => ue", "ß => ss", "Ä => Ae", "Ö => Oe", "Ü => Ue"]
                }
              },
              "filter": {
                "german_asciifolding": { "type": "asciifolding", "preserve_original": true }
              },
              "analyzer": {
                "german_search": {
                  "type": "custom",
                  "tokenizer": "standard",
                  "filter": ["lowercase", "german_asciifolding"]
                },
                "autocomplete_index": {
                  "tokenizer": "autocomplete_tokenizer",
                  "filter": ["lowercase", "german_asciifolding"]
                },
                "autocomplete_search": {
                  "tokenizer": "standard",
                  "char_filter": ["umlaut_mapping"],
                  "filter": ["lowercase"]
                }
              },
              "tokenizer": {
                "autocomplete_tokenizer": { "type": "edge_ngram", "min_gram": 2, "max_gram": 20, "token_chars": ["letter", "digit"] }
              },
              "normalizer": { "lowercase_norm": { "type": "custom", "filter": ["lowercase"] } }
            }
          },
          "mappings": {
            "properties": {
              "partnerNumber": { "type": "long", "fields": { "keyword": { "type": "keyword" } } },
              "alphaCode": { "type": "keyword", "normalizer": "lowercase_norm" },
              "name1": { "type": "text", "analyzer": "german_search", "copy_to": "fullName", "fields": { "autocomplete": { "type": "text", "analyzer": "autocomplete_index", "search_analyzer": "autocomplete_search" }, "keyword": { "type": "keyword" } } },
              "name2": { "type": "text", "analyzer": "german_search", "copy_to": "fullName" },
              "name3": { "type": "text", "analyzer": "german_search", "copy_to": "fullName" },
              "firstname": { "type": "text", "analyzer": "german_search", "copy_to": "fullName", "fields": { "autocomplete": { "type": "text", "analyzer": "autocomplete_index", "search_analyzer": "autocomplete_search" } } },
              "fullName": { "type": "text", "analyzer": "german_search" },
              "street": { "type": "text", "analyzer": "german_search", "fields": { "keyword": { "type": "keyword" } } },
              "houseNumber": { "type": "keyword", "index": false },
              "postalCode": { "type": "keyword" },
              "city": { "type": "text", "analyzer": "german_search", "fields": { "autocomplete": { "type": "text", "analyzer": "autocomplete_index", "search_analyzer": "autocomplete_search" }, "keyword": { "type": "keyword" } } },
              "type": { "type": "keyword" },
              "groupType": { "type": "keyword" },
              "groupNumber": { "type": "long" }
            }
          }
        }
        """;

    private final ElasticsearchOperations elasticsearchOperations;
    private final ElasticsearchClient elasticsearchClient;
    private final EntityManager entityManager;

    public PartnerIndexService(ElasticsearchOperations elasticsearchOperations,
                               ElasticsearchClient elasticsearchClient,
                               EntityManager entityManager) {
        this.elasticsearchOperations = elasticsearchOperations;
        this.elasticsearchClient = elasticsearchClient;
        this.entityManager = entityManager;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void indexOnStartup() {
        try {
            IndexOperations indexOps = elasticsearchOperations.indexOps(PartnerDocument.class);

            if (indexOps.exists()) {
                long count = elasticsearchOperations.count(
                    org.springframework.data.elasticsearch.core.query.Query.findAll(),
                    PartnerDocument.class
                );
                if (count > 0) {
                    log.info("ES index 'partners' already has {} documents — skipping reindex.", count);
                    return;
                }
                indexOps.delete();
            }

            // Parse the combined settings+mappings JSON
            Document settingsAndMappings = Document.parse(INDEX_MAPPING);

            @SuppressWarnings("unchecked")
            Map<String, Object> settings = (Map<String, Object>) settingsAndMappings.get("settings");
            @SuppressWarnings("unchecked")
            Map<String, Object> mappings = (Map<String, Object>) settingsAndMappings.get("mappings");

            indexOps.create(settings);
            indexOps.putMapping(Document.from(mappings));

            // Disable auto-refresh during bulk load to prevent segment pressure data loss
            elasticsearchClient.indices().putSettings(PutIndicesSettingsRequest.of(r -> r
                .index("partners")
                .settings(s -> s.refreshInterval(t -> t.time("-1")))));

            // Keyset (cursor) pagination to avoid gap-prone offset pagination on 1.2M rows
            int PAGE_SIZE = 500;
            long indexed = 0;
            long lastPartnerNumber = 0;
            List<Partner> batch;
            do {
                final long cursor = lastPartnerNumber;
                @SuppressWarnings("unchecked")
                List<Partner> page = entityManager.createQuery(
                    "FROM Partner p WHERE p.partnerNumber > :cursor ORDER BY p.partnerNumber ASC", Partner.class)
                    .setParameter("cursor", cursor)
                    .setMaxResults(PAGE_SIZE)
                    .getResultList();
                batch = page;
                if (!batch.isEmpty()) {
                    List<PartnerDocument> docs = batch.stream().map(this::toDocument).toList();
                    elasticsearchOperations.save(docs);
                    indexed += docs.size();
                    lastPartnerNumber = batch.getLast().getPartnerNumber();
                    if (indexed % 100_000 == 0) {
                        log.info("ES index progress: {} documents indexed.", indexed);
                    }
                }
            } while (batch.size() == PAGE_SIZE);

            // Restore refresh interval and force a refresh to make all docs visible
            elasticsearchClient.indices().putSettings(PutIndicesSettingsRequest.of(r -> r
                .index("partners")
                .settings(s -> s.refreshInterval(t -> t.time("1s")))));
            indexOps.refresh();
            log.info("ES index 'partners' created and {} documents indexed.", indexed);

        } catch (Exception e) {
            log.error("Failed to index partners in Elasticsearch — search will fall back to Postgres only.", e);
        }
    }

    private PartnerDocument toDocument(Partner p) {
        PartnerDocument doc = new PartnerDocument();
        doc.setPartnerNumber(p.getPartnerNumber());
        doc.setAlphaCode(p.getAlphaCode());
        doc.setName1(p.getName1());
        doc.setName2(p.getName2());
        doc.setName3(p.getName3());
        doc.setFirstname(p.getFirstname());
        doc.setStreet(p.getStreet());
        doc.setHouseNumber(p.getHouseNumber());
        doc.setPostalCode(p.getPostalCode());
        doc.setCity(p.getCity());
        doc.setType(p.getType());
        doc.setGroupType(p.getGroupType());
        doc.setGroupNumber(p.getGroupNumber());
        return doc;
    }
}
