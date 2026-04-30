#!/usr/bin/env bash
set -euo pipefail

# SupportPlane Local Sandbox Backup
# BL-087 — Backup/Restore
#
# Defaults to dry-run. Use --confirm for an actual backup.
# Never prints raw secrets.

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
BACKUP_DIR="${REPO_ROOT}/backups/supportplane-sandbox-${TIMESTAMP}"

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

log_info() { echo "[INFO] $*"; }
log_warn() { echo "[WARN] $*" >&2; }
log_dry()  { echo "[DRY-RUN] $*"; }

require_cmd() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    log_warn "Required command not found: $name"
    return 1
  fi
}

# Redact secret-looking values from kubectl output using python
redact_secrets() {
  python3 -c '
import re, sys
pattern = re.compile(
    r"(password|token|secret|key|cert|ami-password|root-password|root-token|db-password|admin-password|POSTGRESQL_PASS|OPENBAO_TOKEN|SUPPORTPLANE_INTERNAL_SERVICE_TOKEN|SUPPORTPLANE_WORKER_PASSWORD|MINIO_SECRET_KEY|MINIO_ROOT_PASSWORD)(\s*[:=]\s*[\"\x27]?)[^\"\x27 \n]+",
    re.IGNORECASE
)
for line in sys.stdin:
    sys.stdout.write(pattern.sub(r"\1\2[REDACTED]", line))
'
}

# Extract a value from a Kubernetes Secret without printing it to stdout
k8s_secret_value() {
  local ns="$1"
  local name="$2"
  local key="$3"
  kubectl get secret -n "$ns" "$name" -o jsonpath="{.data.${key}}" 2>/dev/null | base64 -d 2>/dev/null || true
}

# ------------------------------------------------------------------
# Banner
# ------------------------------------------------------------------

echo "=== SupportPlane Local Sandbox Backup ==="
echo "Timestamp: ${TIMESTAMP}"
if [[ "$DRY_RUN" == true ]]; then
  echo "Mode: DRY-RUN (no files will be written)"
else
  echo "Mode: LIVE backup"
fi
echo ""

if [[ "$DRY_RUN" == true ]]; then
  log_dry "Would create backup directory: ${BACKUP_DIR}"
else
  mkdir -p "${BACKUP_DIR}"
  log_info "Backup directory created: ${BACKUP_DIR}"
fi

# ------------------------------------------------------------------
# 1. Git commit hash
# ------------------------------------------------------------------
GIT_HEAD="$(git -C "${REPO_ROOT}" rev-parse HEAD 2>/dev/null || echo 'unknown')"
GIT_BRANCH="$(git -C "${REPO_ROOT}" branch --show-current 2>/dev/null || echo 'unknown')"
log_info "Git HEAD: ${GIT_HEAD} (${GIT_BRANCH})"

if [[ "$DRY_RUN" == true ]]; then
  log_dry "Would write git metadata to ${BACKUP_DIR}/git-info.txt"
else
  {
    echo "commit=${GIT_HEAD}"
    echo "branch=${GIT_BRANCH}"
    echo "timestamp=${TIMESTAMP}"
  } > "${BACKUP_DIR}/git-info.txt"
fi

# ------------------------------------------------------------------
# 2. Image tags from deployments
# ------------------------------------------------------------------
log_info "Collecting image tags from deployments..."
if command -v kubectl >/dev/null 2>&1; then
  CURRENT_CTX="$(kubectl config current-context 2>/dev/null || echo 'none')"
  log_info "Current kubectl context: ${CURRENT_CTX}"

  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Would run: kubectl get deployments --all-namespaces -o jsonpath for image tags"
    log_dry "Would write image list to ${BACKUP_DIR}/images.txt"
  else
    kubectl get deployments --all-namespaces -o jsonpath='{range .items[*]}{.metadata.namespace}{" "}{.metadata.name}{" "}{range .spec.template.spec.containers[*]}{.image}{"\n"}{end}{end}' 2>/dev/null > "${BACKUP_DIR}/images.txt" || true
    log_info "Wrote image tags to ${BACKUP_DIR}/images.txt"
  fi
else
  log_warn "kubectl not found; skipping image tag collection."
fi

# ------------------------------------------------------------------
# 3. SupportPlane PostgreSQL backup via pg_dump
# ------------------------------------------------------------------

