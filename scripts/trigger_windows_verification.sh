#!/usr/bin/env bash
set -euo pipefail

# Trigger the GitHub Actions Windows Endpoint Verification workflow.
#
# This proves BL-130/131/133: the endpoint agent builds, registers, heartbeats,
# and runs diagnostics on a real Windows runner.
#
# PREREQUISITES:
#   - gh CLI authenticated with workflow scope (gh auth status)
#   - Workflow committed and pushed to GitHub default branch
#   - A SupportPlane API reachable from the public internet
#   - A valid enrollment token for the SupportPlane instance
#
# REACHABILITY OPTIONS:
#   Option A — Tailscale Funnel (temporary, recommended):
#     1. Start K8s port-forward: kubectl port-forward -n supportplane-app svc/supportplane-api 4210:4110 &
#     2. Start funnel: tailscale funnel 4210
#     3. Set SUPPORTPLANE_API_URL="https://<your-node>.tail2dc90.ts.net"
#
#   Option B — Self-hosted runner on same network (no public exposure needed)
#   Option C — Public deployment (production path, do not use for dev/demo)
#
# Usage:
#   # Set required env vars
#   export SUPPORTPLANE_TENANT_ID="dev-tenant"
#   export SUPPORTPLANE_ENROLLMENT_TOKEN="<your-token>"
#   export SUPPORTPLANE_API_URL="https://ff-fedora.tail2dc90.ts.net"
#   bash scripts/trigger_windows_verification.sh [--dry-run] [--monitor]
#
#   --dry-run   Validate preflight but do not trigger
#   --monitor   After triggering, poll for completion (up to 20 min)

WORKFLOW_NAME="windows-endpoint-verification.yml"
DRY_RUN=false
MONITOR=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --monitor) MONITOR=true ;;
    --help|-h)
      echo "Usage: bash scripts/trigger_windows_verification.sh [--dry-run] [--monitor]"
      echo ""
      echo "Triggers the GitHub Actions Windows Endpoint Verification workflow."
      echo ""
      echo "Options:"
      echo "  --dry-run   Validate preflight but do not trigger"
      echo "  --monitor   After triggering, poll for completion (up to 20 min)"
      echo ""
      echo "Required environment variables:"
      echo "  SUPPORTPLANE_TENANT_ID          Tenant ID (e.g. dev-tenant)"
      echo "  SUPPORTPLANE_ENROLLMENT_TOKEN   Enrollment token for the endpoint agent"
      echo "  SUPPORTPLANE_API_URL            Publicly reachable SupportPlane API URL"
      exit 0
      ;;
  esac
done

echo "=== SupportPlane Windows Endpoint Verification — Workflow Trigger ==="
echo ""

# Preflight: check required env vars
REQUIRED_VARS=("SUPPORTPLANE_TENANT_ID" "SUPPORTPLANE_ENROLLMENT_TOKEN" "SUPPORTPLANE_API_URL")
MISSING=()
for VAR in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!VAR:-}" ]]; then
    MISSING+=("$VAR")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "BLOCKED: Required environment variables are not set:"
  for VAR in "${MISSING[@]}"; do
    echo "  - $VAR"
  done
  echo ""
  echo "HOW TO UNBLOCK (option A — Tailscale Funnel, recommended for dev/demo):"
  echo "  1. Start K8s port-forward:"
  echo "     kubectl port-forward -n supportplane-app svc/supportplane-api 4210:4110 &"
  echo "  2. Start Tailscale Funnel:"
  echo "     tailscale funnel 4210"
  echo "  3. Verify:"
  echo "     curl https://<your-node>.tail2dc90.ts.net/health"
  echo "  4. Set env:"
  echo "     export SUPPORTPLANE_API_URL='https://<your-node>.tail2dc90.ts.net'"
  echo "  5. Rerun this script."
  echo ""
  echo "HOW TO UNBLOCK (option B — self-hosted Windows runner):"
  echo "  1. Register a self-hosted GitHub Actions runner on your Windows host"
  echo "     that has network access to the SupportPlane API."
  echo "  2. Update workflow to use runs-on: self-hosted"
  echo ""
  echo "For manual verification on a real Windows host, see:"
  echo "  docs/WINDOWS_ENDPOINT_VERIFICATION_RUNBOOK.md"
  echo ""
  echo "To create a demo enrollment token:"
  echo "  bash scripts/create_demo_endpoint_enrollment_token.sh"
  exit 1
