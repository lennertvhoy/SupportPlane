#!/bin/bash
set -euo pipefail

echo "=== SupportPlane PostgreSQL Persistence Verification ==="
echo ""

# Check postgres is running
if ! nc -z localhost 5434 2>/dev/null; then
  echo "Starting PostgreSQL container..."
  podman compose -f infra/docker-compose/compose.yaml up -d postgres
  sleep 3
fi

# Run migrations
echo "Running Prisma migrations..."
npx prisma migrate dev --name persistence_check 2>/dev/null || npx prisma migrate deploy 2>/dev/null || true
npx prisma generate

# Seed dev tenant
echo "Seeding dev tenant..."
podman exec sp-postgres psql -U supportplane -d supportplane -c "INSERT INTO tenants (id, name, slug, status, settings, \"createdAt\", \"updatedAt\") VALUES ('dev-tenant', 'Dev Tenant', 'dev-tenant', 'active', '{}', NOW(), NOW()) ON CONFLICT DO NOTHING;"
podman exec sp-postgres psql -U supportplane -d supportplane -c "INSERT INTO users (id, \"tenantId\", email, name, status, \"createdAt\", \"updatedAt\") VALUES ('dev-user', 'dev-tenant', 'dev@example.com', 'Dev User', 'active', NOW(), NOW()) ON CONFLICT DO NOTHING;"

# Determine API port — use 4110 if free, otherwise find an available port
API_PORT=4110
if ss -tln | grep -q ":4110 "; then
  API_PORT=4111
  while ss -tln | grep -q ":${API_PORT} "; do
    API_PORT=$((API_PORT + 1))
  done
  echo "Port 4110 is occupied; using alternative port ${API_PORT} for persistence test"
fi

# Build API
echo "Building API..."
cd apps/api && npm run build > /dev/null 2>&1

echo ""
echo "=== Phase 1: Create data in PostgreSQL mode ==="

# Start API in background with postgres store
export SUPPORTPLANE_STORE=postgres
export DATABASE_URL="postgresql://supportplane:supportplane_dev@localhost:5434/supportplane?schema=public"
export API_PORT=${API_PORT}
node dist/src/main.js &
API_PID=$!
sleep 3

# Create a support session
SESSION_RESPONSE=$(curl -s -X POST http://localhost:${API_PORT}/support-sessions \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: dev-tenant" \
  -H "x-user-id: dev-user" \
  -H "x-user-role: admin" \
  -d '{"title": "Persistence Test Session", "priority": "high"}')
SESSION_ID=$(echo "$SESSION_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Created session: $SESSION_ID"

# Create a fake incoming call
CALL_RESPONSE=$(curl -s -X POST http://localhost:${API_PORT}/calls/fake-incoming \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: dev-tenant" \
  -H "x-user-id: dev-user" \
  -H "x-user-role: admin" \
  -d '{"externalCallId": "PERSIST-001", "rawCallerNumber": "03 555 01 01"}')
CALL_ID=$(echo "$CALL_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['callEvent']['id'])")
echo "Created call: $CALL_ID"

# Stop API
echo "Stopping API..."
kill $API_PID || true
wait $API_PID 2>/dev/null || true
sleep 2

echo ""
echo "=== Phase 2: Restart API and verify data survives ==="

# Restart API
export SUPPORTPLANE_STORE=postgres
export DATABASE_URL="postgresql://supportplane:supportplane_dev@localhost:5434/supportplane?schema=public"
export API_PORT=${API_PORT}
node dist/src/main.js &
API_PID=$!
sleep 3

# Verify session still exists
SESSION_CHECK=$(curl -s http://localhost:${API_PORT}/support-sessions/$SESSION_ID \
  -H "x-tenant-id: dev-tenant" \
  -H "x-user-id: dev-user" \
  -H "x-user-role: admin")
CHECK_ID=$(echo "$SESSION_CHECK" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','NOT_FOUND'))")

if [ "$CHECK_ID" = "$SESSION_ID" ]; then
  echo "PASS: Session survived restart"
else
  echo "FAIL: Session did not survive restart"
  kill $API_PID || true
  exit 1
fi

# Verify call still exists
CALL_CHECK=$(curl -s http://localhost:${API_PORT}/calls/$CALL_ID \
  -H "x-tenant-id: dev-tenant" \
  -H "x-user-id: dev-user" \
  -H "x-user-role: admin")
CALL_CHECK_ID=$(echo "$CALL_CHECK" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','NOT_FOUND'))")

if [ "$CALL_CHECK_ID" = "$CALL_ID" ]; then
  echo "PASS: Call event survived restart"
else
  echo "FAIL: Call event did not survive restart"
  kill $API_PID || true
  exit 1
fi

# Verify evidence bundle can be built from persisted state
BUNDLE_CHECK=$(curl -s http://localhost:${API_PORT}/support-sessions/$SESSION_ID/evidence-bundle \
  -H "x-tenant-id: dev-tenant" \
  -H "x-user-id: dev-user" \
  -H "x-user-role: admin")
STORE_TYPE=$(echo "$BUNDLE_CHECK" | python3 -c "import sys,json; print(json.load(sys.stdin)['bundle']['sourceProvenance']['storeType'])")

if [ "$STORE_TYPE" = "postgres" ]; then
  echo "PASS: Evidence bundle reports postgres store type"
else
  echo "FAIL: Evidence bundle store type is $STORE_TYPE, expected postgres"
  kill $API_PID || true
  exit 1
fi

# Cleanup
kill $API_PID || true
wait $API_PID 2>/dev/null || true

echo ""
echo "=== All persistence verification checks passed ==="
