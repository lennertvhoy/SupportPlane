#!/usr/bin/env bash
set -euo pipefail

# Trigger the GitHub Actions Windows Endpoint Verification workflow.
#
# This proves BL-133: the endpoint agent builds, registers, heartbeats,
# and runs diagnostics on a real Windows runner.
#
# PREREQUISITES:
#   - gh CLI authenticated (gh auth status)
#   - Workflow pushed to default branch on GitHub
#   - A SupportPlane API accessible from the internet (GitHub Actions cannot
#     reach localhost/Kind/Podman clusters)
#   - Valid tenantId and enrollmentToken for the SupportPlane instance
#
# Usage:
#   export SUPPORTPLANE_TENANT_ID="dev-tenant"
#   export SUPPORTPLANE_ENROLLMENT_TOKEN="your-enrollment-token"
#   export SUPPORTPLANE_API_URL="https://api.supportplane.example.com"
#   bash scripts/trigger_windows_verification.sh

WORKFLOW_NAME="windows-endpoint-verification.yml"

echo "=== SupportPlane Windows Endpoint Verification — Workflow Trigger ==="
echo ""

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
  echo "The workflow cannot be triggered until these are provided."
  echo "A real Windows runner (windows-latest via GitHub Actions or a manual"
  echo "Windows host) plus a reachable SupportPlane API with a valid enrollment"
  echo "token are required for BL-133 acceptance."
  echo ""
  echo "For manual verification on a real Windows host, see:"
  echo "  docs/WINDOWS_ENDPOINT_VERIFICATION_RUNBOOK.md"
  exit 1
fi

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

echo "Triggering workflow: $WORKFLOW_NAME"
echo "  Tenant:   $SUPPORTPLANE_TENANT_ID"
echo "  API URL:  $SUPPORTPLANE_API_URL"
echo ""

gh workflow run "$WORKFLOW_NAME" \
  --ref main \
  -f tenantId="$SUPPORTPLANE_TENANT_ID" \
  -f enrollmentToken="$SUPPORTPLANE_ENROLLMENT_TOKEN" \
  -f apiUrl="$SUPPORTPLANE_API_URL"

echo ""
echo "Workflow triggered. Monitor at:"
echo "  gh run list --workflow='$WORKFLOW_NAME' --limit 5"
echo ""
echo "BL-133 requires this workflow to complete successfully on a real"
echo "Windows runner with a live SupportPlane API."
