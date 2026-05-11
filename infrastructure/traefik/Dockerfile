# Use the official Traefik image as the base image
FROM traefik:v3

# Set the working directory
WORKDIR /etc/traefik
# Copy the config file to the location where Traefik looks for it
COPY traefik_conf.yml /etc/traefik/traefik.yml

# Copy the self-signed certificates
COPY certs/server-chain.crt /etc/traefik/certs/server-chain.crt
COPY certs/server.key /etc/traefik/certs/server.key

# Expose ports
EXPOSE 80
EXPOSE 443
EXPOSE 8080

# Command to run Traefik
CMD ["traefik"]