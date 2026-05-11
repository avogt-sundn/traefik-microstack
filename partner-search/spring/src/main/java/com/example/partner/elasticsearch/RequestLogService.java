package com.example.partner.elasticsearch;

import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class RequestLogService {

    private final ElasticsearchOperations elasticsearchOperations;

    public RequestLogService(ElasticsearchOperations elasticsearchOperations) {
        this.elasticsearchOperations = elasticsearchOperations;
    }

    @Async
    public void log(RequestLogDocument doc) {
        elasticsearchOperations.save(doc);
    }
}
