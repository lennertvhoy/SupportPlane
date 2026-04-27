#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:4110}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

status_of() {
  local path="$1"
  local method="${2:-GET}"
  local data="${3:-}"
  local cookie="${4:-}"
  local output="$TMP_DIR/response.json"
  local args=(-s -o "$output" -w "%{http_code}" -X "$method" "$API_BASE$path" -H "Content-Type: application/json")
  if [[ -n "$cookie" ]]; then
    args+=(-b "$cookie")
  fi
  if [[ -n "$data" ]]; then
    args+=(-d "$data")
  fi
  curl "${args[@]}"
}

expect_status() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL $label: expected HTTP $expected, got $actual"
    cat "$TMP_DIR/response.json"
    exit 1
  fi
  echo "PASS $label: HTTP $actual"
}

login() {
  local label="$1"
  local email="$2"
  local tenant="$3"
  local cookie_file="$4"
  local output="$TMP_DIR/${label}.json"
  local status
  status="$(curl -s -c "$cookie_file" -o "$output" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"supportplane-demo\",\"tenantSlug\":\"$tenant\"}" \
    "$API_BASE/auth/local/login")"
  if [[ "$status" != "201" ]]; then
    echo "FAIL login $label: expected HTTP 201, got $status"
    cat "$output"
    exit 1
  fi
  if grep -E "supportplane-demo|passwordHash|tokenHash|supportplane_session" "$output" >/dev/null; then
    echo "FAIL login $label: secret-like auth material leaked in JSON response"
    cat "$output"
    exit 1
  fi
  echo "PASS login $label: HTTP $status"
}

echo "Checking local auth/RBAC at $API_BASE"

bad_status="$(curl -s -o "$TMP_DIR/bad-login.json" -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@supportplane.local","password":"wrong-password","tenantSlug":"dev-tenant"}' \
  "$API_BASE/auth/local/login")"
expect_status "invalid login rejected" "$bad_status" "401"

OP_COOKIE="$TMP_DIR/operator.cookie"
VIEWER_COOKIE="$TMP_DIR/viewer.cookie"
ALT_COOKIE="$TMP_DIR/alt.cookie"

login "operator" "operator@supportplane.local" "dev-tenant" "$OP_COOKIE"
login "viewer" "viewer@supportplane.local" "dev-tenant" "$VIEWER_COOKIE"
login "alt-admin" "admin@alt.supportplane.local" "alt-tenant" "$ALT_COOKIE"

me_status="$(status_of "/auth/me" GET "" "$OP_COOKIE")"
expect_status "operator auth me" "$me_status" "200"

session_status="$(status_of "/support-sessions" POST '{"title":"BL-018 local auth proof","priority":"high"}' "$OP_COOKIE")"
expect_status "operator can create support session" "$session_status" "201"
SESSION_ID="$(python3 - <<'PY' "$TMP_DIR/response.json"
import json, sys
print(json.load(open(sys.argv[1]))["id"])
PY
)"

viewer_create_status="$(status_of "/support-sessions" POST '{"title":"viewer forbidden proof"}' "$VIEWER_COOKIE")"
expect_status "viewer create denied by RBAC" "$viewer_create_status" "403"

alt_read_status="$(status_of "/support-sessions/$SESSION_ID" GET "" "$ALT_COOKIE")"
expect_status "second tenant cannot read first tenant session" "$alt_read_status" "404"

forged_status="$(curl -s -b "$OP_COOKIE" -o "$TMP_DIR/forged.json" -w "%{http_code}" \
  -H "x-tenant-id: alt-tenant" \
  -H "x-user-id: alt-admin" \
  "$API_BASE/support-sessions/$SESSION_ID")"
if [[ "$forged_status" != "200" ]]; then
  echo "FAIL forged header ignored: expected operator session to remain dev-tenant HTTP 200, got $forged_status"
  cat "$TMP_DIR/forged.json"
  exit 1
fi
if ! grep -q '"tenantId":"dev-tenant"' "$TMP_DIR/forged.json"; then
  echo "FAIL forged header ignored: response did not remain scoped to dev-tenant"
  cat "$TMP_DIR/forged.json"
  exit 1
fi
echo "PASS forged identity headers ignored in local auth mode"

bundle_status="$(status_of "/support-sessions/$SESSION_ID/evidence-bundle.json" GET "" "$OP_COOKIE")"
expect_status "operator evidence bundle" "$bundle_status" "200"
if grep -E "supportplane-demo|passwordHash|tokenHash|supportplane_session" "$TMP_DIR/response.json" >/dev/null; then
  echo "FAIL evidence bundle leaked auth secret material"
  cat "$TMP_DIR/response.json"
  exit 1
fi
echo "PASS evidence bundle auth secret redaction check"

logout_status="$(status_of "/auth/logout" POST '{}' "$OP_COOKIE")"
expect_status "logout succeeds" "$logout_status" "201"

after_logout_status="$(status_of "/auth/me" GET "" "$OP_COOKIE")"
expect_status "session rejected after logout" "$after_logout_status" "401"

echo "Local auth/RBAC verification passed"
