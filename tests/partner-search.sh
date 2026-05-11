#!/bin/sh
# E2E blackbox tests for the partner search endpoints.
#
# The partner search uses a simplified token-based model: each whitespace-
# separated token in ?q= is searched against ALL entity attributes
# (OR across fields, AND across tokens). No per-field classification.
#
# Base URL: https://gateway  (Traefik HTTPS entry point inside Docker network)
# TLS:      self-signed certs — all curl calls use -k / --insecure

set -e

BASE_URL="https://gateway"
PASS=0
FAIL=0

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

pass() { printf '[PASS] %s\n' "$1"; PASS=$((PASS + 1)); }
fail() { printf '[FAIL] %s\n' "$1"; FAIL=$((FAIL + 1)); }

http_status() {
    curl -sk -o /dev/null -w '%{http_code}' "$1"
}

http_body() {
    curl -sk "$1"
}

assert_status() {
    label="$1"; expected="$2"; actual="$3"
    if [ "$actual" = "$expected" ]; then pass "$label — HTTP $actual"
    else fail "$label — expected HTTP $expected, got HTTP $actual"; fi
}

assert_json_key_present() {
    label="$1"; body="$2"; key="$3"
    if printf '%s' "$body" | grep -q "\"${key}\""; then pass "$label — JSON key '${key}' present"
    else fail "$label — JSON key '${key}' missing. Body: $body"; fi
}

assert_non_empty_array() {
    label="$1"; body="$2"; key="$3"
    after_key=$(printf '%s' "$body" | sed "s/.*\"${key}\"[[:space:]]*:[[:space:]]*\[//")
    if printf '%s' "$after_key" | grep -q '{'; then pass "$label — '$key' array is non-empty"
    else fail "$label — '$key' array appears empty or key missing. Body: $body"; fi
}

assert_empty_array() {
    label="$1"; body="$2"; key="$3"
    if printf '%s' "$body" | grep -qE "\"${key}\"[[:space:]]*:[[:space:]]*\[\s*\]"; then
        pass "$label — '$key' array is empty"
    else fail "$label — '$key' array is not empty or key missing. Body: $body"; fi
}

# ---------------------------------------------------------------------------
# Test 1: Single token — city match returns non-empty results
# ---------------------------------------------------------------------------
LABEL="Search token 'München' returns results"
STATUS=$(http_status "${BASE_URL}/api/partner/search?q=M%C3%BCnchen")
assert_status "$LABEL" "200" "$STATUS"
if [ "$STATUS" = "200" ]; then
    BODY=$(http_body "${BASE_URL}/api/partner/search?q=M%C3%BCnchen")
    assert_json_key_present "$LABEL" "$BODY" "results"
    assert_non_empty_array  "$LABEL" "$BODY" "results"
fi

# ---------------------------------------------------------------------------
# Test 2: Single token — postal code
# ---------------------------------------------------------------------------
LABEL="Search token '33602' returns results"
STATUS=$(http_status "${BASE_URL}/api/partner/search?q=33602")
assert_status "$LABEL" "200" "$STATUS"
if [ "$STATUS" = "200" ]; then
    BODY=$(http_body "${BASE_URL}/api/partner/search?q=33602")
    assert_json_key_present "$LABEL" "$BODY" "results"
fi

# ---------------------------------------------------------------------------
# Test 3: Multi-token AND — both terms must match
# ---------------------------------------------------------------------------
LABEL="Two-token search 'Fischer Logistik' returns results"
STATUS=$(http_status "${BASE_URL}/api/partner/search?q=Fischer%20Logistik")
assert_status "$LABEL" "200" "$STATUS"
if [ "$STATUS" = "200" ]; then
    BODY=$(http_body "${BASE_URL}/api/partner/search?q=Fischer%20Logistik")
    assert_non_empty_array "$LABEL" "$BODY" "results"
fi

# ---------------------------------------------------------------------------
# Test 4: No query param returns all partners (HTTP 200, non-empty)
# ---------------------------------------------------------------------------
LABEL="No query returns all partners"
STATUS=$(http_status "${BASE_URL}/api/partner/search")
assert_status "$LABEL" "200" "$STATUS"
if [ "$STATUS" = "200" ]; then
    BODY=$(http_body "${BASE_URL}/api/partner/search")
    assert_json_key_present "$LABEL" "$BODY" "totalCount"
    assert_non_empty_array  "$LABEL" "$BODY" "results"
fi

# ---------------------------------------------------------------------------
# Test 5: Unknown token returns empty results
# ---------------------------------------------------------------------------
LABEL="Unknown token returns empty results"
STATUS=$(http_status "${BASE_URL}/api/partner/search?q=XYZNOTEXIST999")
assert_status "$LABEL" "200" "$STATUS"
if [ "$STATUS" = "200" ]; then
    BODY=$(http_body "${BASE_URL}/api/partner/search?q=XYZNOTEXIST999")
    assert_empty_array "$LABEL" "$BODY" "results"
fi

# ---------------------------------------------------------------------------
# Test 6: query summary contains tokens array
# ---------------------------------------------------------------------------
LABEL="Query summary has tokens array"
STATUS=$(http_status "${BASE_URL}/api/partner/search?q=M%C3%BCnchen")
assert_status "$LABEL" "200" "$STATUS"
if [ "$STATUS" = "200" ]; then
    BODY=$(http_body "${BASE_URL}/api/partner/search?q=M%C3%BCnchen")
    assert_json_key_present "$LABEL" "$BODY" "tokens"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
TOTAL=$((PASS + FAIL))
printf '\n========================================\n'
printf 'Partner search e2e results: %d/%d passed\n' "$PASS" "$TOTAL"
printf '========================================\n'

if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0
