# Elasticsearch Request Logging

POST requests to `app-spring-partner` are automatically logged to the `request-logs` Elasticsearch index. Each document captures the URI, request body, response status, and duration.

## Observing logs from the devcontainer

The devcontainer shares `docker-default-network` with the stack, so you can reach Elasticsearch directly by service hostname.

### Latest 5 entries (formatted)

```bash
curl -s "http://elasticsearch-spring-partner:9200/request-logs/_search?sort=timestamp:desc&size=5" | python3 -m json.tool
```

### Live tail (refreshes every 2 seconds)

```bash
watch -n 2 'curl -s "http://elasticsearch-spring-partner:9200/request-logs/_search?sort=timestamp:desc&size=10" | python3 -c "
import sys, json
hits = json.load(sys.stdin)[\"hits\"][\"hits\"]
for h in hits:
    s = h[\"_source\"]
    print(s[\"timestamp\"], s[\"method\"], s[\"uri\"], s[\"status\"], str(s[\"durationMs\"])+\"ms\")
"'
```

### Check index exists and document count

```bash
curl -s "http://elasticsearch-spring-partner:9200/request-logs/_count" | python3 -m json.tool
```

### Delete all log entries (reset)

```bash
curl -X DELETE "http://elasticsearch-spring-partner:9200/request-logs"
```

## Notes

- The `request-logs` index is created automatically on the first POST request — it does not exist until then.
- Log entries are written asynchronously so they do not add latency to the request path.
- Request bodies are captured up to 2000 characters and truncated beyond that.
- Rebuild the service after code changes: `make rebuild SERVICE=app-spring-partner`
