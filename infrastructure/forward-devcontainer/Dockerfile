FROM alpine:3.18

RUN apk add --no-cache socat curl

COPY forward.sh /usr/local/bin/forward.sh
RUN chmod +x /usr/local/bin/forward.sh

ENTRYPOINT ["/usr/local/bin/forward.sh"]