fi

# Preflight: check gh CLI
if ! command -v gh &>/dev/null; then
  echo "BLOCKED: gh CLI is not installed."
  echo "Install: https://cli.github.com/"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "BLOCKED: gh CLI is not authenticated."
  echo "Run: gh auth login"
  exit 1
fi

# Preflight: check API reachability
echo "Preflight: checking API health..."
if ! curl -sf -o /dev/null --max-time 10 "${SUPPORTPLANE_API_URL}/health" 2>/dev/null; then
  echo "BLOCKED: SupportPlane API is not reachable at ${SUPPORTPLANE_API_URL}/health"
  echo ""
  echo "GitHub Actions runners cannot reach localhost or private networks."
  echo "The API must be accessible from the public internet."
  echo ""
  echo "Current options:"
  echo "  - Tailscale Funnel: tailscale funnel 4210"
  echo "  - Public deployment"
  echo "  - Self-hosted runner on same network"
  exit 1
fi
echo "Preflight: API health OK at ${SUPPORTPLANE_API_URL}"

# Preflight: check workflow file exists
if [[ ! -f ".github/workflows/${WORKFLOW_NAME}" ]]; then
  echo "BLOCKED: Workflow file .github/workflows/${WORKFLOW_NAME} not found."
  exit 1
fi

echo ""
echo "Triggering workflow: $WORKFLOW_NAME"
echo "  Tenant ID: $SUPPORTPLANE_TENANT_ID"
echo "  API URL:   $SUPPORTPLANE_API_URL"
echo "  Token:     [REDACTED — ${#SUPPORTPLANE_ENROLLMENT_TOKEN} chars, prefix ${SUPPORTPLANE_ENROLLMENT_TOKEN:0:8}...]"
echo ""

if $DRY_RUN; then
  echo "DRY RUN — workflow NOT triggered. All preflight checks passed."
  exit 0
fi

gh workflow run "$WORKFLOW_NAME" \
  --ref main \
  -f tenantId="$SUPPORTPLANE_TENANT_ID" \
  -f enrollmentToken="$SUPPORTPLANE_ENROLLMENT_TOKEN" \
  -f apiUrl="$SUPPORTPLANE_API_URL"

echo ""
echo "Workflow triggered."
echo "Monitor with:"
echo "  gh run list --workflow='$WORKFLOW_NAME' --limit 5"
echo ""

if $MONITOR; then
  echo "Monitoring workflow run (polling every 30s, max 20 min)..."
  MAX_ATTEMPTS=40
  ATTEMPT=0
  while [[ $ATTEMPT -lt $MAX_ATTEMPTS ]]; do
    sleep 30
    ATTEMPT=$((ATTEMPT + 1))
    STATUS=$(gh run list --workflow="$WORKFLOW_NAME" --limit 1 --json status,conclusion -q '.[0] | "\(.status) \(.conclusion)"' 2>/dev/null || echo "unknown unknown")
    echo "[$(date +%H:%M:%S)] Attempt $ATTEMPT/$MAX_ATTEMPTS — $STATUS"
    if [[ "$STATUS" == *"completed"* ]]; then
      echo "Workflow completed. Conclusion: $STATUS"
      gh run view --workflow="$WORKFLOW_NAME" --log 2>/dev/null | tail -40
      break
    fi
  done
  if [[ $ATTEMPT -ge $MAX_ATTEMPTS ]]; then
    echo "Monitoring timed out. Check manually:"
    echo "  gh run list --workflow='$WORKFLOW_NAME' --limit 5"
  fi
fi

echo ""
echo "BL-130/131/133 require this workflow to complete successfully on a"
echo "real Windows runner with a live SupportPlane API for acceptance."
