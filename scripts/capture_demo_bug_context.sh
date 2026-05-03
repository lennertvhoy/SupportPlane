#!/usr/bin/env bash
set -uo pipefail

# SupportPlane — Demo Bug Context Capture
#
# Captures a snapshot of the demo environment for bug reproduction.
# Writes timestamped/named files into an output directory.
#
# Usage:
#   bash scripts/capture_demo_bug_context.sh
#   bash scripts/capture_demo_bug_context.sh --bug-id BUG-001
#   bash scripts/capture_demo_bug_context.sh --bug-id BUG-001 --output-dir /tmp/my-bug
#
# What it does NOT do:
#   - Does NOT expose raw secrets in output
#   - Does NOT modify cluster state (test sessions are append-only)
#   - Does NOT open public tunnels
#   - Does NOT claim production readiness
#
# Dependencies: kubectl, curl, python3
# Demo stack must be running (use scripts/start_demo_mode.sh first).

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ------------------------------------------------------------------
# Argument parsing
# ------------------------------------------------------------------
BUG_ID="${SP_BUG_ID:-BUG-000}"
OUTPUT_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bug-id)
      BUG_ID="$2"
      shift 2
      ;;
    --bug-id=*)
      BUG_ID="${1#*=}"
      shift
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --output-dir=*)
      OUTPUT_DIR="${1#*=}"
      shift
      ;;
    --help|-h)
      echo "Usage: bash scripts/capture_demo_bug_context.sh [--bug-id BUG-001] [--output-dir /path/to/dir]"
      echo ""
      echo "Captures a snapshot of the demo environment for bug reproduction."
      echo ""
      echo "Options:"
      echo "  --bug-id ID        Bug identifier label (default: BUG-000)"
      echo "  --output-dir DIR   Output directory (default: output/playwright/session-145-user-testing-operations/bug-contexts/)"
      echo ""
      echo "Environment variables (optional override):"
      echo "  SP_API_PORT        API port (default: 4210)"
      echo "  SP_WEB_PORT        Web port (default: 3300)"
      echo "  SP_DEMO_EMAIL      Demo email (default: admin@supportplane.local)"
      echo "  SP_DEMO_PASS       Demo password (default: supportplane-demo)"
      echo "  SP_DEMO_TENANT     Demo tenant slug (default: dev-tenant)"
      echo "  SP_NS              App namespace (default: supportplane-app)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------
API_PORT="${SP_API_PORT:-4210}"
WEB_PORT="${SP_WEB_PORT:-3300}"
DEMO_EMAIL="${SP_DEMO_EMAIL:-admin@supportplane.local}"
DEMO_PASS="${SP_DEMO_PASS:-supportplane-demo}"
DEMO_TENANT="${SP_DEMO_TENANT:-dev-tenant}"
APP_NS="${SP_NS:-supportplane-app}"
API_BASE="http://localhost:${API_PORT}"

if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="output/playwright/session-145-user-testing-operations/bug-contexts/${BUG_ID}"
fi

TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$OUTPUT_DIR"

# ------------------------------------------------------------------
# Color helpers (matching start_demo_mode.sh conventions)
# ------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC}   $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; }
info() { echo -e "        $*"; }

# ------------------------------------------------------------------
# Global state
# ------------------------------------------------------------------
CAPTURED=0
FAILURES=0
SKIPPED=0
API_HEALTH_OK=false
CONNECTOR_STATUS_OK=false
COOKIE=""
REPORT_LINES=()
SESSION_Z_ID=""
SESSION_G_ID=""

# ------------------------------------------------------------------
# Secret redaction patterns
# ------------------------------------------------------------------
# Applied to log output. Matches known token/key patterns and replaces
# with [REDACTED]. Does not mutate files in-place; used via pipe.
redact_secrets() {
  sed -E \
    -e 's/(GLPI_API_TOKEN)=[^[:space:]"]+/GLPI_API_TOKEN=[REDACTED]/g' \
    -e 's/(ZAMMAD_API_TOKEN)[=:]\s*[^[:space:]"]+/ZAMMAD_API_TOKEN=[REDACTED]/g' \
    -e 's/(appToken|session_token|api_token|apiToken|user_token)=[^[:space:]"]+/\1=[REDACTED]/g' \
    -e 's/(Authorization:\s*Bearer\s*)[^[:space:]"]+/\1[REDACTED]/g' \
    -e 's/(password=)[^[:space:]&"]+/\1[REDACTED]/g' \
    -e 's/(PASSWORD=)[^[:space:]"]+/\1[REDACTED]/g' \
    -e 's/(secret|SECRET)=\{[^}]*\}/\1=[REDACTED]/g' \
    -e 's/(DockerPassword=)[^[:space:]"]+/\1[REDACTED]/g' \
    -e 's/(MINIO_ROOT_PASSWORD)=[^[:space:]"]+/\1=[REDACTED]/g' \
    -e 's/(OPENBAO_DEV_ROOT_TOKEN_ID)=[^[:space:]"]+/\1=[REDACTED]/g'
}

