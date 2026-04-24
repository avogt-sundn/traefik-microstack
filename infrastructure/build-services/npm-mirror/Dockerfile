FROM verdaccio/verdaccio:latest
USER root
RUN apk update && apk add curl
COPY config.yaml /verdaccio/conf/config.yaml