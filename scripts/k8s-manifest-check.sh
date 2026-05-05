#!/usr/bin/env bash
# =============================================================================
# Kubernetes Manifest Check Script — BL-155
# Validates K8s manifests with kubectl dry-run and basic YAML checks.
# If kube-linter, checkov, or kube-score are available, runs them too.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-.}"
MANIFEST_DIR="${MANIFEST_DIR:-${REPO_ROOT}/infra/kubernetes/local-podman}"

print_usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Options:
  --output-dir PATH     Directory to write reports (default: .)
  --manifest-dir PATH   Directory with K8s manifests (default: infra/kubernetes/local-podman)
  -h, --help            Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --manifest-dir)
      MANIFEST_DIR="$2"
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

mkdir -p "${OUTPUT_DIR}"

echo "=== Kubernetes Manifest Check ==="
echo "Manifest dir: ${MANIFEST_DIR}"
echo "Output: ${OUTPUT_DIR}"
echo ""

ERRORS=0
WARNINGS=0

# Basic YAML validity check
echo "--- YAML syntax validation ---"
if command -v python3 &>/dev/null; then
  python3 -c "
import yaml, sys, os
errors = 0
for root, dirs, files in os.walk('${MANIFEST_DIR}'):
    for f in files:
        if f.endswith(('.yaml', '.yml')):
            path = os.path.join(root, f)
            try:
                with open(path) as fh:
                    list(yaml.safe_load_all(fh))
            except Exception as e:
                print(f'ERROR: {path}: {e}')
                errors += 1
            else:
                print(f'OK:   {path}')
print(f'YAML errors: {errors}')
sys.exit(0 if errors == 0 else 1)
" > "${OUTPUT_DIR}/k8s-yaml-check.txt" 2>&1 || ERRORS=$((ERRORS + 1))
else
  echo "WARNING: python3 not available for YAML validation."
  WARNINGS=$((WARNINGS + 1))
fi

# kubectl dry-run if cluster is available
if command -v kubectl &>/dev/null && kubectl cluster-info &>/dev/null 2>&1; then
  echo ""
  echo "--- kubectl dry-run=server ---"
  if kubectl apply -k "${MANIFEST_DIR}" --dry-run=server > "${OUTPUT_DIR}/k8s-dry-run.txt" 2>&1; then
    echo "PASS: kubectl dry-run=server succeeded."
  else
    echo "NOTICE: kubectl dry-run=server reported issues. See ${OUTPUT_DIR}/k8s-dry-run.txt"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo ""
  echo "--- kubectl dry-run=server ---"
  echo "SKIP: kubectl not available or cluster not reachable."
  echo "      K8s manifest validation is limited to YAML syntax."
  echo "      Full validation requires a running cluster or kube-linter."
  WARNINGS=$((WARNINGS + 1))
fi

# Optional tools
echo ""
echo "--- Optional tool scan ---"

if command -v kube-linter &>/dev/null; then
  echo "Running kube-linter..."
  kube-linter lint "${MANIFEST_DIR}" --format json > "${OUTPUT_DIR}/k8s-kube-linter.json" 2>&1 || true
  echo "kube-linter results: ${OUTPUT_DIR}/k8s-kube-linter.json"
else
  echo "SKIP: kube-linter not installed."
fi

if command -v checkov &>/dev/null; then
  echo "Running checkov..."
  checkov -d "${MANIFEST_DIR}" --framework kubernetes --output json > "${OUTPUT_DIR}/k8s-checkov.json" 2>&1 || true
  echo "checkov results: ${OUTPUT_DIR}/k8s-checkov.json"
else
  echo "SKIP: checkov not installed."
fi

if command -v kube-score &>/dev/null; then
  echo "Running kube-score..."
  kube-score score "${MANIFEST_DIR}" > "${OUTPUT_DIR}/k8s-kube-score.txt" 2>&1 || true
  echo "kube-score results: ${OUTPUT_DIR}/k8s-kube-score.txt"
else
  echo "SKIP: kube-score not installed."
fi

echo ""
if [[ "${ERRORS}" -gt 0 ]]; then
  echo "FAIL: ${ERRORS} error(s), ${WARNINGS} warning(s)."
  exit 1
else
  echo "PASS: ${WARNINGS} warning(s), 0 errors."
  exit 0
fi
