package com.example.partneredit.sync;

import com.example.partneredit.partner.DetailResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ssl.SslBundle;
import org.springframework.boot.ssl.SslBundles;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import javax.net.ssl.SSLContext;
import java.net.http.HttpClient;

@Component
public class SearchNotifier {

    private static final Logger log = LoggerFactory.getLogger(SearchNotifier.class);

    private final RestClient restClient;
    private final String indexUrl;

    public SearchNotifier(
            SslBundles sslBundles,
            @Value("${partner.search.index.url}") String indexUrl) throws Exception {
        this.indexUrl = indexUrl;

        SslBundle bundle = sslBundles.getBundle("gateway");
        SSLContext sslContext = bundle.createSslContext();

        HttpClient httpClient = HttpClient.newBuilder()
                .sslContext(sslContext)
                .build();

        this.restClient = RestClient.builder()
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .defaultStatusHandler(status -> true, (req, res) -> {})
                .build();
    }

    /**
     * Notifies partner-search to re-index the given partner by pushing the full
     * payload via POST https://gateway/api/partner/spring/index/partner/{partnerNumber}.
     * Best-effort: any failure (exception or non-2xx) is logged at WARN and swallowed.
     * The PUT response is not affected.
     */
    public void notifyReindex(DetailResponse data) {
        String url = indexUrl + "/" + data.partnerNumber();
        try {
            ResponseEntity<Void> response = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(data)
                    .retrieve()
                    .toBodilessEntity();
            if (response.getStatusCode().is2xxSuccessful()) {
                log.debug("Notified partner-search to re-index partner {}", data.partnerNumber());
            } else {
                log.warn("partner-search re-index returned {} for partner {} at {}",
                        response.getStatusCode(), data.partnerNumber(), url);
            }
        } catch (RestClientException e) {
            log.warn("Could not notify partner-search to re-index partner {} at {}: {}",
                    data.partnerNumber(), url, e.getMessage());
        }
    }
}