# ------------------------------------------------------------------
# Write a key=value line to the capture report
# ------------------------------------------------------------------
report() {
  REPORT_LINES+=("$1")
}

# ------------------------------------------------------------------
# Capture helpers — each writes one output file, returns 0 on success
# ------------------------------------------------------------------

capture_api_health() {
  local out="$OUTPUT_DIR/api-health.json"
  info "Capturing API health..."

  if ! curl -s --max-time 10 "${API_BASE}/health" > "$out" 2>/dev/null; then
    fail "API health check failed (port ${API_PORT})"
    echo "{}" > "$out"
    FAILURES=$((FAILURES + 1))
    return 1
  fi

  local status
  status=$(python3 -c "import json; d=json.load(open('$out')); print(d.get('status','error'))" 2>/dev/null || echo "error")
  if [[ "$status" == "ok" ]]; then
    local head branch store
    head=$(python3 -c "import json; d=json.load(open('$out')); print(d.get('head','?')[:12])" 2>/dev/null || echo "?")
    branch=$(python3 -c "import json; d=json.load(open('$out')); print(d.get('branch','?'))" 2>/dev/null || echo "?")
    store=$(python3 -c "import json; d=json.load(open('$out')); print(d.get('storeMode','?'))" 2>/dev/null || echo "?")
    ok "API health: status=${status} head=${head} branch=${branch} store=${store}"
    API_HEALTH_OK=true
    CAPTURED=$((CAPTURED + 1))
    return 0
  else
    fail "API returned status=${status}"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
}

capture_git_head() {
  local out="$OUTPUT_DIR/git-head.txt"
  info "Capturing git HEAD and status..."

  {
    echo "Bug:     ${BUG_ID}"
    echo "Captured: ${TIMESTAMP}"
    echo "Repo:    ${REPO_ROOT}"
    echo ""
    echo "=== git rev-parse HEAD ==="
    git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo "(git command failed)"
    echo ""
    echo "=== git rev-parse --short HEAD ==="
    git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo "(git command failed)"
    echo ""
    echo "=== git log --oneline -5 ==="
    git -C "$REPO_ROOT" log --oneline -5 2>/dev/null || echo "(git command failed)"
    echo ""
    echo "=== git status --short --branch ==="
    git -C "$REPO_ROOT" status --short --branch 2>/dev/null || echo "(git command failed)"
  } > "$out"

  ok "Git status captured"
  CAPTURED=$((CAPTURED + 1))
  return 0
}

capture_pod_status() {
  local out="$OUTPUT_DIR/pod-status.txt"
  info "Capturing pod status..."

  if ! command -v kubectl &>/dev/null; then
    warn "kubectl not found — skipping pod status"
    echo "SKIPPED: kubectl not installed" > "$out"
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi

  {
    echo "=== kubectl get pods -A -o wide ==="
    kubectl get pods -A -o wide 2>/dev/null | redact_secrets || echo "(kubectl command failed)"
    echo ""
    echo "=== kubectl get pods -n ${APP_NS} ==="
    kubectl get pods -n "$APP_NS" 2>/dev/null | redact_secrets || echo "(kubectl command failed)"
    echo ""
    echo "=== kubectl get pods -n supportplane-data ==="
    kubectl get pods -n supportplane-data 2>/dev/null | redact_secrets || echo "(kubectl command failed)"
    echo ""
    echo "=== kubectl get pods -n supportplane-integrations ==="
    kubectl get pods -n supportplane-integrations 2>/dev/null | redact_secrets || echo "(kubectl command failed)"
  } > "$out"

  ok "Pod status captured"
  CAPTURED=$((CAPTURED + 1))
  return 0
}

