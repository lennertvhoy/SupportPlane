#!/usr/bin/env bash
set -euo pipefail

echo "=== BL-113 Mailpit Notification Capture Verification ==="
echo

MAILPIT_API="${MAILPIT_API_URL:-http://localhost:8025/api/v1}"

echo "1. Mailpit messages:"
curl -s "${MAILPIT_API}/messages" | jq . 2>/dev/null || curl -s "${MAILPIT_API}/messages"

echo
echo "2. Mailpit info:"
curl -s "${MAILPIT_API}/info" | jq . 2>/dev/null || curl -s "${MAILPIT_API}/info"

echo
echo "=== Verification complete ==="
