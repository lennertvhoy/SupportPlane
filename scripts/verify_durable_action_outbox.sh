#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4110}"
WEB_URL="${WEB_URL:-http://localhost:3200}"
COOKIE_OPERATOR=$(mktemp)
COOKIE_ADMIN=$(mktemp)
COOKIE_VIEWER=$(mktemp)
COOKIE_ALT=$(mktemp)
trap 'rm -f "$COOKIE_OPERATOR" "$COOKIE_ADMIN" "$COOKIE_VIEWER" "$COOKIE_ALT"' EXIT

echo "=== Durable Action/Outbox Verification ==="
echo "API: $API_URL"
echo "Web: $WEB_URL"

echo "1. API health"
curl -fsS "$API_URL/health" | jq -e '.status == "ok"' >/dev/null
echo "PASS"

echo "2. Local auth login for operator/admin/viewer/alt"
curl -fsS -c "$COOKIE_OPERATOR" -X POST "$API_URL/auth/local/login" -H "Content-Type: application/json" \
  -d '{"email":"operator@supportplane.local","password":"supportplane-demo","tenantSlug":"dev-tenant"}' >/dev/null
curl -fsS -c "$COOKIE_ADMIN" -X POST "$API_URL/auth/local/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@supportplane.local","password":"supportplane-demo","tenantSlug":"dev-tenant"}' >/dev/null
curl -fsS -c "$COOKIE_VIEWER" -X POST "$API_URL/auth/local/login" -H "Content-Type: application/json" \
  -d '{"email":"viewer@supportplane.local","password":"supportplane-demo","tenantSlug":"dev-tenant"}' >/dev/null
curl -fsS -c "$COOKIE_ALT" -X POST "$API_URL/auth/local/login" -H "Content-Type: application/json" \
  -d '{"email":"operator@alt.supportplane.local","password":"supportplane-demo","tenantSlug":"alt-tenant"}' >/dev/null
echo "PASS"

echo "3. Create support session"
SESSION=$(curl -fsS -b "$COOKIE_OPERATOR" -X POST "$API_URL/support-sessions" -H "Content-Type: application/json" \
  -d '{"title":"BL-092 Durable Action Outbox Verify","priority":"high"}')
SESSION_ID=$(echo "$SESSION" | jq -r '.id')
test -n "$SESSION_ID"
echo "PASS ($SESSION_ID)"

echo "4. Create support action"
ACTION_RES=$(curl -fsS -b "$COOKIE_OPERATOR" -X POST "$API_URL/support-sessions/$SESSION_ID/actions" -H "Content-Type: application/json" \
  -d "{\"actionType\":\"ticket_note\",\"externalTicketId\":\"TICKET-101\",\"body\":\"Mock local note with apiToken=super-secret-token and password=secret-value\",\"idempotencyKey\":\"bl-092-script-action-$SESSION_ID\"}")
ACTION_ID=$(echo "$ACTION_RES" | jq -r '.action.id')
echo "$ACTION_RES" | jq -e '.action.status == "draft"' >/dev/null
echo "$ACTION_RES" | jq -e '.action.safeBodyPreview | contains("[REDACTED]")' >/dev/null
echo "PASS ($ACTION_ID)"

echo "5. Submit for review"
curl -fsS -b "$COOKIE_OPERATOR" -X POST "$API_URL/actions/$ACTION_ID/submit-for-review" | jq -e '.action.status == "review_required"' >/dev/null
echo "PASS"

echo "6. Viewer forged-header approval remains forbidden in local auth"
FORGED_CODE=$(curl -s -o /tmp/bl092-forged-response.json -w "%{http_code}" -b "$COOKIE_VIEWER" -H "x-user-role: admin" -X POST "$API_URL/actions/$ACTION_ID/approve" || true)
if [ "$FORGED_CODE" != "403" ]; then
  echo "FAIL: expected 403, got $FORGED_CODE"
  cat /tmp/bl092-forged-response.json
  exit 1
fi
echo "PASS (403)"

echo "7. Admin approves"
curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL/actions/$ACTION_ID/approve" -H "Content-Type: application/json" \
  -d '{"reason":"Approved for local mock delivery"}' | jq -e '.action.status == "approved"' >/dev/null
echo "PASS"

echo "8. Queue approved action"
QUEUE_RES=$(curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL/actions/$ACTION_ID/queue")
OUTBOX_ID=$(echo "$QUEUE_RES" | jq -r '.outboxItem.id')
echo "$QUEUE_RES" | jq -e '.outboxItem.status == "queued"' >/dev/null
echo "$QUEUE_RES" | jq -e '.outboxItem.deliveryIntent.realNetwork == false and .outboxItem.deliveryIntent.writebackEnabled == false and .outboxItem.deliveryIntent.externalWriteAttempted == false' >/dev/null
echo "PASS ($OUTBOX_ID)"

echo "9. Mock deliver"
DELIVERY=$(curl -fsS -b "$COOKIE_OPERATOR" -X POST "$API_URL/outbox/$OUTBOX_ID/mock-deliver")
echo "$DELIVERY" | jq -e '.outboxItem.status == "mock_delivered"' >/dev/null
echo "$DELIVERY" | jq -e '.delivery.realNetwork == false and .delivery.writebackEnabled == false and .delivery.externalWriteAttempted == false and .delivery.deliveryClaim == "mock_delivered"' >/dev/null
echo "PASS"

echo "10. Outbox attempt history"
curl -fsS -b "$COOKIE_VIEWER" "$API_URL/outbox/$OUTBOX_ID" | jq -e '.attempts | length == 1' >/dev/null
echo "PASS"

echo "11. Audit and timeline include action/outbox events"
curl -fsS -b "$COOKIE_VIEWER" "$API_URL/support-sessions/$SESSION_ID/audit-events" | jq -e '[.[].eventType] | index("action_mock_delivered") and index("outbox_item_attempted")' >/dev/null
curl -fsS -b "$COOKIE_VIEWER" "$API_URL/support-sessions/$SESSION_ID/case-timeline" | jq -e '.timeline[] | select(.type == "action_outbox_item")' >/dev/null
echo "PASS"

echo "12. Evidence bundle includes action/outbox summary and redacts secrets"
EVIDENCE=$(curl -fsS -b "$COOKIE_VIEWER" "$API_URL/support-sessions/$SESSION_ID/evidence-bundle.json")
echo "$EVIDENCE" | jq -e '.bundle.actionOutbox[0].realNetwork == false and .bundle.actionOutbox[0].externalWriteAttempted == false and .bundle.actionOutbox[0].writebackEnabled == false' >/dev/null
if echo "$EVIDENCE" | grep -E 'super-secret-token|password=secret-value' >/dev/null; then
  echo "FAIL: evidence bundle leaked secret-like values"
  exit 1
fi
echo "PASS"

echo "13. Cross-tenant access denied"
ALT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_ALT" "$API_URL/actions/$ACTION_ID" || true)
if [ "$ALT_CODE" != "404" ]; then
  echo "FAIL: expected 404, got $ALT_CODE"
  exit 1
fi
echo "PASS (404)"

echo "14. Web root reachable"
WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL/" || true)
if [ "$WEB_CODE" != "200" ]; then
  echo "FAIL: expected 200, got $WEB_CODE"
  exit 1
fi
echo "PASS (200)"

echo "=== Durable action/outbox verification passed ==="
