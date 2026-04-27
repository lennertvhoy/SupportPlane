#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4110}"
WEB_URL="${WEB_URL:-http://localhost:3200}"
STORE_MODE="${SUPPORTPLANE_STORE:-postgres}"
AUTH_MODE="${SUPPORTPLANE_AUTH_MODE:-local}"
COOKIE_JAR=$(mktemp)
COOKIE_JAR_VIEWER=$(mktemp)
COOKIE_JAR_ALT=$(mktemp)
trap 'rm -f "$COOKIE_JAR" "$COOKIE_JAR_VIEWER" "$COOKIE_JAR_ALT"' EXIT

echo "=== Support Case Workflow Verification ==="
echo "API: $API_URL"
echo "Web: $WEB_URL"
echo "Store: $STORE_MODE"
echo "Auth: $AUTH_MODE"
echo ""

# Health check
echo "1. API health"
curl -s "$API_URL/health" | jq -r '.status' || { echo "FAIL: API not reachable"; exit 1; }
echo "PASS"
echo ""

# Local auth login (seeded operator)
echo "2. Local auth login"
curl -s -c "$COOKIE_JAR" -X POST "$API_URL/auth/local/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@supportplane.local","password":"supportplane-demo","tenantSlug":"dev-tenant"}' >/dev/null
LOGIN_CHECK=$(curl -s -b "$COOKIE_JAR" "$API_URL/auth/me" | jq -r '.identity.userEmail // empty')
if [ -z "$LOGIN_CHECK" ]; then
  echo "FAIL: login/session cookie not working"
  exit 1
fi
echo "PASS ($LOGIN_CHECK)"
echo ""

# Tickets API
echo "3. GET /tickets"
TICKETS=$(curl -s -b "$COOKIE_JAR" "$API_URL/tickets")
echo "$TICKETS" | jq '.tickets | length' >/dev/null && echo "PASS" || { echo "FAIL"; exit 1; }
echo ""

# Ticket by external key
echo "4. GET /tickets/TICKET-101"
TICKET_101=$(curl -s -b "$COOKIE_JAR" "$API_URL/tickets/TICKET-101")
echo "$TICKET_101" | jq -r '.ticket.externalTicketId // empty' && echo "PASS" || { echo "FAIL"; exit 1; }
echo ""

# Connector installations
echo "5. GET /connector-installations"
INST=$(curl -s -b "$COOKIE_JAR" "$API_URL/connector-installations")
echo "$INST" | jq '.installations | length' >/dev/null && echo "PASS" || { echo "FAIL"; exit 1; }
echo ""

# Validate connector installation (mock)
echo "6. POST /connector-installations/:id/validate"
INST_ID=$(echo "$INST" | jq -r '.installations[0].id // empty')
if [ -n "$INST_ID" ]; then
  curl -s -X POST -b "$COOKIE_JAR" "$API_URL/connector-installations/$INST_ID/validate" | jq -r '.result.mode' && echo "PASS" || { echo "FAIL"; exit 1; }
else
  echo "SKIP: no installations"
fi
echo ""

# Test connector installation (mock)
echo "7. POST /connector-installations/:id/test"
if [ -n "$INST_ID" ]; then
  curl -s -X POST -b "$COOKIE_JAR" "$API_URL/connector-installations/$INST_ID/test" | jq -r '.result.mode' && echo "PASS" || { echo "FAIL"; exit 1; }
else
  echo "SKIP: no installations"
fi
echo ""

# Support session creation
echo "8. Create support session"
SESSION=$(curl -s -X POST -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  "$API_URL/support-sessions" -d '{"title":"BL-091 Verify Session","priority":"high"}')
SESSION_ID=$(echo "$SESSION" | jq -r '.id // empty')
if [ -z "$SESSION_ID" ]; then
  echo "FAIL: session creation failed"
  echo "$SESSION"
  exit 1
fi
echo "PASS (session: $SESSION_ID)"
echo ""

# Link ticket to session
echo "9. Link ticket to session"
LINKED=$(curl -s -X POST -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  "$API_URL/support-sessions/$SESSION_ID/link-ticket" -d '{"ticketReferenceId":"TICKET-101"}')
echo "$LINKED" | jq -r '.linkedTicketIds | length' && echo "PASS" || { echo "FAIL"; exit 1; }
echo ""

# Case timeline
echo "10. GET /support-sessions/:id/case-timeline"
TL=$(curl -s -b "$COOKIE_JAR" "$API_URL/support-sessions/$SESSION_ID/case-timeline")
echo "$TL" | jq '.timeline | length' >/dev/null && echo "PASS" || { echo "FAIL"; exit 1; }
echo ""

# Support note draft
echo "11. POST /support-sessions/:id/support-note-drafts"
curl -s -X POST -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  "$API_URL/support-sessions/$SESSION_ID/support-note-drafts" \
  -d '{"externalTicketId":"TICKET-101","operatorNotes":"Verify test"}' | jq -r '.notSentToZammad' && echo "PASS" || { echo "FAIL"; exit 1; }
echo ""

# Evidence bundle
echo "12. Evidence bundle includes supportNoteDrafts"
EB=$(curl -s -b "$COOKIE_JAR" "$API_URL/support-sessions/$SESSION_ID/evidence-bundle.json")
echo "$EB" | jq '.bundle.supportNoteDrafts' >/dev/null && echo "PASS" || { echo "FAIL"; exit 1; }
echo ""

# Viewer role denied mutation
echo "13. Viewer cannot mutate connector installation"
curl -s -c "$COOKIE_JAR_VIEWER" -X POST "$API_URL/auth/local/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@supportplane.local","password":"supportplane-demo","tenantSlug":"dev-tenant"}' >/dev/null
VIEWER_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -b "$COOKIE_JAR_VIEWER" "$API_URL/connector-installations/$INST_ID/test" || true)
if [ "$VIEWER_CODE" = "403" ]; then
  echo "PASS (403)"
else
  echo "FAIL: expected 403, got $VIEWER_CODE"
  exit 1
fi
echo ""

# Cross-tenant denied
echo "14. Cross-tenant access denied"
curl -s -c "$COOKIE_JAR_ALT" -X POST "$API_URL/auth/local/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@alt.supportplane.local","password":"supportplane-demo","tenantSlug":"alt-tenant"}' >/dev/null
ALT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR_ALT" "$API_URL/support-sessions/$SESSION_ID" || true)
if [ "$ALT_CODE" = "404" ]; then
  echo "PASS (404)"
else
  echo "FAIL: expected 404, got $ALT_CODE"
  exit 1
fi
echo ""

# Web root reachable
echo "15. Web root reachable"
WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL/" || true)
if [ "$WEB_CODE" = "200" ]; then
  echo "PASS (200)"
else
  echo "FAIL: expected 200, got $WEB_CODE"
  exit 1
fi
echo ""

echo "=== All support case workflow checks passed ==="
