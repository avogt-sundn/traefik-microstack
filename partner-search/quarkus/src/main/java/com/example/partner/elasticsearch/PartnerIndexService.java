package com.example.partner.elasticsearch;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.bulk.BulkOperation;
import co.elastic.clients.elasticsearch.indices.CreateIndexRequest;
import com.example.partner.model.Partner;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.io.StringReader;
import java.util.List;

/**
 * Creates the "partners" ES index with custom mapping on startup and bulk-indexes
 * all partners from Panache. Skips reindex if the index already has documents.
 */
@ApplicationScoped
public class PartnerIndexService {

    private static final Logger log = Logger.getLogger(PartnerIndexService.class);

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

    @Inject
    ElasticsearchClient esClient;

    public void onStartup(@Observes StartupEvent event) {
        try {
            if (indexHasDocuments()) {
                log.infof("ES index 'partners' already has documents — skipping reindex.");
                return;
            }

            deleteIndexIfExists();

            esClient.indices().create(CreateIndexRequest.of(r -> r
                .index("partners")
                .withJson(new StringReader(INDEX_MAPPING))));

            int PAGE_SIZE = 1_000;
            long indexed = 0;
            int page = 0;
            List<Partner> batch;
            do {
                batch = loadPage(page++, PAGE_SIZE);
                if (!batch.isEmpty()) {
                    bulkIndex(batch);
                    indexed += batch.size();
                }
            } while (!batch.isEmpty());
            log.infof("ES index 'partners' created and %d documents indexed.", indexed);

        } catch (Exception e) {
            log.errorf(e, "Failed to index partners in Elasticsearch — search will fall back to Postgres only.");
        }
    }

    @jakarta.transaction.Transactional
    public List<Partner> loadPage(int page, int size) {
        return Partner.find("ORDER BY id").page(page, size).list();
    }

    private boolean indexHasDocuments() {
        try {
            long count = esClient.count(c -> c.index("partners")).count();
            return count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void deleteIndexIfExists() {
        try {
            esClient.indices().delete(d -> d.index("partners"));
        } catch (Exception ignored) {
        }
    }

    private void bulkIndex(List<Partner> partners) throws Exception {
        List<BulkOperation> ops = partners.stream()
            .map(p -> BulkOperation.of(op -> op
                .index(i -> i
                    .index("partners")
                    .id(String.valueOf(p.partnerNumber))
                    .document(toDocument(p)))))
            .toList();

        esClient.bulk(BulkRequest.of(r -> r.operations(ops)));
    }

    private PartnerDocument toDocument(Partner p) {
        PartnerDocument d = new PartnerDocument();
        d.partnerNumber = p.partnerNumber;
        d.alphaCode     = p.alphaCode;
        d.name1         = p.name1;
        d.name2         = p.name2;
        d.name3         = p.name3;
        d.firstname     = p.firstname;
        d.street        = p.street;
        d.houseNumber   = p.houseNumber;
        d.postalCode    = p.postalCode;
        d.city          = p.city;
        d.type          = p.type;
        d.groupType     = p.groupType;
        d.groupNumber   = p.groupNumber;
        return d;
    }
}
