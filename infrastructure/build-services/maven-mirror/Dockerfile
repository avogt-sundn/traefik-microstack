FROM alpine:3.18

USER root
WORKDIR /
# Config außerhalb des Volumes ablegen
COPY setup.sh some.json /

RUN apk add --no-cache curl ca-certificates \
		&& chmod +x /setup.sh

ENTRYPOINT ["/setup.sh"]
