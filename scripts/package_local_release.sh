#!/usr/bin/env bash
set -euo pipefail

# SupportPlane Local Sandbox Release Packaging
# BL-090 — Release Packaging
#
# Defaults to dry-run. Use --confirm for actual packaging.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DRY_RUN=true
CONFIRM=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --confirm) CONFIRM=true ;;
  esac
done

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
RELEASE_DIR="${REPO_ROOT}/release/supportplane-local-sandbox-${TIMESTAMP}"
ARCHIVE="${REPO_ROOT}/release/supportplane-local-sandbox-${TIMESTAMP}.tar.gz"

log_info() { echo "[INFO] $*"; }
log_warn() { echo "[WARN] $*" >&2; }
log_dry()  { echo "[DRY-RUN] $*"; }

# ------------------------------------------------------------------
# Banner
# ------------------------------------------------------------------

echo "=== SupportPlane Local Sandbox Release Packaging ==="
echo "Timestamp: ${TIMESTAMP}"

if [[ "$DRY_RUN" == true && "$CONFIRM" != true ]]; then
  echo ""
  echo "Running in DRY-RUN mode. No files will be created."
  echo "Use --confirm to create the actual release package."
  echo ""
fi

# ------------------------------------------------------------------
# Gather metadata
# ------------------------------------------------------------------

GIT_COMMIT="$(git -C "${REPO_ROOT}" rev-parse HEAD 2>/dev/null || echo 'unknown')"
GIT_BRANCH="$(git -C "${REPO_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"

log_info "Git commit: ${GIT_COMMIT}"
log_info "Git branch: ${GIT_BRANCH}"

# Image tags from k8s deployments (if cluster is reachable)
API_IMAGE="unknown"
WEB_IMAGE="unknown"
WORKER_IMAGE="unknown"
if command -v kubectl >/dev/null 2>&1; then
  API_IMAGE="$(kubectl get deployment supportplane-api -n supportplane-app -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo 'unknown')"
  WEB_IMAGE="$(kubectl get deployment supportplane-web -n supportplane-app -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo 'unknown')"
  WORKER_IMAGE="$(kubectl get deployment supportplane-worker -n supportplane-app -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo 'unknown')"
fi

log_info "API image: ${API_IMAGE}"
log_info "Web image: ${WEB_IMAGE}"
log_info "Worker image: ${WORKER_IMAGE}"

# ------------------------------------------------------------------
# Dry-run output
# ------------------------------------------------------------------

if [[ "$DRY_RUN" == true && "$CONFIRM" != true ]]; then
  log_dry "Would create release directory: ${RELEASE_DIR}"
  log_dry "Would write:"
  log_dry "  - release/commit.txt"
  log_dry "  - release/images.txt"
  log_dry "  - release/manifests.tar.gz (from infra/kubernetes/local-podman/)"
  log_dry "  - release/VERIFICATION.md"
  log_dry "  - release/WARNING.txt"
  log_dry "  - release/README.md (copy)"
  log_dry "  - release/docs/RELEASE_RUNBOOK.md (copy)"
  log_dry "  - release/docs/DEMO_RUNBOOK.md (copy)"
  log_dry "  - release/docs/RUNBOOK_BACKUP_RESTORE.md (copy)"
  log_dry "Would create archive: ${ARCHIVE}"
  log_dry "Would clean up release directory after archiving"
  echo ""
  echo "DRY-RUN complete. No files were created."
  exit 0
fi

# ------------------------------------------------------------------
# Actual packaging
# ------------------------------------------------------------------

if [[ "$CONFIRM" != true ]]; then
  log_warn "Use --confirm to create the actual release package."
  exit 1
fi

mkdir -p "${RELEASE_DIR}/docs"

# Commit and branch
cat > "${RELEASE_DIR}/commit.txt" <<EOF
Git commit: ${GIT_COMMIT}
Git branch: ${GIT_BRANCH}
Built at: ${TIMESTAMP}
EOF

# Images
cat > "${RELEASE_DIR}/images.txt" <<EOF
supportplane-api: ${API_IMAGE}
supportplane-web: ${WEB_IMAGE}
supportplane-worker: ${WORKER_IMAGE}
EOF

# Manifests tarball
tar -czf "${RELEASE_DIR}/manifests.tar.gz" -C "${REPO_ROOT}" infra/kubernetes/local-podman/

# Verification commands
cat > "${RELEASE_DIR}/VERIFICATION.md" <<'EOF'
# Post-Deploy Verification Checklist

## Cluster
1. kubectl config current-context == kind-supportplane-local
2. kubectl get pods -A — all Running/Ready
3. kubectl get pvc -A — all Bound

## SupportPlane App
4. curl http://localhost:4210/health — returns ok
5. curl http://localhost:4210/health — authMode == local, storeMode == postgres
6. curl http://localhost:3300/ — returns HTML

## Self-Hosted Services
7. Zammad: curl http://localhost:8080/api/v1/getting_started
8. OpenBao: curl http://localhost:8200/v1/sys/health
9. NATS: nats stream info SUPPORTPLANE_OUTBOX
10. Mailpit: curl http://localhost:8025/api/v1/messages
11. MinIO: mc ls local/supportplane-evidence
12. Ollama: curl http://10.88.0.1:11435/api/tags

## Safety
13. No production claims in UI
14. Writeback blocked by default
15. No raw secrets in API responses
EOF

# Non-production warning
cat > "${RELEASE_DIR}/WARNING.txt" <<'EOF'
╔══════════════════════════════════════════════════════════════════╗
║  NON-PRODUCTION LOCAL SANDBOX ONLY                              ║
║                                                                  ║
║  This release package is intended for local development and     ║
║  demonstration on a single-machine Kind/Podman cluster.         ║
║                                                                  ║
║  NOT PRODUCTION HARDENED:                                       ║
║  - No production authentication (local auth / OIDC hooks only)  ║
║  - No production secrets management                             ║
║  - No production network egress controls                        ║
║  - No production monitoring or alerting                         ║
║  - No compliance certification                                  ║
║  - No backup/restore SLA                                        ║
║                                                                  ║
║  Do not deploy this package to a production environment.        ║
╚══════════════════════════════════════════════════════════════════╝
EOF

# Copy docs
cp "${REPO_ROOT}/README.md" "${RELEASE_DIR}/README.md"
cp "${REPO_ROOT}/docs/RELEASE_RUNBOOK.md" "${RELEASE_DIR}/docs/RELEASE_RUNBOOK.md"
cp "${REPO_ROOT}/docs/DEMO_RUNBOOK.md" "${RELEASE_DIR}/docs/DEMO_RUNBOOK.md"
cp "${REPO_ROOT}/docs/RUNBOOK_BACKUP_RESTORE.md" "${RELEASE_DIR}/docs/RUNBOOK_BACKUP_RESTORE.md"

# Create archive
mkdir -p "${REPO_ROOT}/release"
tar -czf "${ARCHIVE}" -C "${REPO_ROOT}/release" "$(basename "${RELEASE_DIR}")"

# Clean up directory, keep archive
rm -rf "${RELEASE_DIR}"

log_info "Release package created: ${ARCHIVE}"
echo ""
echo "=== Release packaging complete ==="
echo "Archive: ${ARCHIVE}"
echo "Contents: commit, images, manifests, docs, verification checklist, warning"
