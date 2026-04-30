#!/usr/bin/env bash
set -euo pipefail

echo "=== BL-122 Worker Service Auth Verification ==="
echo

API_URL="${SUPPORTPLANE_API_URL:-http://localhost:4210}"

echo "1. Worker pod status:"
kubectl get pods -n supportplane-app -l app.kubernetes.io/name=supportplane-worker

echo
echo "2. POST /outbox/process-once WITHOUT token:"
curl -s -X POST "${API_URL}/outbox/process-once" -H "content-type: application/json" -d '{"workerId":"test"}' | jq . 2>/dev/null || curl -s -X POST "${API_URL}/outbox/process-once" -H "content-type: application/json" -d '{"workerId":"test"}'

echo
echo "3. POST /outbox/process-once WITH invalid token:"
curl -s -X POST "${API_URL}/outbox/process-once" -H "content-type: application/json" -H "x-supportplane-service-token: invalid-token" -d '{"workerId":"test"}' | jq . 2>/dev/null || curl -s -X POST "${API_URL}/outbox/process-once" -H "content-type: application/json" -H "x-supportplane-service-token: invalid-token" -d '{"workerId":"test"}'

echo
echo "4. POST /outbox/process-once WITH valid service token:"
SERVICE_TOKEN="${SUPPORTPLANE_INTERNAL_SERVICE_TOKEN:-}"
if [ -z "$SERVICE_TOKEN" ]; then
  SERVICE_TOKEN=$(kubectl get secret app-secret-local -n supportplane-app -o jsonpath='{.data.SUPPORTPLANE_INTERNAL_SERVICE_TOKEN}' | base64 -d)
fi
curl -s -X POST "${API_URL}/outbox/process-once" -H "content-type: application/json" -H "x-supportplane-service-token: ${SERVICE_TOKEN}" -d '{"workerId":"test"}' | jq . 2>/dev/null || curl -s -X POST "${API_URL}/outbox/process-once" -H "content-type: application/json" -H "x-supportplane-service-token: ${SERVICE_TOKEN}" -d '{"workerId":"test"}'

echo
echo "5. Worker status endpoint:"
curl -s "${API_URL}/outbox/worker/status" -H "x-supportplane-service-token: ${SERVICE_TOKEN}" | jq . 2>/dev/null || curl -s "${API_URL}/outbox/worker/status" -H "x-supportplane-service-token: ${SERVICE_TOKEN}"

echo
echo "=== Verification complete ==="
