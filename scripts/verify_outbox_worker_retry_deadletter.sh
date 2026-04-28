#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4110}"
WEB_URL="${WEB_URL:-http://localhost:3200}"
COOKIE_OPERATOR=$(mktemp)
COOKIE_ADMIN=$(mktemp)
COOKIE_VIEWER=$(mktemp)
COOKIE_ALT=$(mktemp)
TMP_BODY=$(mktemp)
trap 'rm -f "$COOKIE_OPERATOR" "$COOKIE_ADMIN" "$COOKIE_VIEWER" "$COOKIE_ALT" "$TMP_BODY"' EXIT

echo "=== Outbox Worker Retry/Dead-Letter Verification ==="
echo "API: $API_URL"
echo "Web: $WEB_URL"

assert_http() {
  local expected="$1"
  local code="$2"
  local label="$3"
  if [ "$code" != "$expected" ]; then
    echo "FAIL: $label expected HTTP $expected, got $code"
    cat "$TMP_BODY" || true
    exit 1
  fi
}

login() {
  local cookie="$1"
  local email="$2"
  local tenant="$3"
  curl -fsS -c "$cookie" -X POST "$API_URL/auth/local/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"supportplane-demo\",\"tenantSlug\":\"$tenant\"}" >/dev/null
}

create_action() {
  local scenario="$1"
  local key="$2"
  curl -fsS -b "$COOKIE_OPERATOR" -X POST "$API_URL/support-sessions/$SESSION_ID/actions" -H "Content-Type: application/json" \
    -d "{\"actionType\":\"ticket_note\",\"externalTicketId\":\"TICKET-101\",\"body\":\"BL-093 worker note with apiToken=super-secret-token and password=secret-value\",\"idempotencyKey\":\"$key\",\"mockDeliveryScenario\":\"$scenario\"}"
}

approve_and_queue() {
  local action_id="$1"
  curl -fsS -b "$COOKIE_OPERATOR" -X POST "$API_URL/actions/$action_id/submit-for-review" | jq -e '.action.status == "review_required"' >/dev/null
  curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL/actions/$action_id/approve" -H "Content-Type: application/json" \
    -d '{"reason":"Approved for local mock worker processing"}' | jq -e '.action.status == "approved"' >/dev/null
  curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL/actions/$action_id/queue"
}

echo "1. API health"
curl -fsS "$API_URL/health" | jq -e '.status == "ok"' >/dev/null
echo "PASS"

echo "2. Login local-auth identities"
login "$COOKIE_OPERATOR" "operator@supportplane.local" "dev-tenant"
login "$COOKIE_ADMIN" "admin@supportplane.local" "dev-tenant"
login "$COOKIE_VIEWER" "viewer@supportplane.local" "dev-tenant"
login "$COOKIE_ALT" "operator@alt.supportplane.local" "alt-tenant"
echo "PASS"

echo "3. Create support session"
SESSION=$(curl -fsS -b "$COOKIE_OPERATOR" -X POST "$API_URL/support-sessions" -H "Content-Type: application/json" \
  -d '{"title":"BL-093 Outbox Worker Retry Deadletter Verify","priority":"high"}')
SESSION_ID=$(echo "$SESSION" | jq -r '.id')
test -n "$SESSION_ID"
echo "PASS ($SESSION_ID)"

echo "4. Worker status is authenticated and mock/local"
STATUS=$(curl -fsS -b "$COOKIE_VIEWER" "$API_URL/outbox/worker/status")
echo "$STATUS" | jq -e '.queueBackend == "postgres-local-outbox" and .deliveryMode == "mock" and .realNetwork == false and .writebackEnabled == false and .externalWriteAttempted == false' >/dev/null
echo "PASS"

