#!/usr/bin/env bash
set -euo pipefail

# SupportPlane Tester Session Preflight
# BL-142 — First Live Tester Round Execution
#
# Runs safety and readiness checks before a live tester session.
# Checks runtime identity, ticket flows, connector health, secrets, tunnels.
# Prints GO/NO-GO result.
#
# Usage: bash scripts/preflight_tester_session.sh [--tester-id TESTER_ID]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

WEB_URL="${WEB_URL:-http://localhost:3300}"
API_URL="${API_URL:-http://localhost:4210}"
TESTER_ID="${TESTER_ID:-unknown}"

for arg in "$@"; do
  case "$arg" in
    --tester-id) TESTER_ID="$2"; shift 2 ;;
    --tester-id=*) TESTER_ID="${arg#*=}" ;;
  esac
done

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "${GREEN}[PASS]${NC} $*"; PASS=$((PASS + 1)); }
fail() { echo -e "${RED}[FAIL]${NC} $*"; FAIL=$((FAIL + 1)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; WARN=$((WARN + 1)); }

REPORT_DIR="${REPO_ROOT}/output/playwright/session-155-tester-readiness-truth-repair"
mkdir -p "$REPORT_DIR"

REPORT_FILE="${REPORT_DIR}/03-preflight-report.txt"

exec > >(tee "$REPORT_FILE") 2>&1

echo "=========================================="
echo "  SupportPlane Tester Session Preflight"
echo "  Tester ID: ${TESTER_ID}"
echo "  Date: $(date -Iseconds)"
echo "=========================================="
echo ""

# --- Authenticate once for all API checks ---
COOKIE_FILE=$(mktemp)
LOGIN_RESP=$(curl -s -c "$COOKIE_FILE" -X POST "${API_URL}/auth/local/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@supportplane.local","password":"supportplane-demo"}' 2>/dev/null || echo '{}')
LOGIN_OK=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('identity',{}).get('userEmail','FAIL'))" 2>/dev/null || echo "FAIL")
if [ "$LOGIN_OK" = "FAIL" ]; then
  echo -e "${RED}[FATAL]${NC} Cannot authenticate to API. Preflight cannot continue."
  rm -f "$COOKIE_FILE"
  exit 1
fi

# 1. No public tunnel
echo "--- 1. Public tunnel check ---"
if command -v tailscale &>/dev/null; then
  FUNNEL_STATUS=$(tailscale funnel status 2>/dev/null || true)
  if echo "$FUNNEL_STATUS" | grep -q "Funnel ON\|on port 443\|on HTTPS"; then
    fail "Tailscale Funnel is ON — turn it off before a tester session"
  else
    pass "No Tailscale Funnel active"
  fi
else
  pass "Tailscale not installed — no public tunnel"
fi

# 2. Web HTTP check
echo ""
echo "--- 2. Web HTTP check ---"
WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$WEB_URL" 2>/dev/null || echo "000")
if [ "$WEB_CODE" = "200" ]; then
  pass "Web HTTP 200 (${WEB_URL})"
else
  fail "Web not reachable (HTTP ${WEB_CODE} at ${WEB_URL})"
fi

# 3. API health + runtime identity match
echo ""
echo "--- 3. API health + runtime identity ---"
API_HEALTH=$(curl -s --connect-timeout 5 "${API_URL}/health" 2>/dev/null || echo '{}')
API_STATUS=$(echo "$API_HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','error'))" 2>/dev/null || echo "error")
API_HEAD=$(echo "$API_HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('head',''))" 2>/dev/null || echo "")
REPO_HEAD=$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo "")

if [ "$API_STATUS" = "ok" ]; then
  pass "API health: ok (${API_URL})"
else
  fail "API health: ${API_STATUS}"
fi

if [ -n "$API_HEAD" ] && [ -n "$REPO_HEAD" ]; then
  if [ "$API_HEAD" = "$REPO_HEAD" ]; then
    pass "Runtime HEAD matches repo HEAD (${API_HEAD:0:8})"
  else
    fail "Runtime HEAD mismatch — API: ${API_HEAD:0:8} repo: ${REPO_HEAD:0:8}"
  fi
else
  fail "Cannot determine runtime HEAD (API=${API_HEAD:-empty}, repo=${REPO_HEAD:-empty})"
fi

# 4. Smoke test
echo ""
echo "--- 4. Smoke test ---"
if bash "${SCRIPT_DIR}/verify_user_testing_demo.sh" 2>&1 | tail -5 | grep -q "FAIL: 0"; then
  pass "Smoke test: 10/10 PASS"
else
  fail "Smoke test did not pass 10/10"
fi

# 5. Connector status check
echo ""
echo "--- 5. Connector status ---"
CONN_STATUS=$(curl -s -b "$COOKIE_FILE" --connect-timeout 5 "${API_URL}/connectors/status" 2>/dev/null || echo '{}')
for conn in zammad glpi; do
  MODE=$(echo "$CONN_STATUS" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(c.get('mode','?')) for c in d.get('connectors',[]) if c.get('id')=='${conn}']" 2>/dev/null || echo "unknown")
  if [ "$MODE" = "configured" ]; then
    pass "${conn}: configured/real"
  else
    fail "${conn}: mode=${MODE} (expected configured/real)"
  fi