# Try to resolve DATABASE_URL from env, then from k8s secret
DATABASE_URL="${DATABASE_URL:-}"
if [[ -z "$DATABASE_URL" ]] && command -v kubectl >/dev/null 2>&1; then
  DB_URL_SECRET="$(k8s_secret_value supportplane-data postgres-secret password 2>/dev/null || true)"
  if [[ -n "$DB_URL_SECRET" ]]; then
    DATABASE_URL="postgresql://supportplane:${DB_URL_SECRET}@localhost:5434/supportplane?schema=public"
  fi
fi

if [[ -z "$DATABASE_URL" ]]; then
  log_warn "DATABASE_URL not set and could not be resolved from Kubernetes secret."
  log_warn "Skipping SupportPlane PostgreSQL backup."
else
  DB_URL_REDACTED="${DATABASE_URL//:*@/:***@}"
  log_info "SupportPlane DATABASE_URL resolved (redacted): ${DB_URL_REDACTED}"

  if command -v pg_dump >/dev/null 2>&1; then
    SP_DUMP="${BACKUP_DIR}/supportplane-db.sql"
    if [[ "$DRY_RUN" == true ]]; then
      log_dry "Would run: pg_dump --no-password --clean --if-exists --file=${SP_DUMP}"
      log_dry "  (connection string redacted)"
    else
      # Use PGPASSWORD env to avoid password in process list
      export PGPASSWORD="$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')"
      pg_dump --no-password --clean --if-exists \
        --host="$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')" \
        --port="$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')" \
        --username="$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')" \
        --dbname="$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')" \
        --file="${SP_DUMP}" 2>/dev/null || log_warn "pg_dump failed for SupportPlane DB"
      unset PGPASSWORD
      log_info "Wrote SupportPlane DB dump to ${SP_DUMP}"
    fi
  else
    log_warn "pg_dump not found; skipping SupportPlane PostgreSQL backup."
    if [[ "$DRY_RUN" == true ]]; then
      log_dry "Would have run pg_dump for SupportPlane DB if pg_dump were installed."
    fi
  fi
fi

# ------------------------------------------------------------------
# 4. Zammad PostgreSQL backup via pg_dump (if feasible)
# ------------------------------------------------------------------

ZAMMAD_DB_PASSWORD=""
ZAMMAD_DB_HOST="localhost"
ZAMMAD_DB_PORT="5434"
ZAMMAD_DB_USER="zammad"
ZAMMAD_DB_NAME="zammad"

if command -v kubectl >/dev/null 2>&1; then
  ZAMMAD_DB_PASSWORD="$(k8s_secret_value supportplane-integrations zammad-postgres password 2>/dev/null || true)"
fi

if [[ -z "$ZAMMAD_DB_PASSWORD" ]] && [[ -n "${ZAMMAD_POSTGRES_PASSWORD:-}" ]]; then
  ZAMMAD_DB_PASSWORD="${ZAMMAD_POSTGRES_PASSWORD}"
fi

if [[ -n "$ZAMMAD_DB_PASSWORD" ]]; then
  log_info "Zammad PostgreSQL credentials resolved from Kubernetes secret."
  if command -v pg_dump >/dev/null 2>&1; then
    ZAMMAD_DUMP="${BACKUP_DIR}/zammad-db.sql"
    if [[ "$DRY_RUN" == true ]]; then
      log_dry "Would run: pg_dump --no-password --clean --if-exists for Zammad DB"
      log_dry "  host=${ZAMMAD_DB_HOST} port=${ZAMMAD_DB_PORT} user=${ZAMMAD_DB_USER} db=${ZAMMAD_DB_NAME}"
    else
      export PGPASSWORD="$ZAMMAD_DB_PASSWORD"
      pg_dump --no-password --clean --if-exists \
        --host="$ZAMMAD_DB_HOST" \
        --port="$ZAMMAD_DB_PORT" \
        --username="$ZAMMAD_DB_USER" \
        --dbname="$ZAMMAD_DB_NAME" \
        --file="${ZAMMAD_DUMP}" 2>/dev/null || log_warn "pg_dump failed for Zammad DB"
      unset PGPASSWORD
      log_info "Wrote Zammad DB dump to ${ZAMMAD_DUMP}"
    fi
  else
    log_warn "pg_dump not found; skipping Zammad PostgreSQL backup."
    if [[ "$DRY_RUN" == true ]]; then
      log_dry "Would have run pg_dump for Zammad DB if pg_dump were installed."
    fi
  fi
else
  log_warn "Zammad PostgreSQL credentials not resolvable from k8s secret or env. Skipping Zammad backup."
fi

# ------------------------------------------------------------------
# 5. MinIO evidence bucket manifest
# ------------------------------------------------------------------

