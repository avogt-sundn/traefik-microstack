package com.example.partner.index;

import com.example.partner.elasticsearch.PartnerDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Service;

/**
 * Upserts a {@link PartnerDocument} in Elasticsearch from the payload pushed by
 * partner-edit. No Postgres read is performed — the caller supplies all fields.
 */
@Service
public class IndexService {

    private static final Logger log = LoggerFactory.getLogger(IndexService.class);

    private final ElasticsearchOperations elasticsearchOperations;

    public IndexService(ElasticsearchOperations elasticsearchOperations) {
        this.elasticsearchOperations = elasticsearchOperations;
    }

    /**
     * Upserts the Elasticsearch document from the provided request payload.
     */
    public void reindex(PartnerIndexRequest request) {
        PartnerDocument doc = toDocument(request);
        elasticsearchOperations.save(doc);
        log.debug("Reindexed partner {} in Elasticsearch", request.partnerNumber());
    }

    private PartnerDocument toDocument(PartnerIndexRequest r) {
        PartnerDocument doc = new PartnerDocument();
        doc.setPartnerNumber(r.partnerNumber());
        doc.setAlphaCode(r.alphaCode());
        doc.setName1(r.name1());
        doc.setName2(r.name2());
        doc.setName3(r.name3());
        doc.setFirstname(r.firstname());
        doc.setStreet(r.street());
        doc.setHouseNumber(r.houseNumber());
        doc.setPostalCode(r.postalCode());
        doc.setCity(r.city());
        doc.setType(r.type());
        doc.setGroupType(r.groupType());
        doc.setGroupNumber(r.groupNumber());
        return doc;
    }
}
