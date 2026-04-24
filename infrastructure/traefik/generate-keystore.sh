#!/bin/bash

# Script to generate Java keystore files from PEM certificates

set -e

# Configuration
CERT_DIR="./certs"
KEYSTORE_PASSWORD="${KEYSTORE_PASSWORD:-changeit}"
KEYSTORE_ALIAS="${KEYSTORE_ALIAS:-tomcat}"
KEYSTORE_FORMAT="${KEYSTORE_FORMAT:-PKCS12}"
CERT=server-chain.crt

echo "🔐 Generating Java Keystore from PEM certificates..."
echo ""

# Check if certificate files exist
if [ ! -f "${CERT_DIR}/${CERT}" ]; then
  echo "❌ Error: ${CERT_DIR}/${CERT} not found"
  exit 1
fi

if [ ! -f "${CERT_DIR}/server.key" ]; then
  echo "❌ Error: ${CERT_DIR}/server.key not found"
  exit 1
fi

echo "→ Input files:"
echo "   Certificate: ${CERT_DIR}/server-chain.crt"
echo "   Key: ${CERT_DIR}/server.key"
echo ""

# Generate PKCS12 keystore
echo "→ Generating PKCS12 keystore..."
openssl pkcs12 -export \
  -in "${CERT_DIR}/${CERT}" \
  -inkey "${CERT_DIR}/server.key" \
  -out "${CERT_DIR}/keystore.p12" \
  -name "${KEYSTORE_ALIAS}" \
  -passout "pass:${KEYSTORE_PASSWORD}"

if [ $? -eq 0 ]; then
  echo "✓ PKCS12 keystore created: ${CERT_DIR}/keystore.p12"
else
  echo "❌ Failed to create PKCS12 keystore"
  exit 1
fi




# Generate PKCS12 truststore
echo "→ Generating PKCS12 truststore..."
openssl pkcs12 -export \
  -in "${CERT_DIR}/rootCA.pem" \
  -inkey "${CERT_DIR}/rootCA.key" \
  -out "${CERT_DIR}/truststore.p12" \
  -name "${KEYSTORE_ALIAS}" \
  -passout "pass:${KEYSTORE_PASSWORD}"

if [ $? -eq 0 ]; then
  echo "✓ PKCS12 truststore created: ${CERT_DIR}/truststore.p12"
else
  echo "❌ Failed to create PKCS12 truststore"
  exit 1
fi


echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Keystore generation complete!"
echo ""
echo "Generated files:"
ls -lh "${CERT_DIR}"/keystore.* 2>/dev/null || true
echo ""
echo "Configuration for Spring Boot:"
echo "  server.ssl.key-store=classpath:certs/keystore.p12"
echo "  server.ssl.key-store-password=${KEYSTORE_PASSWORD}"
echo "  server.ssl.key-store-type=PKCS12"
echo "  server.ssl.key-alias=${KEYSTORE_ALIAS}"
echo ""
echo "Keystore password: ${KEYSTORE_PASSWORD}"
