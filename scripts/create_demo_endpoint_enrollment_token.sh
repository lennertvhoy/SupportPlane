#!/usr/bin/env bash
set -euo pipefail

# Create a demo enrollment token for the SupportPlane endpoint agent.
# This is a dev-only script. The token is scoped to dev-tenant only and
# is short-lived (revocable by changing SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN
# env var and restarting the API).
#
# SAFETY:
#   - Token is for dev/demo tenant only.
#   - Token is never printed raw to stdout by default.
#   - Token is NOT committed to git (gitignored env file).
#   - Token can be revoked by changing the env var and restarting API.
#
# Usage:
#   bash scripts/create_demo_endpoint_enrollment_token.sh [--print-token] [--apply]
#
#   --print-token   Print the full raw token (use only in secure context)
#   --apply         Set the token via kubectl set env on the API deployment
#
# Default: print redacted preview and next-steps instructions.

TOKEN="${SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN:-}"
PRINT_TOKEN=false
APPLY=false

for arg in "$@"; do
  case "$arg" in
    --print-token) PRINT_TOKEN=true ;;
    --apply) APPLY=true ;;
    --help|-h)
      echo "Usage: bash scripts/create_demo_endpoint_enrollment_token.sh [--print-token] [--apply]"
      echo ""
      echo "Creates (or reuses) a demo enrollment token for the endpoint agent."
      echo ""
      echo "Options:"
      echo "  --print-token  Print the full raw token (only in secure contexts)"
      echo "  --apply        Apply the token to the K8s API deployment"
      echo ""
      echo "Environment:"
      echo "  SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN  Existing token to use"
      exit 0
      ;;
  esac
done

echo "=== SupportPlane Demo Enrollment Token ==="
echo ""

# Generate a random token if none provided
if [[ -z "$TOKEN" ]]; then
  TOKEN="sp-demo-$(openssl rand -hex 24 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(24))")"
  echo "Generated new demo enrollment token."
else
  echo "Using existing SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN from environment."
fi
echo ""

# Redacted preview
TOKEN_PREFIX="${TOKEN:0:12}"
echo "Token (redacted): ${TOKEN_PREFIX}... (${#TOKEN} chars)"
echo ""

if $PRINT_TOKEN; then
  echo "FULL TOKEN: $TOKEN"
  echo ""
fi

if $APPLY; then
  echo "Applying token to K8s API deployment..."
  if ! kubectl get deployment supportplane-api -n supportplane-app &>/dev/null; then
    echo "ERROR: K8s API deployment not found. Is the cluster running?"
    exit 1
  fi
  kubectl set env deployment/supportplane-api -n supportplane-app \
    "SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN=${TOKEN}"
  echo "Token applied. API pod will restart."
  echo ""
  echo "Verify with:"
  echo "  kubectl get pods -n supportplane-app -w"
  echo "  curl -s https://<api-url>/health"
fi

echo "=== Next Steps ==="
echo ""
echo "1. Set the token in the API environment:"
echo "   export SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN='<token>'"
echo "   or run this script with --apply"
echo ""
echo "2. Use the token with the endpoint agent:"
echo "   export SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN='<token>'"
echo "   export SUPPORTPLANE_API_URL='https://<api-url>'"
echo "   export SUPPORTPLANE_ENDPOINT_TENANT_ID='dev-tenant'"
echo "   node dist/src/index.js --register"
echo ""
echo "3. For GitHub Actions, add as a secret:"
echo "   gh secret set SUPPORTPLANE_ENROLLMENT_TOKEN --body '<token>'"
echo ""
echo "4. Revoke the token by changing SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN"
echo "   and restarting the API."
echo ""
echo "Security notes:"
echo "  - This is a dev/demo token only."
echo "  - Do not commit the raw token to git."
echo "  - Do not print the raw token in logs or evidence."
echo "  - Token is scoped to dev-tenant enrollment only."
