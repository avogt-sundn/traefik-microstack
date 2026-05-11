# Derived image from traefik/whoami with self-signed certificates
FROM traefik/whoami:latest

# Copy the self-signed certificates into the container
COPY certs/server.crt /certs/server.crt
COPY certs/server.key /certs/server.key

# Expose HTTPS port
EXPOSE 8443
