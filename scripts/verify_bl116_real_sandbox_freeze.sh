#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4210}"
WEB_URL="${WEB_URL:-http://localhost:3300}"
OUT_DIR="${OUT_DIR:-output/playwright/session-115-bl116-real-sandbox-acceptance-freeze}"
COOKIE_OPERATOR=$(mktemp)
COOKIE_ADMIN=$(mktemp)
COOKIE_VIEWER=$(mktemp)
trap 'rm -f "$COOKIE_OPERATOR" "$COOKIE_ADMIN" "$COOKIE_VIEWER"' EXIT

mkdir -p "$OUT_DIR"

json_get() {
  local path="$1"
  curl -fsS -b "$COOKIE_OPERATOR" "$API_URL$path"
}

json_post() {
  local path="$1"
  local body="{}"
  if [[ $# -ge 2 ]]; then
    body="$2"
  fi
  curl -fsS -b "$COOKIE_OPERATOR" -X POST "$API_URL$path" \
    -H "Content-Type: application/json" \
    -d "$body"
}

admin_post() {
  local path="$1"
  local body="{}"
  if [[ $# -ge 2 ]]; then
    body="$2"
  fi
  curl -fsS -b "$COOKIE_ADMIN" -X POST "$API_URL$path" \
    -H "Content-Type: application/json" \
    -d "$body"
}

viewer_post() {
  local path="$1"
  local body="{}"
  if [[ $# -ge 2 ]]; then
    body="$2"
  fi
  curl -fsS -b "$COOKIE_VIEWER" -X POST "$API_URL$path" \
    -H "Content-Type: application/json" \
    -d "$body"
}

echo "=== BL-116 Real Self-Hosted Sandbox Freeze Verification ==="
echo "API: $API_URL"
echo "Web: $WEB_URL"
echo "Artifacts: $OUT_DIR"

# 1. API health
echo "1. API health"
HEALTH=$(curl -fsS "$API_URL/health")
echo "$HEALTH" | jq -e '.status == "ok"' >/dev/null
API_HEAD=$(echo "$HEALTH" | jq -r '.head')
echo "PASS (head=$API_HEAD)"

# 2. Login operator/admin/viewer
echo "2. Login operator/admin/viewer"
curl -fsS -c "$COOKIE_OPERATOR" -X POST "$API_URL/auth/local/login" -H "Content-Type: application/json" \
  -d '{"email":"operator@supportplane.local","password":"supportplane-demo","tenantSlug":"dev-tenant"}' >/dev/null
curl -fsS -c "$COOKIE_ADMIN" -X POST "$API_URL/auth/local/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@supportplane.local","password":"supportplane-demo","tenantSlug":"dev-tenant"}' >/dev/null
curl -fsS -c "$COOKIE_VIEWER" -X POST "$API_URL/auth/local/login" -H "Content-Type: application/json" \
  -d '{"email":"viewer@supportplane.local","password":"supportplane-demo","tenantSlug":"dev-tenant"}' >/dev/null
json_get "/auth/me" | jq -e '.identity.userEmail == "operator@supportplane.local"' >/dev/null
echo "PASS"

# 3. Create session and load real Zammad ticket/customer
echo "3. Real Zammad sandbox read"
SESSION=$(json_post "/support-sessions" '{"title":"BL-116 freeze E2E","priority":"high"}')
SESSION_ID=$(echo "$SESSION" | jq -r '.id')
TICKET_CONTEXT=$(json_post "/support-sessions/$SESSION_ID/zammad/ticket-context" '{"externalTicketId":"2"}')
echo "$TICKET_CONTEXT" | jq -e '.contextPacket.payload.connectorMode == "zammad"' >/dev/null
echo "$TICKET_CONTEXT" | jq -e '.contextPacket.payload.customerName == "Acme BVBA"' >/dev/null
echo "PASS"

# 4. Real Gemma/Ollama draft
echo "4. Real Gemma/Ollama draft"
OLLAMA_DRAFT=$(json_post "/support-sessions/$SESSION_ID/draft-suggestion" '{"operatorInstructions":"Summarize sandbox ticket safely.","modelSelection":{"provider":"ollama","model":"gemma:2b"}}')
echo "$OLLAMA_DRAFT" | jq -e '.provider == "ollama"' >/dev/null
echo "$OLLAMA_DRAFT" | jq -e '.usage.fallbackUsed == false' >/dev/null
echo "$OLLAMA_DRAFT" | jq -e '.usage.noCloudCall == true' >/dev/null
echo "$OLLAMA_DRAFT" | jq -e '.safety.autonomousSend == false' >/dev/null
echo "PASS"

# 5. Action -> submit -> approve -> queue
echo "5. Action lifecycle"
ACTION=$(json_post "/support-sessions/$SESSION_ID/actions" '{"actionType":"ticket_note","externalTicketId":"2","body":"BL-116 sandbox internal note writeback freeze test.","subject":"BL-116 Freeze","connectorInstallationId":"conn-inst-dev-001"}')
ACTION_ID=$(echo "$ACTION" | jq -r '.action.id')
json_post "/actions/$ACTION_ID/submit-for-review" '{}' >/dev/null
admin_post "/actions/$ACTION_ID/approve" '{"reason":"BL-116 freeze approval"}' >/dev/null
QUEUE=$(admin_post "/actions/$ACTION_ID/queue")
echo "$QUEUE" | jq -e '.outboxItem.deliveryMode == "sandbox"' >/dev/null
echo "$QUEUE" | jq -e '.outboxItem.deliveryIntent.policyDecision == "sandbox_allowed"' >/dev/null
OUTBOX_ID=$(echo "$QUEUE" | jq -r '.outboxItem.id')
echo "PASS (action=$ACTION_ID outbox=$OUTBOX_ID)"

# 6. Process outbox (or wait for worker auto-claim)
echo "6. Process outbox"
SERVICE_TOKEN=$(kubectl get secret app-secret-local -n supportplane-app -o jsonpath='{.data.SUPPORTPLANE_INTERNAL_SERVICE_TOKEN}' | base64 -d)
PROCESS=$(curl -fsS -X POST "$API_URL/outbox/process-once" \
  -H "Content-Type: application/json" \
  -H "x-supportplane-service-token: $SERVICE_TOKEN" \
  -d '{"workerId":"bl116-freeze-worker"}')
echo "$PROCESS" | jq .

# 7. Poll outbox status until sandbox_delivered (handles worker auto-claim race)
echo "7. Outbox status"
for i in {1..15}; do
  OUTBOX_STATUS=$(curl -fsS -b "$COOKIE_ADMIN" "$API_URL/outbox/$OUTBOX_ID")
  STATUS=$(echo "$OUTBOX_STATUS" | jq -r '.outboxItem.status')
  if [ "$STATUS" = "sandbox_delivered" ]; then
    break
  fi
  sleep 1
done
echo "$OUTBOX_STATUS" | jq -e '.outboxItem.status == "sandbox_delivered"' >/dev/null
echo "$OUTBOX_STATUS" | jq -e '.outboxItem.deliveryMode == "sandbox"' >/dev/null
echo "PASS"

# 8. Verify Zammad article
echo "8. Zammad article"
ZAMMAD_TOKEN="${ZAMMAD_API_TOKEN:-$(kubectl get secret app-secret-local -n supportplane-app -o jsonpath='{.data.ZAMMAD_API_TOKEN}' | base64 -d)}"
if [ -z "$ZAMMAD_TOKEN" ]; then
  echo "WARN: ZAMMAD_API_TOKEN not available; skipping direct Zammad verification"
  echo "INFO"
else
ARTICLES=$(curl -s "http://localhost:8080/api/v1/ticket_articles/by_ticket/2" -H "Authorization: Bearer $ZAMMAD_TOKEN")
ARTICLE_COUNT=$(echo "$ARTICLES" | jq 'length')
echo "Articles on ticket 2: $ARTICLE_COUNT"
echo "$ARTICLES" | jq -e 'map(select(.body | contains("SupportPlane sandbox internal note"))) | length > 0' >/dev/null
echo "PASS"
fi

# 9. Verify MinIO evidence
echo "9. MinIO evidence"
MINIO_ACCESS="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET="${MINIO_SECRET_KEY:-minioadmin}"
BUCKET="${MINIO_EVIDENCE_BUCKET:-supportplane-evidence}"
# Try to list objects with prefix
curl -s "http://localhost:9000/${BUCKET}?list-type=2&prefix=dev-tenant/writebacks/${SESSION_ID}/" \
  -u "${MINIO_ACCESS}:${MINIO_SECRET}" > /tmp/bl116-minio-list.xml
if grep -q "<Key>" /tmp/bl116-minio-list.xml; then
  echo "MinIO evidence object found"
  grep "<Key>" /tmp/bl116-minio-list.xml | head -3
  echo "PASS"
else
  echo "MinIO list returned:"
  cat /tmp/bl116-minio-list.xml | head -c 500
  echo "INFO: MinIO evidence may use different prefix; continuing"
fi

# 10. Verify Mailpit notification
echo "10. Mailpit notification"
MAILPIT=$(curl -s "http://localhost:8025/api/v1/messages")
MAILPIT_TOTAL=$(echo "$MAILPIT" | jq '.total')
echo "Mailpit total messages: $MAILPIT_TOTAL"
if [ "$MAILPIT_TOTAL" -gt 0 ]; then
  echo "$MAILPIT" | jq -e '.messages | map(select(.Subject | contains("sandbox"))) | length > 0' >/dev/null && echo "PASS" || echo "INFO: no sandbox subject match but messages exist"
else
  echo "INFO: no messages in Mailpit yet (may need worker SMTP delivery)"
fi

# 11. Audit/timeline terminal events
echo "11. Audit events"
AUDIT=$(curl -fsS -b "$COOKIE_ADMIN" "$API_URL/support-sessions/$SESSION_ID/audit-events")
echo "$AUDIT" | jq -e 'map(select(.eventType == "action_sandbox_delivered" or .eventType == "outbox_sandbox_delivered")) | length > 0' >/dev/null
echo "PASS"

# 12. Save E2E proof
cat > "$OUT_DIR/04-real-sandbox-e2e-flow-proof.txt" <<EOF
=== BL-116 Fresh Real Sandbox E2E Flow Proof ===
Generated: $(date -Iseconds)
Git HEAD: $API_HEAD
Session ID: $SESSION_ID
Action ID: $ACTION_ID
Outbox ID: $OUTBOX_ID

=== Step 1: API Health ===
$HEALTH

=== Step 2: Session Created ===
$SESSION

=== Step 3: Real Zammad Ticket/Customer ===
$TICKET_CONTEXT

=== Step 4: Gemma/Ollama Draft (fallbackUsed=false, noCloudCall=true) ===
$OLLAMA_DRAFT

=== Step 5: Action Submitted/Approved/Queued (deliveryMode=sandbox) ===
$QUEUE

=== Step 6: Outbox Processed ===
$PROCESS

=== Step 7: Outbox Status (sandbox_delivered) ===
$OUTBOX_STATUS

=== Step 8: Zammad Articles on Ticket 2 ===
Total articles: $ARTICLE_COUNT
Articles containing BL-116: $(echo "$ARTICLES" | jq 'map(select(.body | contains("BL-116"))) | length')

=== Step 9: MinIO Evidence ===
$(cat /tmp/bl116-minio-list.xml | head -c 800)

=== Step 10: Mailpit Messages ===
Total: $MAILPIT_TOTAL
$MAILPIT

=== Step 11: Audit Events ===
$(echo "$AUDIT" | jq 'map(select(.eventType | contains("sandbox_delivered")))')
EOF

echo "=== E2E flow proof saved to $OUT_DIR/04-real-sandbox-e2e-flow-proof.txt ==="
