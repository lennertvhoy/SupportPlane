#!/usr/bin/env bash
set -euo pipefail

echo "=== BL-020 Verification: Ticket Context and Connector Safety Foundation ==="
echo ""

API_BASE="${API_BASE:-http://localhost:4110}"
TENANT_ID="${TENANT_ID:-dev-tenant}"
USER_ID="${USER_ID:-dev-user}"
USER_ROLE="${USER_ROLE:-operator}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

headers=(-H "x-tenant-id: ${TENANT_ID}" -H "x-user-id: ${USER_ID}" -H "x-user-role: ${USER_ROLE}")

echo "1. Health check"
curl -sf "${API_BASE}/health" | jq -r '.status'
echo ""

echo "2. Customers endpoint returns seeded data"
curl -sf "${API_BASE}/customers" "${headers[@]}" | jq '.customers | length'
echo ""

echo "3. Customer by ID (Acme BVBA)"
curl -sf "${API_BASE}/customers/customer-acme-001" "${headers[@]}" | jq -r '.customer.name'
echo ""

echo "4. Connector installations endpoint returns seeded data"
curl -sf "${API_BASE}/connector-installations" "${headers[@]}" | jq '.installations | length'
echo ""

echo "5. Connector installation by ID"
curl -sf "${API_BASE}/connector-installations/conn-inst-dev-001" "${headers[@]}" | jq -r '.installation.name'
echo ""

echo "6. Evidence bundle includes connectorInstallations"
# Use first available session
session_id=$(curl -sf "${API_BASE}/support-sessions" "${headers[@]}" | jq -r '.[0].id')
curl -sf "${API_BASE}/support-sessions/${session_id}/evidence-bundle.json" "${headers[@]}" | jq '.bundle.connectorInstallations | length'
echo ""

echo "7. Evidence bundle includes customerReferences field"
curl -sf "${API_BASE}/support-sessions/${session_id}/evidence-bundle.json" "${headers[@]}" | jq '.bundle | has("customerReferences")'
echo ""

echo "8. Web typecheck"
cd "${REPO_ROOT}/apps/web" && npm run typecheck 2>&1 | tail -1
echo ""

echo "9. API tests"
cd "${REPO_ROOT}/apps/api" && npm test 2>&1 | grep -E '^# (tests|pass|fail)'
echo ""

echo "=== BL-020 Verification Complete ==="
