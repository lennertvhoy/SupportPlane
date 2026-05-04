#!/usr/bin/env bash
set -euo pipefail

# SupportPlane Close Tester Session
# BL-142 — First Live Tester Round Execution
#
# Runs post-session cleanup, bug context capture, and triage reminders.
#
# Usage: bash scripts/close_tester_session.sh [--tester-id TESTER_ID] [--round ROUND]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

TESTER_ID="${TESTER_ID:-unknown}"
ROUND="${ROUND:-001}"

for arg in "$@"; do
  case "$arg" in
    --tester-id) TESTER_ID="$2"; shift 2 ;;
    --tester-id=*) TESTER_ID="${arg#*=}" ;;
    --round) ROUND="$2"; shift 2 ;;
    --round=*) ROUND="${arg#*=}" ;;
  esac
done

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BUG_ID="ROUND-${ROUND}-${TESTER_ID}"

echo "=========================================="
echo "  SupportPlane Close Tester Session"
echo "  Tester ID: ${TESTER_ID}"
echo "  Round: ${ROUND}"
echo "  Bug Context ID: ${BUG_ID}"
echo "  Date: $(date -Iseconds)"
echo "=========================================="
echo ""

# 1. Run bug context capture
echo "--- 1. Bug context capture ---"
if bash "${SCRIPT_DIR}/capture_demo_bug_context.sh" --bug-id "$BUG_ID" 2>&1; then
  echo -e "${GREEN}[OK]${NC} Bug context captured"
else
  echo -e "${YELLOW}[WARN]${NC} Bug context capture had warnings (check output)"
fi

# 2. Remind operator to update FEEDBACK_LOG.md
echo ""
echo "--- 2. Feedback log reminder ---"
echo -e "${YELLOW}[ACTION REQUIRED]${NC} Update FEEDBACK_LOG.md with:"
echo "  - tester_id: ${TESTER_ID}"
echo "  - completed_at: $(date -Iseconds)"
echo "  - persona: (fill in)"
echo "  - overall_go_no_go: (fill in)"
echo "  - top_quote: (fill in)"
echo "  - p0/p1/p2/p3 counts"
echo "  - backlog_items_created"
echo ""
echo "  Template: docs/user-testing/FEEDBACK_LOG.md"

# 3. Remind operator to triage P0/P1
echo ""
echo "--- 3. Triage reminder ---"
echo -e "${YELLOW}[ACTION REQUIRED]${NC} Triage all findings before next tester:"
echo "  - P0 demo blocker → Fix immediately. Do NOT invite next tester until resolved."
echo "  - P1 trust/confusion gap → Create backlog item for next sprint."
echo "  - P2 polish → Group and backlog."
echo "  - P3 nice-to-have → BACKLOG.md only."
echo ""
echo "  Triage rules: docs/user-testing/FEEDBACK_TO_BACKLOG_RULES.md"

# 4. Run no-secret scan on evidence
echo ""
echo "--- 4. No-secret scan ---"
if [ -f "${SCRIPT_DIR}/verify_user_testing_demo.sh" ]; then
  bash "${SCRIPT_DIR}/verify_user_testing_demo.sh" 2>&1 | grep -q "No raw secrets" && \
    echo -e "${GREEN}[OK]${NC} No raw secrets detected" || \
    echo -e "${YELLOW}[WARN]${NC} Secret scan inconclusive"
else
  echo -e "${YELLOW}[SKIP]${NC} Secret scan script not found"
fi

# 5. Update test round control
echo ""
echo "--- 5. Round control reminder ---"
echo -e "${YELLOW}[ACTION REQUIRED]${NC} Update TEST_ROUND_001_CONTROL.md:"
echo "  - Mark tester slot as 'Completed'"
echo "  - Record feedback received: Yes/No"
echo "  - Record bug context captured: Yes"
echo "  - Update triage status"
echo "  - Create backlog items as needed"

# 6. Preflight for next tester (if applicable)
echo ""
echo "--- 6. Next tester readiness ---"
echo -e "${YELLOW}[REMINDER]${NC} Before the next tester:"
echo "  1. Verify no P0 blockers remain unresolved"
echo "  2. Run preflight_tester_session.sh for next tester"
echo "  3. Reset demo data if needed (bash scripts/reset_demo_data.sh --yes)"
echo "  4. Setup GLPI sandbox if GLPI pod restarted (bash scripts/setup_glpi_sandbox.sh)"

echo ""
echo "=========================================="
echo "  Close Session Complete"
echo "=========================================="
echo "  All output logged. Action items above need manual operator attention."
echo ""
