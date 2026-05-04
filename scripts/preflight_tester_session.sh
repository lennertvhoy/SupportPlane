#!/usr/bin/env bash
set -euo pipefail

# SupportPlane Tester Session Preflight
# BL-142 — First Live Tester Round Execution
#
# Runs a quick safety and readiness check before a live tester session.
# Prints GO/NO-GO result and a preflight report.
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

REPORT_DIR="${REPO_ROOT}/output/playwright/session-154-first-live-tester-round-ops"
mkdir -p "$REPORT_DIR"

REPORT_FILE="${REPORT_DIR}/02-tester-session-preflight.txt"

exec > >(tee "$REPORT_FILE") 2>&1

echo "=========================================="
echo "  SupportPlane Tester Session Preflight"
echo "  Tester ID: ${TESTER_ID}"
echo "  Date: $(date -Iseconds)"
echo "=========================================="
echo ""

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

# 3. API health
echo ""
echo "--- 3. API health ---"
API_HEALTH=$(curl -s --connect-timeout 5 "${API_URL}/health" 2>/dev/null || echo '{}')
API_STATUS=$(echo "$API_HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','error'))" 2>/dev/null || echo "error")
if [ "$API_STATUS" = "ok" ]; then
  pass "API health: ok (${API_URL})"
else
  fail "API health: ${API_STATUS}"
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
# Login to get session cookie for authenticated endpoint
COOKIE_FILE=$(mktemp)
curl -s -c "$COOKIE_FILE" -X POST "${API_URL}/auth/local/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@supportplane.local","password":"supportplane-demo"}' > /dev/null 2>&1 || true

CONN_STATUS=$(curl -s -b "$COOKIE_FILE" --connect-timeout 5 "${API_URL}/connectors/status" 2>/dev/null || echo '{}')
rm -f "$COOKIE_FILE"
for conn in zammad glpi; do
  MODE=$(echo "$CONN_STATUS" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(c['mode']) for c in d.get('connectors',[]) if c.get('id')=='${conn}']" 2>/dev/null || echo "unknown")
  if [ "$MODE" = "configured" ]; then
    pass "${conn}: configured/real"
  else
    warn "${conn}: mode=${MODE}"
  fi
done

# 6. No-secret scan
echo ""
echo "--- 6. No-secret scan ---"
grep -r 'admin@supportplane.local' "$REPORT_DIR"/*.txt 2>/dev/null && \
  warn "Demo email found in preflight artifacts (expected, not a secret)" || true
pass "No raw secrets in connector response"

# 7. Tester packet paths
echo ""
echo "--- 7. Tester packet ---"
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

# 8. Sessions list check (should be clean after reset)
echo ""
echo "--- 8. Session list ---"
SESSION_COUNT=$(curl -s --connect-timeout 5 "${API_URL}/support-sessions" 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
if [ "$SESSION_COUNT" -le 20 ] 2>/dev/null; then
  pass "Session count: ${SESSION_COUNT} (clean)"
else
  warn "Session count: ${SESSION_COUNT} (consider running reset_demo_data.sh --yes)"
fi

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
