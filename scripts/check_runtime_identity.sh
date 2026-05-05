#!/usr/bin/env bash
# =============================================================================
# Runtime Identity Gate — BL-158
# Compares the running API /health HEAD to the local git HEAD.
# =============================================================================
set -euo pipefail

API_URL="${API_URL:-http://localhost:4110}"
ALLOW_DOCS_ONLY="${ALLOW_DOCS_ONLY:-false}"
DOCS_ONLY_COMMITS="${DOCS_ONLY_COMMITS:-}"

print_usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Options:
  --api-url URL         API base URL (default: http://localhost:4110)
  --allow-docs-only     Allow mismatch if all commits after runtime HEAD are docs-only
  --docs-only-commits   Comma-separated list of known docs-only commit hashes
  -h, --help            Show this help message

Exit codes:
  0  Runtime HEAD matches git HEAD (or docs-only exception accepted)
  1  Mismatch detected and not excepted
  2  API unreachable or response invalid
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-url)
      API_URL="$2"
      shift 2
      ;;
    --allow-docs-only)
      ALLOW_DOCS_ONLY="true"
      shift
      ;;
    --docs-only-commits)
      DOCS_ONLY_COMMITS="$2"
      shift 2
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      exit 2
      ;;
  esac
done

GIT_HEAD=$(git rev-parse HEAD)
HEALTH_URL="${API_URL}/health"

echo "=== Runtime Identity Gate ==="
echo "Git HEAD:     ${GIT_HEAD}"
echo "Health URL:   ${HEALTH_URL}"
echo ""

HEALTH_RESPONSE=$(curl -sf "${HEALTH_URL}" 2>/dev/null || echo "")

if [[ -z "${HEALTH_RESPONSE}" ]]; then
  echo "ERROR: API is unreachable at ${HEALTH_URL}"
  echo "       Runtime identity cannot be verified."
  echo "       Is the API running?"
  exit 2
fi

RUNTIME_HEAD=$(echo "${HEALTH_RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('head','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")
RUNTIME_BRANCH=$(echo "${HEALTH_RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('branch','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")

echo "Runtime HEAD: ${RUNTIME_HEAD}"
echo "Runtime branch: ${RUNTIME_BRANCH}"
echo ""

if [[ "${RUNTIME_HEAD}" == "UNKNOWN" ]]; then
  echo "ERROR: Could not extract 'head' from /health response"
  echo "       Response: ${HEALTH_RESPONSE}"
  exit 2
fi

if [[ "${RUNTIME_HEAD}" == "${GIT_HEAD}" ]]; then
  echo "PASS: Runtime HEAD matches git HEAD exactly."
  exit 0
fi

echo "MISMATCH: Runtime HEAD (${RUNTIME_HEAD}) != Git HEAD (${GIT_HEAD})"

if [[ "${ALLOW_DOCS_ONLY}" == "true" ]]; then
  echo ""
  echo "Docs-only exception requested. Checking commits between runtime HEAD and git HEAD..."

  if git merge-base --is-ancestor "${RUNTIME_HEAD}" "${GIT_HEAD}" 2>/dev/null; then
    COMMITS=$(git log --format=%H "${RUNTIME_HEAD}..${GIT_HEAD}")
    DOCS_ONLY_LIST=$(echo "${DOCS_ONLY_COMMITS}" | tr ',' '\n')

    ALL_DOCS_ONLY=true
    for commit in ${COMMITS}; do
      if echo "${DOCS_ONLY_LIST}" | grep -qx "${commit}"; then
        echo "  ${commit} — documented as docs-only"
        continue
      fi

      # Heuristic: if diff is only md/yaml/md files in docs/, it's docs-only
      CHANGED_FILES=$(git diff --name-only "${commit}^..${commit}" 2>/dev/null || echo "")
      NON_DOC_FILES=$(echo "${CHANGED_FILES}" | grep -vE '^(docs/|.*\.(md|yaml|yml)$)' || true)

      if [[ -z "${NON_DOC_FILES}" ]]; then
        echo "  ${commit} — heuristic docs-only (only docs/state files changed)"
      else
        echo "  ${commit} — CONTAINS NON-DOC FILES:"
        echo "${NON_DOC_FILES}" | sed 's/^/    /'
        ALL_DOCS_ONLY=false
      fi
    done

    if [[ "${ALL_DOCS_ONLY}" == "true" ]]; then
      echo ""
      echo "PASS: All commits after runtime HEAD are docs-only. Exception accepted."
      exit 0
    fi
  else
    echo "WARNING: Runtime HEAD is not an ancestor of git HEAD — cannot analyze."
  fi
fi

echo ""
echo "FAIL: Runtime identity mismatch. The running API does not match the current git HEAD."
echo "      Rebuild and redeploy to verify runtime identity."
exit 1