MINIO_ENDPOINT="${MINIO_ENDPOINT:-localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-}"
if [[ -z "$MINIO_SECRET_KEY" ]] && command -v kubectl >/dev/null 2>&1; then
  MINIO_SECRET_KEY="$(k8s_secret_value supportplane-data minio-local-dev root-password 2>/dev/null || true)"
fi

if command -v mc >/dev/null 2>&1; then
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Would run: mc ls alias/supportplane-evidence/"
    log_dry "Would write manifest to ${BACKUP_DIR}/minio-manifest.txt"
  else
    export MC_HOST_supportplane="https://${MINIO_ACCESS_KEY}:${MINIO_SECRET_KEY}@${MINIO_ENDPOINT}"
    mc ls supportplane/supportplane-evidence/ > "${BACKUP_DIR}/minio-manifest.txt" 2>/dev/null || log_warn "mc ls failed for MinIO bucket"
    unset MC_HOST_supportplane
    log_info "Wrote MinIO manifest to ${BACKUP_DIR}/minio-manifest.txt"
  fi
elif command -v aws >/dev/null 2>&1; then
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Would run: aws s3 ls s3://supportplane-evidence --endpoint-url ..."
    log_dry "Would write manifest to ${BACKUP_DIR}/minio-manifest.txt"
  else
    AWS_ACCESS_KEY_ID="$MINIO_ACCESS_KEY" \
    AWS_SECRET_ACCESS_KEY="$MINIO_SECRET_KEY" \
    aws s3 ls s3://supportplane-evidence \
      --endpoint-url "http://${MINIO_ENDPOINT}" \
      --no-verify-ssl > "${BACKUP_DIR}/minio-manifest.txt" 2>/dev/null || log_warn "aws s3 ls failed for MinIO bucket"
    log_info "Wrote MinIO manifest to ${BACKUP_DIR}/minio-manifest.txt"
  fi
else
  log_warn "Neither 'mc' nor 'aws' CLI found. Skipping MinIO manifest backup."
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Would have listed MinIO bucket 'supportplane-evidence' if mc/aws were installed."
  fi
fi

# ------------------------------------------------------------------
# 6. Kubernetes ConfigMaps (redacted)
# ------------------------------------------------------------------

if command -v kubectl >/dev/null 2>&1; then
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Would run: kubectl get configmaps --all-namespaces -o yaml | redact_secrets"
    log_dry "Would write to ${BACKUP_DIR}/configmaps-redacted.yaml"
  else
    kubectl get configmaps --all-namespaces -o yaml 2>/dev/null | redact_secrets > "${BACKUP_DIR}/configmaps-redacted.yaml" || true
    log_info "Wrote redacted ConfigMaps to ${BACKUP_DIR}/configmaps-redacted.yaml"
  fi
else
  log_warn "kubectl not found; skipping ConfigMap backup."
fi

# ------------------------------------------------------------------
# 7. Acceptance freeze references
# ------------------------------------------------------------------

ACCEPTANCE_FREEZES_FILE="${REPO_ROOT}/docs/ACCEPTANCE_FREEZES.md"
if [[ -f "$ACCEPTANCE_FREEZES_FILE" ]]; then
  FREEZE_COUNT="$(grep -c '^## AF-' "$ACCEPTANCE_FREEZES_FILE" 2>/dev/null || echo 0)"
  log_info "Acceptance freezes found: ${FREEZE_COUNT}"
  if [[ "$DRY_RUN" == true ]]; then
    log_dry "Would list acceptance freeze headers from docs/ACCEPTANCE_FREEZES.md"
    log_dry "Would write to ${BACKUP_DIR}/acceptance-freezes.txt"
  else
    grep '^## AF-' "$ACCEPTANCE_FREEZES_FILE" > "${BACKUP_DIR}/acceptance-freezes.txt" 2>/dev/null || true
    log_info "Wrote acceptance freeze references to ${BACKUP_DIR}/acceptance-freezes.txt"
  fi
else
  log_warn "docs/ACCEPTANCE_FREEZES.md not found."
fi

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------

echo ""
echo "=== Backup Summary ==="
if [[ "$DRY_RUN" == true ]]; then
  echo "Mode: DRY-RUN — no files were written."
  echo "To perform a real backup, run with: --confirm"
else
  echo "Backup directory: ${BACKUP_DIR}"
  ls -la "${BACKUP_DIR}" 2>/dev/null || true
fi
echo "Git HEAD: ${GIT_HEAD}"
echo "Done."