echo "5. Queue success action before worker"
SUCCESS_ACTION=$(create_action "success" "bl-093-success-$SESSION_ID")
SUCCESS_ACTION_ID=$(echo "$SUCCESS_ACTION" | jq -r '.action.id')
SUCCESS_QUEUE=$(approve_and_queue "$SUCCESS_ACTION_ID")
SUCCESS_OUTBOX_ID=$(echo "$SUCCESS_QUEUE" | jq -r '.outboxItem.id')
echo "$SUCCESS_QUEUE" | jq -e '.outboxItem.status == "queued" and .outboxItem.attemptCount == 0 and .outboxItem.deliveryMode == "mock"' >/dev/null
echo "PASS ($SUCCESS_OUTBOX_ID)"

echo "6. Process-once succeeds with one mock attempt"
SUCCESS_PROCESS=$(curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL/outbox/process-once" -H "Content-Type: application/json" \
  -d "{\"outboxItemId\":\"$SUCCESS_OUTBOX_ID\",\"workerId\":\"verify-worker-success\"}")
echo "$SUCCESS_PROCESS" | jq -e '.processed == true and .outboxItem.status == "mock_delivered" and .outboxItem.attemptCount == 1 and .delivery.realNetwork == false and .delivery.writebackEnabled == false and .delivery.externalWriteAttempted == false' >/dev/null
curl -fsS -b "$COOKIE_VIEWER" "$API_URL/outbox/$SUCCESS_OUTBOX_ID" | jq -e '(.attempts | length == 1) and .attempts[0].state == "mock_delivered"' >/dev/null
echo "PASS"

echo "7. Queue retryable failure action"
RETRY_ACTION=$(create_action "retryable_failure_once" "bl-093-retry-$SESSION_ID")
RETRY_ACTION_ID=$(echo "$RETRY_ACTION" | jq -r '.action.id')
RETRY_QUEUE=$(approve_and_queue "$RETRY_ACTION_ID")
RETRY_OUTBOX_ID=$(echo "$RETRY_QUEUE" | jq -r '.outboxItem.id')
echo "PASS ($RETRY_OUTBOX_ID)"

echo "8. First worker attempt schedules retry with redacted error"
RETRY_FAIL=$(curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL/outbox/process-once" -H "Content-Type: application/json" \
  -d "{\"outboxItemId\":\"$RETRY_OUTBOX_ID\",\"workerId\":\"verify-worker-retry\"}")
echo "$RETRY_FAIL" | jq -e '.processed == true and .outboxItem.status == "retry_scheduled" and .outboxItem.attemptCount == 1 and (.outboxItem.nextAttemptAt | type == "string") and .attempt.errorRedacted == true' >/dev/null
if echo "$RETRY_FAIL" | grep -E 'super-secret-token|password=secret-value|Bearer ' >/dev/null; then
  echo "FAIL: retry failure leaked secret-like values"
  exit 1
fi
echo "PASS"

echo "9. Admin retry returns item to queued"
RETRY_REQUEST=$(curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL/outbox/$RETRY_OUTBOX_ID/retry")
echo "$RETRY_REQUEST" | jq -e '.outboxItem.status == "queued" and .outboxItem.latestAttemptState == "retry_requested"' >/dev/null
echo "PASS"

echo "10. Second worker attempt succeeds"
RETRY_SUCCESS=$(curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL/outbox/process-once" -H "Content-Type: application/json" \
  -d "{\"outboxItemId\":\"$RETRY_OUTBOX_ID\",\"workerId\":\"verify-worker-retry\"}")
echo "$RETRY_SUCCESS" | jq -e '.processed == true and .outboxItem.status == "mock_delivered" and .outboxItem.attemptCount == 2' >/dev/null
curl -fsS -b "$COOKIE_VIEWER" "$API_URL/outbox/$RETRY_OUTBOX_ID" | jq -e '(.attempts | length == 2) and .attempts[0].state == "failed" and .attempts[1].state == "mock_delivered"' >/dev/null
echo "PASS"

echo "11. Dead-letter path via non-retryable validation failure"
DEAD_ACTION=$(create_action "validation_failure" "bl-093-dead-$SESSION_ID")
DEAD_ACTION_ID=$(echo "$DEAD_ACTION" | jq -r '.action.id')
DEAD_QUEUE=$(approve_and_queue "$DEAD_ACTION_ID")
DEAD_OUTBOX_ID=$(echo "$DEAD_QUEUE" | jq -r '.outboxItem.id')
DEAD_PROCESS=$(curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL/outbox/process-once" -H "Content-Type: application/json" \
  -d "{\"outboxItemId\":\"$DEAD_OUTBOX_ID\",\"workerId\":\"verify-worker-dead\"}")
echo "$DEAD_PROCESS" | jq -e '.processed == true and .outboxItem.status == "dead_lettered" and (.outboxItem.deadLetterReason | type == "string")' >/dev/null
echo "PASS"

echo "12. Admin can retry dead-letter item"
DEAD_RETRY=$(curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL/outbox/$DEAD_OUTBOX_ID/retry")
echo "$DEAD_RETRY" | jq -e '.outboxItem.status == "queued"' >/dev/null
echo "PASS"

echo "13. Admin cancel control"
CANCEL_ACTION=$(create_action "connector_unavailable" "bl-093-cancel-$SESSION_ID")
CANCEL_ACTION_ID=$(echo "$CANCEL_ACTION" | jq -r '.action.id')
CANCEL_QUEUE=$(approve_and_queue "$CANCEL_ACTION_ID")
CANCEL_OUTBOX_ID=$(echo "$CANCEL_QUEUE" | jq -r '.outboxItem.id')
CANCEL_RES=$(curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL/outbox/$CANCEL_OUTBOX_ID/cancel" -H "Content-Type: application/json" \
  -d '{"reason":"Cancel local mock test"}')
echo "$CANCEL_RES" | jq -e '.outboxItem.status == "cancelled" and .action.status == "cancelled"' >/dev/null
echo "PASS"

echo "14. Viewer mutation and forged header denied"
VIEWER_CODE=$(curl -s -o "$TMP_BODY" -w "%{http_code}" -b "$COOKIE_VIEWER" -H "x-user-role: admin" -X POST "$API_URL/outbox/$RETRY_OUTBOX_ID/retry" || true)
assert_http "403" "$VIEWER_CODE" "viewer retry forbidden"
echo "PASS (403)"

echo "15. Cross-tenant outbox access denied"
ALT_CODE=$(curl -s -o "$TMP_BODY" -w "%{http_code}" -b "$COOKIE_ALT" "$API_URL/outbox/$RETRY_OUTBOX_ID" || true)
assert_http "404" "$ALT_CODE" "cross-tenant outbox read"
echo "PASS (404)"

echo "16. Audit, timeline, and evidence include worker lifecycle"
curl -fsS -b "$COOKIE_VIEWER" "$API_URL/support-sessions/$SESSION_ID/audit-events" | jq -e '[.[].eventType] | index("outbox_processing_started") and index("outbox_processing_succeeded") and index("outbox_retry_scheduled") and index("outbox_dead_lettered") and index("outbox_cancelled")' >/dev/null
curl -fsS -b "$COOKIE_VIEWER" "$API_URL/support-sessions/$SESSION_ID/case-timeline" | jq -e '.timeline[] | select(.type == "action_outbox_item" and (.metadata.deadLetteredAt or .metadata.nextAttemptAt or .metadata.latestAttemptState == "mock_delivered"))' >/dev/null
EVIDENCE=$(curl -fsS -b "$COOKIE_VIEWER" "$API_URL/support-sessions/$SESSION_ID/evidence-bundle.json")
echo "$EVIDENCE" | jq -e '.bundle.actionOutbox[] | select(.attempts | length > 0) | .realNetwork == false and .externalWriteAttempted == false and .writebackEnabled == false' >/dev/null
if echo "$EVIDENCE" | grep -E 'super-secret-token|password=secret-value|Bearer |session_token|passwordHash' >/dev/null; then
  echo "FAIL: evidence bundle leaked secret-like values"
  exit 1
fi
echo "PASS"

echo "17. Web root reachable"
WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL/" || true)
assert_http "200" "$WEB_CODE" "web root"
echo "PASS (200)"

echo "=== Outbox worker retry/dead-letter verification passed ==="
