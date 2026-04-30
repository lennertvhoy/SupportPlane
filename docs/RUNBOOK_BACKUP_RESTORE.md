# Backup/Restore Runbook

**Backlog:** BL-087  
**Scope:** Local sandbox only. Not production grade.  
**Last updated:** 2026-04-30

---

## Purpose

This runbook documents how to back up and restore the SupportPlane local sandbox environment. It covers the PostgreSQL databases, MinIO object storage manifest, Kubernetes ConfigMaps, and runtime metadata.

> **Honest limitation:** This is a local sandbox procedure. It is not a production-grade backup strategy. Production systems require point-in-time recovery, off-site replication, encrypted backups, and tested restoration SLA.

---

## Prerequisites

- `kubectl` configured for `kind-supportplane-local`
- `pg_dump` and `psql` installed (or access to a PostgreSQL client container)
- `mc` (MinIO Client) or `aws` CLI installed (optional — MinIO manifest backup only)
- `git` installed
- Bash >= 4.0

---

## Step-by-Step Backup Procedure

### 1. Verify context

```bash
kubectl config current-context
# Expected: kind-supportplane-local
```

### 2. Run the backup script (dry-run by default)

```bash
bash scripts/backup_local_sandbox.sh --dry-run
```

Review the output. It will list what **would** be backed up:
- Git commit hash and branch
- Container image tags from all deployments
- SupportPlane PostgreSQL DB dump
- Zammad PostgreSQL DB dump (if credentials are resolvable)
- MinIO evidence bucket manifest
- Kubernetes ConfigMaps (secret values redacted)
- Acceptance freeze references from `docs/ACCEPTANCE_FREEZES.md`

### 3. Perform a live backup

```bash
bash scripts/backup_local_sandbox.sh --confirm
```

The script creates a timestamped directory under `backups/`:

```
backups/supportplane-sandbox-YYYYMMDD-HHMMSS/
  git-info.txt
  images.txt
  supportplane-db.sql
  zammad-db.sql
  minio-manifest.txt
  configmaps-redacted.yaml
  acceptance-freezes.txt
```

> **Secret safety:** The script never prints raw secret values. Database URLs and passwords are redacted in logs. Kubernetes Secret data is not dumped; only ConfigMaps are collected (with inline redaction).

---

## Step-by-Step Restore Procedure

### 1. Verify safeguards

Before restoring, confirm:

| Check | How |
|-------|-----|
| kubectl context | `kubectl config current-context` must return `kind-supportplane-local` |
| DATABASE_URL host | Must be `localhost`, `127.0.0.1`, `::1`, or `postgres.supportplane-data.svc.cluster.local` |
| Environment gate | `SUPPORTPLANE_ALLOW_RESTORE_LOCAL=1` must be exported |
| Dump file | You must have a valid `.sql` dump from a prior backup |

### 2. Run the restore script (dry-run by default)

```bash
bash scripts/restore_local_sandbox.sh --dry-run --dump-file=backups/supportplane-sandbox-YYYYMMDD-HHMMSS/supportplane-db.sql
```

### 3. Perform a live restore

```bash
export SUPPORTPLANE_ALLOW_RESTORE_LOCAL=1
bash scripts/restore_local_sandbox.sh --confirm --dump-file=backups/supportplane-sandbox-YYYYMMDD-HHMMSS/supportplane-db.sql
```

The script will:
1. Restore the SupportPlane PostgreSQL database from the dump file
2. Verify the MinIO deployment exists
3. Verify the OpenBao secret exists
4. Rollout-restart deployments in `supportplane-app`

> **Warning:** The script prints an explicit warning: "This will DESTRUCTIVELY overwrite local sandbox data." You must type `destroy-local-data` to proceed.

---

## Safety Checks and Safeguards

| Safeguard | Script | Behavior |
|-----------|--------|----------|
| Context lock | `restore_local_sandbox.sh` | Refuses if kubectl context is not `kind-supportplane-local` |
| DB host check | `restore_local_sandbox.sh` | Refuses if DATABASE_URL points to a non-local or production-looking host |
| Env gate | `restore_local_sandbox.sh` | Requires `SUPPORTPLANE_ALLOW_RESTORE_LOCAL=1` |
| Confirm flag | both | `--confirm` required for live execution; dry-run is the default |
| Secret redaction | `backup_local_sandbox.sh` | Never dumps Kubernetes Secrets; redacts known secret keys in ConfigMaps |
| No password in argv | both | Uses `PGPASSWORD` environment variable for `pg_dump`/`psql` |

---

## Troubleshooting

### `pg_dump` or `psql` not found

Install the PostgreSQL client for your distribution:

```bash
# Fedora
sudo dnf install postgresql

# Debian/Ubuntu
sudo apt-get install postgresql-client
```

### `mc` or `aws` not found

MinIO manifest backup is optional. To install `mc`:

```bash
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
```

### Zammad backup skipped

The script attempts to read the Zammad PostgreSQL password from the Kubernetes secret `zammad-postgres` in namespace `supportplane-integrations`. If the secret is missing or the cluster is not running, Zammad backup is skipped with a warning.

### Restore fails with connection error

Ensure the target PostgreSQL is reachable:

```bash
# For local compose topology
pg_isready -h localhost -p 5434 -U supportplane

# For in-cluster restore (run from a pod or port-forwarded session)
pg_isready -h localhost -p 5432 -U supportplane
```

---

## Honest Limitations

- **Local sandbox only:** These scripts are designed for the `kind-supportplane-local` context. They will refuse to run against other contexts.
- **Not production grade:** There is no encryption at rest, no off-site replication, no incremental backup, and no automated scheduling.
- **Single-node assumption:** The backup assumes a single PostgreSQL pod and single MinIO pod. Multi-node or HA topologies are not handled.
- **Secret resolution:** The scripts resolve secrets from Kubernetes only when the cluster is running. If the cluster is down, some backup items are skipped.
- **MinIO manifest, not objects:** The backup captures a bucket listing (object names and sizes), not the objects themselves. Full object backup requires `mc mirror` or `aws s3 sync`.
- **No NATS JetStream backup:** Stream state and consumer offsets are not backed up.
- **No OpenBao data backup:** OpenBao runs in dev mode; its secrets are ephemeral unless manually persisted.
