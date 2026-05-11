#!/usr/bin/env sh

# Maven Mirror Setup Script
# This script automates the configuration of a Maven Central mirror in Reposilite
# Usage: ./setup-maven-mirror.sh <reposilite_url> <token>

#set -e

REPOSILITE_URL="${REPOSILITE_URL:-http://maven-mirror:8080}"
TOKEN="${2:-YWRtaW46YWRtaW4xMjM=}"

if [ -z "$TOKEN" ]; then
    echo "Error: Reposilite management token is required"
    echo "Usage: $0 <reposilite_url> <token>"
    echo ""
    echo "Example: $0 http://localhost:8081 my-secret-token"
    exit 1
fi

echo "Setting up Maven Central mirror in Reposilite..."
echo "Reposilite URL: $REPOSILITE_URL"
echo ""

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3

    local CMD="curl -s -X $method \
        -H \"Authorization: Basic $TOKEN\" \
        -H \"Content-Type: application/json\" \
        \"$REPOSILITE_URL$endpoint\" \
        ${data:+-d '$data'}"

    echo "api_call: $CMD" >&2
    eval $CMD
}

# Check if Reposilite is accessible
echo "Checking Reposilite connectivity..."
if ! api_call GET "/api/auth/me" | grep -q "accessToken"; then
    echo "Error: Cannot connect to Reposilite at $REPOSILITE_URL"
    echo "Make sure the service is running and the token is correct"
    exit 1
fi

echo "✓ Connected to Reposilite"
echo ""

# Create releases repository with Maven Central mirror
echo "Creating 'releases' repository with Maven Central mirror..."

# Create the repository
REPO_CONFIG=$(cat some.json)
RESPONSE=$(api_call PUT "/api/settings/domain/maven" "$REPO_CONFIG")

if echo "$RESPONSE" | grep -q '"releases"'; then
    echo "✓ Repository 'releases' created successfully"
else
    echo "Repository already exists or error occurred"
    echo "Response: $RESPONSE"
fi

# Add a forever loop to prevent the entrypoint from terminating
while true; do

    if ! api_call GET "/api/auth/me" | grep -q "accessToken"; then
        echo "x Healthcheck failed. Retrying in 10 seconds.."
    else
        echo "✓ Healthcheck ok"
    fi
    sleep 10
done

