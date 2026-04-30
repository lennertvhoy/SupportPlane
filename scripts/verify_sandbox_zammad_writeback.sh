#!/usr/bin/env bash
set -euo pipefail

echo "=== BL-111 Sandbox Zammad Internal Note Writeback Verification ==="
echo

API_URL="${SUPPORTPLANE_API_URL:-http://localhost:4210}"
SESSION_ID="${1:-}"
if [ -z "$SESSION_ID" ]; then
  echo "Usage: $0 <support-session-id>"
  echo "Creates an action, submits for review, approves, queues, and processes it."
  exit 1
fi

SERVICE_TOKEN="${SUPPORTPLANE_INTERNAL_SERVICE_TOKEN:-}"
if [ -z "$SERVICE_TOKEN" ]; then
  SERVICE_TOKEN=$(kubectl get secret app-secret-local -n supportplane-app -o jsonpath='{.data.SUPPORTPLANE_INTERNAL_SERVICE_TOKEN}' | base64 -d)
fi

AUTH_HEADER="x-supportplane-service-token: ${SERVICE_TOKEN}"

echo "Session: ${SESSION_ID}"
echo

# 1. Create action
echo "1. Creating support action..."
ACTION_RESP=$(curl -s -X POST "${API_URL}/support-sessions/${SESSION_ID}/actions" -H "content-type: application/json" -H "$AUTH_HEADER" -d '{"actionType":"ticket_note","externalTicketId":"2","body":"Test sandbox internal note writeback.","subject":"Test"}')
echo "$ACTION_RESP" | jq . 2>/dev/null || echo "$ACTION_RESP"
ACTION_ID=$(echo "$ACTION_RESP" | jq -r '.action.id' 2>/dev/null || echo "")
if [ -z "$ACTION_ID" ] || [ "$ACTION_ID" = "null" ]; then
  echo "Failed to create action"
  exit 1
fi

echo

# 2. Submit for review
echo "2. Submitting for review..."
curl -s -X POST "${API_URL}/actions/${ACTION_ID}/submit-for-review" -H "content-type: application/json" -H "$AUTH_HEADER" | jq . 2>/dev/null || true
echo

# 3. Approve
echo "3. Approving action..."
curl -s -X POST "${API_URL}/actions/${ACTION_ID}/approve" -H "content-type: application/json" -H "$AUTH_HEADER" -d '{"reason":"Approved for sandbox writeback test"}' | jq . 2>/dev/null || true
echo

# 4. Queue
echo "4. Queuing action..."
QUEUE_RESP=$(curl -s -X POST "${API_URL}/actions/${ACTION_ID}/queue" -H "content-type: application/json" -H "$AUTH_HEADER")
echo "$QUEUE_RESP" | jq . 2>/dev/null || echo "$QUEUE_RESP"
OUTBOX_ID=$(echo "$QUEUE_RESP" | jq -r '.outboxItem.id' 2>/dev/null || echo "")

echo

# 5. Process outbox item
echo "5. Processing outbox item..."
if [ -n "$OUTBOX_ID" ] && [ "$OUTBOX_ID" != "null" ]; then
  PROCESS_RESP=$(curl -s -X POST "${API_URL}/outbox/process-once" -H "content-type: application/json" -H "$AUTH_HEADER" -d "{\"outboxItemId\":\"${OUTBOX_ID}\",\"workerId\":\"verify-script\"}")
  echo "$PROCESS_RESP" | jq . 2>/dev/null || echo "$PROCESS_RESP"
else
  echo "No outbox item ID found; attempting general process-once..."
  PROCESS_RESP=$(curl -s -X POST "${API_URL}/outbox/process-once" -H "content-type: application/json" -H "$AUTH_HEADER" -d '{"workerId":"verify-script"}')
  echo "$PROCESS_RESP" | jq . 2>/dev/null || echo "$PROCESS_RESP"
fi

echo

# 6. Check Zammad ticket
echo "6. Checking Zammad ticket 2 articles..."
ZAMMAD_TOKEN="${ZAMMAD_API_TOKEN:-TestToken}"
curl -s "http://localhost:8080/api/v1/tickets/2?expand=true" -H "Authorization: Bearer ${ZAMMAD_TOKEN}" | jq '.articles | length' 2>/dev/null || echo "Could not query Zammad"

echo
echo "=== Verification complete ==="
