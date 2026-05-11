package com.example.partner.filter;

import com.example.partner.elasticsearch.RequestLogDocument;
import com.example.partner.elasticsearch.RequestLogService;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Component
@Order(1)
public class PostRequestLoggingFilter implements Filter {

    private static final int MAX_BODY_LENGTH = 2000;

    private final RequestLogService requestLogService;

    public PostRequestLoggingFilter(RequestLogService requestLogService) {
        this.requestLogService = requestLogService;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (!(request instanceof HttpServletRequest httpRequest)
                || !"POST".equalsIgnoreCase(((HttpServletRequest) request).getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(httpRequest, MAX_BODY_LENGTH);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper((HttpServletResponse) response);

        long start = System.currentTimeMillis();
        try {
            chain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            long duration = System.currentTimeMillis() - start;

            String body = new String(wrappedRequest.getContentAsByteArray(), StandardCharsets.UTF_8);
            if (body.length() > MAX_BODY_LENGTH) {
                body = body.substring(0, MAX_BODY_LENGTH) + "...[truncated]";
            }

            RequestLogDocument doc = new RequestLogDocument();
            doc.setId(UUID.randomUUID().toString());
            doc.setTimestamp(Instant.now());
            doc.setMethod(httpRequest.getMethod());
            doc.setUri(httpRequest.getRequestURI());
            doc.setBody(body);
            doc.setStatus(wrappedResponse.getStatus());
            doc.setDurationMs(duration);

            requestLogService.log(doc);
            wrappedResponse.copyBodyToResponse();
        }
    }
}