capture_connector_status() {
  local out="$OUTPUT_DIR/connector-status.json"
  info "Authenticating for connector status..."

  # Login
  COOKIE=$(curl -s -c - --max-time 10 -X POST "${API_BASE}/auth/local/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${DEMO_EMAIL}\",\"password\":\"${DEMO_PASS}\",\"tenantSlug\":\"${DEMO_TENANT}\"}" 2>&1 \
    | grep supportplane_session | awk '{print $NF}' || echo "")

  if [[ -z "$COOKIE" ]]; then
    fail "Demo login failed (${DEMO_EMAIL} / ${DEMO_TENANT})"
    echo "{}" > "$out"
    FAILURES=$((FAILURES + 1))
    return 1
  fi

  info "Logged in as ${DEMO_EMAIL} (tenant: ${DEMO_TENANT})"

  # Fetch connector status
  if ! curl -s --max-time 10 -b "supportplane_session=${COOKIE}" "${API_BASE}/connectors/status" > "$out" 2>/dev/null; then
    fail "Connector status fetch failed"
    echo "{}" > "$out"
    FAILURES=$((FAILURES + 1))
    return 1
  fi

  # Pretty-print for readability (overwrite with formatted version)
  python3 -c "import json; data=json.load(open('$out')); json.dump(data, open('$out','w'), indent=2)" 2>/dev/null || true

  # Summarize connectors
  local summary
  summary=$(python3 -c "
import json
data = json.load(open('$out'))
for c in data.get('connectors', []):
    print(f\"  {c.get('id','?')}: mode={c.get('mode','?')} transport={c.get('transport','?')} connected={c.get('connected','?')}\")
" 2>/dev/null)

  if [[ -n "$summary" ]]; then
    ok "Connector status captured:"
    echo "$summary"
    CONNECTOR_STATUS_OK=true
    CAPTURED=$((CAPTURED + 1))
    return 0
  else
    fail "Connector status returned empty or invalid"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
}

# Helper: create a support session, return the session ID (or empty on failure)
create_session() {
  local title="$1"
  if [[ -z "$COOKIE" ]]; then echo ""; return 1; fi
  curl -s --max-time 10 -b "supportplane_session=${COOKIE}" \
    -X POST "${API_BASE}/support-sessions" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"${title}\",\"priority\":\"high\"}" 2>/dev/null \
    | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo ""
}

capture_zammad_context() {
  local out="$OUTPUT_DIR/zammad-context.json"
  info "Capturing Zammad ticket context (ticket #2)..."

  if [[ -z "$COOKIE" ]]; then
    fail "Zammad context: not authenticated (login failed earlier)"
    echo "{}" > "$out"
    FAILURES=$((FAILURES + 1))
    return 1
  fi

  SESSION_Z_ID=$(create_session "Bug ${BUG_ID}: Zammad context")

  if [[ -z "$SESSION_Z_ID" ]]; then
    fail "Zammad context: could not create session"
    echo "{}" > "$out"
    FAILURES=$((FAILURES + 1))
    return 1
  fi

  info "Created session ${SESSION_Z_ID}"

  if ! curl -s --max-time 10 -b "supportplane_session=${COOKIE}" \
    -X POST "${API_BASE}/support-sessions/${SESSION_Z_ID}/zammad/ticket-context" \
    -H "Content-Type: application/json" \
    -d '{"externalTicketId":"2"}' > "$out" 2>/dev/null; then
    fail "Zammad context: API call failed"
    echo "{}" > "$out"
    FAILURES=$((FAILURES + 1))
    return 1
  fi

  # Pretty-print
  python3 -c "import json; data=json.load(open('$out')); json.dump(data, open('$out','w'), indent=2)" 2>/dev/null || true

  local subject
  subject=$(python3 -c "import json; d=json.load(open('$out')); print(d.get('ticketReference',{}).get('subject','?'))" 2>/dev/null || echo "?")
  ok "Zammad context: '${subject}' (ticket #2)"
  CAPTURED=$((CAPTURED + 1))
  return 0
}

capture_glpi_context() {
  local out="$OUTPUT_DIR/glpi-context.json"
  info "Capturing GLPI ticket context (ticket #1)..."

  if [[ -z "$COOKIE" ]]; then
    fail "GLPI context: not authenticated (login failed earlier)"
    echo "{}" > "$out"
    FAILURES=$((FAILURES + 1))
    return 1
  fi

  SESSION_G_ID=$(create_session "Bug ${BUG_ID}: GLPI context")

  if [[ -z "$SESSION_G_ID" ]]; then
    fail "GLPI context: could not create session"
    echo "{}" > "$out"
    FAILURES=$((FAILURES + 1))
    return 1
  fi

  info "Created session ${SESSION_G_ID}"

  if ! curl -s --max-time 10 -b "supportplane_session=${COOKIE}" \
    -X POST "${API_BASE}/support-sessions/${SESSION_G_ID}/glpi/ticket-context" \
    -H "Content-Type: application/json" \
    -d '{"externalTicketId":"1"}' > "$out" 2>/dev/null; then
    fail "GLPI context: API call failed"
    echo "{}" > "$out"
    FAILURES=$((FAILURES + 1))
    return 1
  fi

  # Pretty-print
  python3 -c "import json; data=json.load(open('$out')); json.dump(data, open('$out','w'), indent=2)" 2>/dev/null || true

  local subject
  subject=$(python3 -c "import json; d=json.load(open('$out')); print(d.get('contextPacket',{}).get('payload',{}).get('ticketSubject','?'))" 2>/dev/null || echo "?")
  ok "GLPI context: '${subject}' (ticket #1)"
  CAPTURED=$((CAPTURED + 1))
  return 0
}

capture_pod_logs() {
  local label_selector="$1"
  local label_name="$2"
  local out="$OUTPUT_DIR/pod-logs-${label_name}.txt"
  info "Capturing pod logs for ${label_name} (last 50 lines)..."

  if ! command -v kubectl &>/dev/null; then
    warn "kubectl not found — skipping ${label_name} logs"
    echo "SKIPPED: kubectl not installed" > "$out"
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi

  local pod_name
  pod_name=$(kubectl get pods -n "$APP_NS" -l "app.kubernetes.io/name=${label_selector}" \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

  if [[ -z "$pod_name" ]]; then
    warn "No pod found for ${label_selector} in namespace ${APP_NS} — skipping logs"
    echo "SKIPPED: no pod found for label app.kubernetes.io/name=${label_selector}" > "$out"
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi

  {
    echo "=== Pod: ${pod_name} ==="
    echo "=== Namespace: ${APP_NS} ==="
    echo "=== Captured: ${TIMESTAMP} ==="
    echo ""
    kubectl logs -n "$APP_NS" "$pod_name" --tail=50 2>/dev/null | redact_secrets || echo "(kubectl logs failed)"
  } > "$out"

  ok "Pod logs captured: ${pod_name} (${label_name})"
  CAPTURED=$((CAPTURED + 1))
  return 0
}

capture_no_secret_scan() {
  local out="$OUTPUT_DIR/no-secret-scan.txt"
  info "Scanning captured JSON files for secret-like patterns..."

  local patterns=("GLPI_API_TOKEN" "ZAMMAD_API_TOKEN" "session_token" "password" "Bearer" "appToken" "apiToken" "user_token" "OPENBAO_DEV_ROOT_TOKEN_ID" "MINIO_ROOT_PASSWORD")
  local found_any=false

  {
    echo "=== No-Secret Scan ==="
    echo "Bug:     ${BUG_ID}"
    echo "Captured: ${TIMESTAMP}"
    echo "Directory: ${OUTPUT_DIR}"
    echo ""

    for f in "$OUTPUT_DIR"/*.json; do
      [[ -f "$f" ]] || continue
      local fname
      fname=$(basename "$f")
      local file_clean=true

      for pattern in "${patterns[@]}"; do
        if grep -qin "$pattern" "$f" 2>/dev/null; then
          # Found a match — check if it's a real secret value or just a metadata key
          local matches
          matches=$(grep -in "$pattern" "$f" 2>/dev/null || true)
          while IFS= read -r line; do
            # Skip lines that are just metadata keys (e.g., "credentialSource": "vault" is fine)
            # but flag actual token values
            if echo "$line" | grep -qiE "${pattern}.*[:=]\s*[^\"]*sp-api" 2>/dev/null; then
              echo "  ** SECRET FOUND in ${fname}: ${line}"
              found_any=true
              file_clean=false
            elif echo "$line" | grep -qiE "${pattern}.*[:=]\s*\"[A-Za-z0-9_\-]{20,}\"" 2>/dev/null; then
              echo "  ** SECRET FOUND in ${fname}: ${line}"
              found_any=true
              file_clean=false
            elif echo "$line" | grep -qiE "${pattern}.*[:=]\s*\"[^\"]{20,}\"" 2>/dev/null; then
              echo "  ** SECRET FOUND in ${fname}: ${line}"
              found_any=true
              file_clean=false
            fi
          done <<< "$matches"
        fi
      done

      if $file_clean; then
        echo "  ${fname}: clean"
      fi
    done

    echo ""
    if $found_any; then
      echo "RESULT: SECRETS DETECTED — review flagged files above."
      echo "WARNING: Evidence folder may contain raw secrets. Do not commit without redaction."
    else
      echo "RESULT: No raw secrets detected in captured JSON files."
    fi
  } > "$out"

  if $found_any; then
    warn "No-secret scan: potential secrets detected (see report for details)"
    FAILURES=$((FAILURES + 1))
    return 1
  else
    ok "No-secret scan: clean"
    CAPTURED=$((CAPTURED + 1))
    return 0
  fi
}

capture_report() {
  local out="$OUTPUT_DIR/capture-report.txt"
  info "Writing capture report..."

  {
    echo "==========================================="
    echo "  SupportPlane Bug Context Capture Report"
    echo "==========================================="
    echo ""
    echo "  Bug ID:    ${BUG_ID}"
    echo "  Timestamp: ${TIMESTAMP}"
    echo "  Directory: ${OUTPUT_DIR}"
    echo ""
    echo "  API base:  ${API_BASE}"
    echo "  Web port:  ${WEB_PORT}"
    echo "  User:      ${DEMO_EMAIL}"
    echo "  Tenant:    ${DEMO_TENANT}"
    echo ""
    echo "-------------------------------------------"
    echo "  Capture Summary"
    echo "-------------------------------------------"
    echo ""
    echo "  Captured: ${CAPTURED}"
    echo "  Failures: ${FAILURES}"
    echo "  Skipped:  ${SKIPPED}"
    echo ""
    echo "  API health ok:       ${API_HEALTH_OK}"
    echo "  Connector status ok: ${CONNECTOR_STATUS_OK}"
    echo ""
    echo "  Created sessions:"
    if [[ -n "$SESSION_Z_ID" ]]; then
      echo "    Zammad: ${SESSION_Z_ID}"
    fi
    if [[ -n "$SESSION_G_ID" ]]; then
      echo "    GLPI:   ${SESSION_G_ID}"
    fi
    echo ""
    echo "-------------------------------------------"
    echo "  Files Captured"
    echo "-------------------------------------------"
    echo ""

    local i=1
    for f in "$OUTPUT_DIR"/*; do
      [[ -f "$f" ]] || continue
      local fname size
      fname=$(basename "$f")
      size=$(wc -c < "$f" 2>/dev/null || echo "0")
      printf "  %2d. %-35s %6s bytes\n" "$i" "$fname" "$size"
      i=$((i + 1))
    done

    echo ""
    echo "  Full path: $(realpath "$OUTPUT_DIR")"
    echo ""
    echo "==========================================="
  } > "$out"

  ok "Capture report written: ${out}"
  CAPTURED=$((CAPTURED + 1))
}

print_summary() {
  echo ""
  echo "========================================"
  echo "  Bug Context Capture — ${BUG_ID}"
  echo "========================================"
  echo ""
  echo "  Output: $(realpath "$OUTPUT_DIR")"
  echo ""
  echo "  Captured: ${CAPTURED}"
  echo "  Failures: ${FAILURES}"
  echo "  Skipped:  ${SKIPPED}"
  echo ""

  if $API_HEALTH_OK && $CONNECTOR_STATUS_OK; then
    ok "Minimum viable capture: API health + connector status both succeeded."
  else
    fail "Minimum viable capture NOT met:"
    $API_HEALTH_OK || warn "  - API health: FAILED"
    $CONNECTOR_STATUS_OK || warn "  - Connector status: FAILED"
  fi

  echo ""
  echo "  Files:"
  for f in "$OUTPUT_DIR"/*; do
    [[ -f "$f" ]] || continue
    echo "    $(basename "$f")"
  done
  echo ""
  echo "========================================"
}

# ------------------------------------------------------------------
# Main — run captures sequentially
# ------------------------------------------------------------------
echo "=== SupportPlane Bug Context Capture ==="
echo ""
info "Bug ID:   ${BUG_ID}"
info "Timestamp: ${TIMESTAMP}"
info "Output:   $(realpath "$OUTPUT_DIR")"
info "API port: ${API_PORT}"
info "Web port: ${WEB_PORT}"
echo ""

# 1. API health (critical)
capture_api_health

# 2. Git state (always works locally)
capture_git_head

# 3. Pod status (may be skipped if kubectl missing)
capture_pod_status

# 4. Connector status (critical — requires auth)
capture_connector_status

# 5. Zammad context (requires auth)
capture_zammad_context

# 6. GLPI context (requires auth)
capture_glpi_context

# 7. API logs
capture_pod_logs "supportplane-api" "api"

# 8. Worker logs
capture_pod_logs "supportplane-worker" "worker"

# 9. No-secret scan
capture_no_secret_scan

# 10. Summary report
capture_report

# Print final summary
print_summary

# Exit code: 0 only if API health + connector status both succeeded
if $API_HEALTH_OK && $CONNECTOR_STATUS_OK; then
  exit 0
else
  exit 1
fi