done

# 6. Zammad ticket flow proof
echo ""
echo "--- 6. Zammad ticket flow proof ---"
ZM_SESSION=$(curl -s -b "$COOKIE_FILE" -X POST "${API_URL}/support-sessions" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Preflight Zammad Check","priority":"normal"}' 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

if [ -n "$ZM_SESSION" ]; then
  ZM_RESULT=$(curl -s -b "$COOKIE_FILE" -X POST "${API_URL}/support-sessions/${ZM_SESSION}/zammad/ticket-context" \
    -H 'Content-Type: application/json' \
    -d '{"externalTicketId":"2"}' 2>/dev/null || echo '{}')
  ZM_SUBJECT=$(echo "$ZM_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ticketReference',{}).get('subject',''))" 2>/dev/null || echo "")
  ZM_ERROR=$(echo "$ZM_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message',''))" 2>/dev/null || echo "")
  if [ -n "$ZM_SUBJECT" ] && [ "$ZM_SUBJECT" != "null" ]; then
    pass "Zammad ticket loaded: ${ZM_SUBJECT:0:60}"
  else
    fail "Zammad ticket NOT loading — ${ZM_ERROR:-no subject returned}"
  fi
else
  fail "Zammad flow check: cannot create test session"
fi

# 7. GLPI ticket flow proof
echo ""
echo "--- 7. GLPI ticket flow proof ---"
GL_SESSION=$(curl -s -b "$COOKIE_FILE" -X POST "${API_URL}/support-sessions" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Preflight GLPI Check","priority":"normal"}' 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

if [ -n "$GL_SESSION" ]; then
  GL_RESULT=$(curl -s -b "$COOKIE_FILE" -X POST "${API_URL}/support-sessions/${GL_SESSION}/glpi/ticket-context" \
    -H 'Content-Type: application/json' \
    -d '{"externalTicketId":"1"}' 2>/dev/null || echo '{}')
  GL_SUBJECT=$(echo "$GL_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ticketReference',{}).get('subject',''))" 2>/dev/null || echo "")
  GL_ERROR=$(echo "$GL_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message',''))" 2>/dev/null || echo "")
  if [ -n "$GL_SUBJECT" ] && [ "$GL_SUBJECT" != "null" ]; then
    pass "GLPI ticket loaded: ${GL_SUBJECT:0:60}"
  else
    fail "GLPI ticket NOT loading — ${GL_ERROR:-no subject returned}"
  fi
else
  fail "GLPI flow check: cannot create test session"
fi

# 8. No-secret scan on connector response
echo ""
echo "--- 8. No-secret scan ---"
HAS_RAW_SECRETS=false
# Check connector response for raw token values (not field names)
if echo "$CONN_STATUS" | python3 -c "
import sys,json,re
d=json.load(sys.stdin)
text=json.dumps(d)
# Check for anything that looks like a real API token (long random string in a value field)
if re.search(r'Token token=[A-Za-z0-9]{20,}', text):
  sys.exit(1)
" 2>/dev/null; then
  pass "No raw secrets in connector status response"
else
  fail "Possible raw secret in connector response — investigate immediately"
fi

# 9. Tester packet paths
echo ""
echo "--- 9. Tester packet ---"
PACKET_FILES=(
  "docs/user-testing/SEND_TO_TESTERS.md"
  "docs/user-testing/OUTREACH_MESSAGE.md"
  "docs/user-testing/TEST_SCRIPT.md"
  "docs/user-testing/FEEDBACK_FORM.md"
  "docs/user-testing/BUG_REPORT_TEMPLATE.md"
)
for f in "${PACKET_FILES[@]}"; do
  if [ -f "$REPO_ROOT/$f" ]; then
    pass "Tester packet: $f"
  else
    warn "Missing packet file: $f"
  fi
done

# 10. Sessions list check
echo ""
echo "--- 10. Session list ---"
SESSION_COUNT=$(curl -s -b "$COOKIE_FILE" --connect-timeout 5 "${API_URL}/support-sessions" 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
if [ "$SESSION_COUNT" -le 20 ] 2>/dev/null; then
  pass "Session count: ${SESSION_COUNT} (clean)"
else
  warn "Session count: ${SESSION_COUNT} (consider running reset_demo_data.sh --yes)"
fi

# Clean up
rm -f "$COOKIE_FILE"

# Summary
echo ""
echo "=========================================="
echo "  Preflight Summary"
echo "=========================================="
echo "  PASS: ${PASS}"
echo "  FAIL: ${FAIL}"
echo "  WARN: ${WARN}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}NO-GO: ${FAIL} preflight checks failed.${NC}"
  echo "Fix failures before inviting a tester."
  exit 1
else
  echo -e "${GREEN}GO: All preflight checks passed.${NC}"
  echo "Demo is ready for tester session."
  echo ""
  echo "Next steps:"
  echo "  1. Assign persona from TESTER_PERSONAS.md"
  echo "  2. Send OUTREACH_MESSAGE.md to tester"
  echo "  3. Provide TEST_SCRIPT.md and login credentials"
  echo "  4. Collect FEEDBACK_FORM.md after session"
  echo "  5. Run close_tester_session.sh when done"
  exit 0
fi
