#!/bin/sh

# Variables for certificate details
ROOT_CN="My Root CA"
SERVER_CN="gateway"

# Create directory for certificates
CERT_DIR="./certs"
mkdir -p "$CERT_DIR"

# Check if rootCA files exist, if not generate them
if [ -f "${CERT_DIR}/rootCA.key" ] && [ -f "${CERT_DIR}/rootCA.pem" ]; then
  echo "✓ Root CA files already exist, skipping generation..."
else
  echo "→ Generating root CA certificate..."
  # Generate a self-signed root certificate
  openssl genrsa -out "${CERT_DIR}/rootCA.key" 2048
  openssl req -x509 -new -nodes -key "${CERT_DIR}/rootCA.key" -sha256 -days 3650 -out "${CERT_DIR}/rootCA.pem" -subj "/CN=${ROOT_CN}"
  echo "✓ Root CA generated"
fi

echo "→ Generating server certificate..."
# Generate a private key for the server certificate
openssl genrsa -out "${CERT_DIR}/server.key" 2048

# Create a configuration file for the server certificate signing request (CSR)
cat <<EOF > ${CERT_DIR}/server.csr.cnf
[ req ]
default_bits       = 2048
prompt             = no
distinguished_name = dn

[ dn ]
CN                  = ${SERVER_CN}

[ v3_req ]
subjectAltName     = @alt_names

[ alt_names ]
DNS.1              = ${SERVER_CN}
DNS.2              = localhost
DNS.3              = gateway

IP.1               = 127.0.0.1


EOF

# Generate the CSR for the server certificate
openssl req -new -key "${CERT_DIR}/server.key" -out "${CERT_DIR}/server.csr" -config ${CERT_DIR}/server.csr.cnf

# Sign the CSR with the root CA to create the server certificate
openssl x509 -req -in "${CERT_DIR}/server.csr" -CA "${CERT_DIR}/rootCA.pem" -CAkey "${CERT_DIR}/rootCA.key" -CAcreateserial -out "${CERT_DIR}/server.crt" -days 365 -sha256 -extfile ${CERT_DIR}/server.csr.cnf -extensions v3_req

# Create a complete certificate chain (server cert + root CA)
cat "${CERT_DIR}/server.crt" "${CERT_DIR}/rootCA.pem" > "${CERT_DIR}/server-chain.crt"

echo ""
echo "✓ Generated TLS certificate chain:"
echo "  - Root CA: ${CERT_DIR}/rootCA.pem"
echo "  - Server Certificate: ${CERT_DIR}/server.crt"
echo "  - Server Certificate Chain (with Root CA): ${CERT_DIR}/server-chain.crt"
echo "  - Server Key: ${CERT_DIR}/server.key"

# You can now use these certificates in Traefik or other TLS servers

# Variables
CERT_DIR="./certs"
KEY_FILE="server.key"
CSR_FILE="server.csr"
CRT_FILE="server.crt"
DAYS_VALID=365
