#!/usr/bin/env bash
set -euo pipefail

echo "=== BL-020/BL-095 Verification: Ticket Context and Connector Installation Settings Foundation ==="
echo ""

API_BASE="${API_BASE:-http://localhost:4110}"
TENANT_ID="${TENANT_ID:-dev-tenant}"
USER_ID="${USER_ID:-dev-user}"
USER_ROLE="${USER_ROLE:-operator}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COOKIE_JAR=$(mktemp)
COOKIE_JAR_VIEWER=$(mktemp)
COOKIE_JAR_ALT=$(mktemp)
trap 'rm -f "$COOKIE_JAR" "$COOKIE_JAR_VIEWER" "$COOKIE_JAR_ALT"' EXIT

headers=(-H "x-tenant-id: ${TENANT_ID}" -H "x-user-id: ${USER_ID}" -H "x-user-role: ${USER_ROLE}")

echo "0. Local auth login (operator)"
curl -sf -c "$COOKIE_JAR" -X POST "${API_BASE}/auth/local/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@supportplane.local","password":"supportplane-demo","tenantSlug":"dev-tenant"}' >/dev/null
curl -sf -b "$COOKIE_JAR" "${API_BASE}/auth/me" "${headers[@]}" | jq -r '.identity.userEmail'
echo ""

echo "0b. Local auth login (viewer)"
curl -sf -c "$COOKIE_JAR_VIEWER" -X POST "${API_BASE}/auth/local/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@supportplane.local","password":"supportplane-demo","tenantSlug":"dev-tenant"}' >/dev/null
curl -sf -b "$COOKIE_JAR_VIEWER" "${API_BASE}/auth/me" -H "x-tenant-id: dev-tenant" -H "x-user-id: dev-viewer" -H "x-user-role: viewer" | jq -r '.identity.userEmail'
echo ""

echo "0c. Local auth login (alt-tenant admin)"
curl -sf -c "$COOKIE_JAR_ALT" -X POST "${API_BASE}/auth/local/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alt.supportplane.local","password":"supportplane-demo","tenantSlug":"alt-tenant"}' >/dev/null
curl -sf -b "$COOKIE_JAR_ALT" "${API_BASE}/auth/me" -H "x-tenant-id: alt-tenant" -H "x-user-id: alt-admin" -H "x-user-role: admin" | jq -r '.identity.userEmail'
echo ""

echo "1. Health check"
curl -sf "${API_BASE}/health" | jq -r '.status'
echo ""

echo "2. Customers endpoint returns seeded data"
curl -sf -b "$COOKIE_JAR" "${API_BASE}/customers" "${headers[@]}" | jq '.customers | length'
echo ""

echo "3. Customer by ID (Acme BVBA)"
curl -sf -b "$COOKIE_JAR" "${API_BASE}/customers/customer-acme-001" "${headers[@]}" | jq -r '.customer.name'
echo ""

echo "4. Connector installations endpoint returns seeded data"
curl -sf -b "$COOKIE_JAR" "${API_BASE}/connector-installations" "${headers[@]}" | jq '.installations | length'
echo ""

echo "5. Connector installation by ID includes new BL-095 fields"
curl -sf -b "$COOKIE_JAR" "${API_BASE}/connector-installations/conn-inst-dev-001" "${headers[@]}" | jq -r '.installation | "\(.name) mockMode=\(.mockMode) enabled=\(.enabled) capabilities=\(.capabilities | length)"'
echo ""

echo "6. Admin can PATCH connector installation settings"
curl -sf -b "$COOKIE_JAR" -X PATCH "${API_BASE}/connector-installations/conn-inst-dev-001" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Updated Zammad Mock","description":"Updated desc","enabled":true,"timeoutMs":9999,"capabilities":["read_tickets","write_notes"]}' \
  "${headers[@]}" | jq -r '.installation | "\(.displayName) enabled=\(.enabled) timeout=\(.timeoutMs)"'
echo ""

echo "7. Viewer cannot PATCH connector installation"
curl -s -b "$COOKIE_JAR_VIEWER" -X PATCH "${API_BASE}/connector-installations/conn-inst-dev-001" \
  -H "Content-Type: application/json" \
  -d '{"enabled":false}' \
  -H "x-tenant-id: dev-tenant" -H "x-user-id: dev-viewer" -H "x-user-role: viewer" \
  -w "%{http_code}\n" -o /dev/null
echo ""

echo "8. Cross-tenant access denied"
curl -s -b "$COOKIE_JAR_ALT" "${API_BASE}/connector-installations/conn-inst-dev-001" \
  -H "x-tenant-id: alt-tenant" -H "x-user-id: alt-admin" -H "x-user-role: admin" \
  -w "%{http_code}\n" -o /dev/null
echo ""

echo "9. Connector readiness reflects installation settings"
curl -sf -b "$COOKIE_JAR" -X POST "${API_BASE}/connector-installations/conn-inst-dev-001/readiness" \
  -H "Content-Type: application/json" \
  "${headers[@]}" | jq -r '.readyForRealWriteback'
echo ""

echo "10. Evidence bundle includes connectorInstallations"
session_id=$(curl -sf -b "$COOKIE_JAR" "${API_BASE}/support-sessions" "${headers[@]}" | jq -r '.[0].id')
curl -sf -b "$COOKIE_JAR" "${API_BASE}/support-sessions/${session_id}/evidence-bundle.json" "${headers[@]}" | jq '.bundle.connectorInstallations | length'
echo ""

echo "11. Evidence bundle connector installation includes BL-095 fields"
curl -sf -b "$COOKIE_JAR" "${API_BASE}/support-sessions/${session_id}/evidence-bundle.json" "${headers[@]}" | jq '.bundle.connectorInstallations[0] | has("mockMode") and has("enabled") and has("capabilities")'
echo ""

echo "12. Secret redaction in connector installation responses"
# Reset config to a safe value first, then verify redaction
curl -sf -b "$COOKIE_JAR" -X PATCH "${API_BASE}/connector-installations/conn-inst-dev-001" \
  -H "Content-Type: application/json" \
  -d '{"config":{"apiToken":"secret-123","baseUrl":"http://localhost:3000"}}' \
  "${headers[@]}" >/dev/null
curl -sf -b "$COOKIE_JAR" "${API_BASE}/connector-installations/conn-inst-dev-001" "${headers[@]}" | jq -r '.installation.config.apiToken'
echo ""

echo "13. Web typecheck"
cd "${REPO_ROOT}/apps/web" && npm run typecheck 2>&1 | tail -1
echo ""

echo "14. API tests"
cd "${REPO_ROOT}/apps/api" && npm test 2>&1 | grep -E '^# (tests|pass|fail)'
echo ""

echo "=== BL-020/BL-095 Verification Complete ==="
