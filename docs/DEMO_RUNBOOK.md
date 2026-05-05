# Demo Runbook

**Backlog:** BL-090  
**Scope:** Local sandbox demo flow, reset, and troubleshooting  
**Last updated:** 2026-04-30

---

## Demo Prerequisites

Before starting the demo, ensure the local sandbox is running:

1. **Local Kubernetes cluster** is created and healthy:

   ```bash
   kind get clusters
   # Expected: supportplane-local
   ```

2. **Images are built and loaded**:

   ```bash
   bash scripts/build_and_load_local_k8s_images.sh
   ```

3. **Manifests are applied**:

   ```bash
   kubectl apply -k infra/kubernetes/local-podman
   ```

4. **Port forwards are active**:

   ```bash
   kubectl port-forward -n supportplane-app svc/supportplane-api 4210:4110 &
   kubectl port-forward -n supportplane-app svc/supportplane-web 3300:3200 &
   ```

5. **All pods are Running**:

   ```bash
   kubectl get pods --all-namespaces
   ```

6. **Ollama is reachable** (host-controlled):
   ```bash
   curl http://10.88.0.1:11435/api/tags
   # Should list gemma4:e4b or the configured model
   ```

---

## Demo Reset Procedure

To reset the demo to a deterministic state:

```bash
# Dry-run first (recommended)
bash scripts/reset_demo_data.sh --dry-run

# Live reset
bash scripts/reset_demo_data.sh --confirm
```

The reset script will:

1. Reset the SupportPlane PostgreSQL database via Prisma migrate reset + seed
2. Verify Zammad connector and delivery policy references exist
3. Verify OpenBao secret exists in the cluster
4. Verify MinIO bucket exists
5. Verify Mailpit is reachable
6. Verify Asterisk is reachable
7. Verify Ollama/Gemma is reachable

> **Safety:** The script refuses to run against non-local databases and requires `--confirm` for live execution.

---

## Step-by-Step Demo Flow

### Step 1: Login

Open `http://localhost:3300/` in a browser.

Log in with:

- **Email:** `admin@supportplane.local`
- **Password:** `supportplane-demo`

**Expected outcome:**

- Dashboard loads with header identity pill: `Demo Admin / Acme Support Demo / admin`
- Amber `DEV / MOCK DATA` banner is visible at the top
- Connector panel shows `Local Zammad Sandbox` with `active` status

---

### Step 2: Create a Support Session

Click **New** in the Sessions panel.
Enter title: `Demo Session — VPN Issue`
Click **Create**.

**Expected outcome:**

- Session appears in the left sidebar with `open` badge
- Session detail panel opens on the right

---

### Step 3: Load Ticket Context

In the **Ticket Context** panel, enter `TICKET-101` and click **Load**.

**Expected outcome:**

- Ticket subject: `VPN not connecting for remote user`
- Customer: `Acme BVBA`
- Connector runtime provenance card is visible
- AI Context Quality panel populates with ticket provenance packet

---

### Step 4: Generate Draft Suggestion

In the **AI Assistant** panel, click **Generate Draft**.

**Expected outcome:**

- Draft text appears after a short delay
- Model provenance shows `provider=ollama`, `providerMode=local`
- If Ollama is reachable: `fallbackUsed=false`, `noCloudCall=true`
- If Ollama is unreachable: `fallbackUsed=true` with deterministic fallback text
- Redaction indicator is present (no raw secrets in draft)

---

### Step 5: Approve Action

Review the draft. Click **Approve** in the delivery policy panel.

**Expected outcome:**

- Approval is recorded with your user identity and timestamp
- Delivery policy gate is evaluated (`approvalRequired=true`, `minimumApproverRole=admin`)
- If policy passes, an outbox item is queued

---

### Step 6: Verify Outbox

Check the outbox status:

```bash
curl -s http://localhost:4210/outbox/worker/status | jq .
```

Or view the **Outbox** panel in the UI.

**Expected outcome:**

- Outbox item shows `status: queued` or `status: processed`
- Worker logs show idempotent processing
- If writeback is enabled and policy allows: Zammad internal note is created with SupportPlane provenance marker
- MinIO evidence artifact is stored with checksum
- Mailpit may capture a local notification email

---

## Known Limitations to Mention During Demo

1. **Local sandbox only:** This is not a production deployment. Data is reset periodically.
2. **Zammad is sandbox-only:** Writeback is limited to internal notes. No public replies, no production ticketing.
3. **Ollama requires host GPU:** The cluster does not contain an Ollama pod. Model inference runs on the host via the podman0 bridge IP.
4. **Mailpit does not send real email:** It captures SMTP traffic locally. No internet email is sent.
5. **Asterisk has no PSTN:** The telephony sandbox has no SIP trunk and no real audio. It is for AMI integration testing only.
6. **OpenBao is dev mode:** Secrets are not encrypted at rest with a production seal. The root token is a placeholder.
7. **Deterministic seed data:** Tickets `TICKET-101` and `TICKET-102` are fixtures. Customer data is synthetic.
8. **Auth mode is local:** No SSO/OIDC in this demo. User accounts are seeded passwords.

---

## Troubleshooting

### Pod stuck in `Pending`

```bash
kubectl describe pod <pod-name> -n <namespace>
# Check for PVC binding issues or resource limits
```

### `ImagePullBackOff` for SupportPlane images

The cluster images must be loaded with `scripts/build_and_load_local_k8s_images.sh`.

```bash
# Verify image is in the node
podman exec supportplane-local-control-plane crictl images | grep supportplane-api
```

### Zammad init container fails

Zammad initialization can take several minutes. Check logs:

```bash
kubectl logs -n supportplane-integrations statefulset/zammad -c zammad-init
```

### Ollama connection timeout

Verify Ollama is listening on the host:

```bash
curl http://10.88.0.1:11435/api/tags
```

If Ollama is missing, install and start it:

```bash
ollama serve &
ollama pull gemma4:e4b
```

### API returns 500 after reset

The API pods may need a restart after database reset:

```bash
kubectl rollout restart deployment -n supportplane-app
```

### Worker not processing outbox items

Check worker logs and NATS stream status:

```bash
kubectl logs -n supportplane-app deployment/supportplane-worker --tail=100
kubectl exec -n supportplane-integrations nats-0 -- nats stream info SUPPORTPLANE_OUTBOX
```
