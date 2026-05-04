# SupportPlane — Demo Operator Checklist

**Purpose:** Exact steps for the demo operator before, during, and after every tester session. Follow these in order. Do not skip steps.

---

## Before Each Tester

### 1. Start and Verify the Demo Stack

```bash
bash scripts/start_demo_mode.sh
```

Wait for pod readiness. If the cluster is already running, proceed to step 2.

### 2. Reset Demo Data (Clean State)

```bash
bash scripts/reset_demo_data.sh --yes
```

If `--yes` is not available on your version:
```bash
echo "destroy-local-data" | bash scripts/reset_demo_data.sh --confirm
```

This clears stale support sessions, generated test context packets, and test/demo bug capture sessions from prior runs. Infrastructure, schema, credentials, and seed connector setup are preserved.

**Verify the reset completed successfully** — output should end with "Done." No error messages.

### 3. Run Smoke Test

```bash
bash scripts/verify_user_testing_demo.sh
```

**Required: 10/10 PASS, 0 FAIL.** If any check fails, stop. Do not proceed.

Expected pass outputs:
- API health ok
- Web returns HTTP 200
- Zammad: configured:real
- GLPI: configured:real
- osTicket: fixture (expected)
- MeshCentral: unconfigured (expected)
- Fortinet: unconfigured (expected)
- Zammad context: loads VPN connection ticket
- GLPI context: loads VPN connection ticket
- No-secret scan: clean

### 4. Confirm Web and API URLs

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3300
# Must return: 200

curl -s http://localhost:4210/health | head -c 100
# Must show: {"status":"ok"
```

### 5. Confirm Zammad and GLPI Real Status

```bash
# Check Zammad is configured/real
# The smoke test already covers this. Quick verification:
curl -s http://localhost:4210/connectors/status | python3 -c "import json,sys; d=json.load(sys.stdin); [print(c['id'],c['mode']) for c in d]"
# Expected: zammad = configured, glpi = configured, osticket = fixture
```

### 6. Assign Tester Persona

Pick or let the tester self-select from:

| Persona | Login as | Focus |
|---------|----------|-------|
| MSP Owner / IT Manager | Admin | Multi-tenancy, connectors, ROI signals |
| Helpdesk Operator | Operator | Speed, usability, AI draft quality |
| Security / Governance Reviewer | Admin, then Viewer | RBAC, audit, policy, secrets |
| Technical Admin | Admin | Connector config, health, monitoring |
| Skeptical Enterprise Buyer | Admin | Honesty labels, real vs mock, polish |

Write down: **Tester name, persona, start time.**

### 7. Send Tester Packet

Copy-paste the content from **[SEND_TO_TESTERS.md](./SEND_TO_TESTERS.md)** to the tester. Include the login credentials and URLs.

Remind the tester:
> "You cannot break anything. Honest feedback is the goal."

Do NOT walk through flows with the tester. We want to see where they get stuck on their own.

---

## During Testing

### 8. Observe and Collect Feedback

- Do not guide the tester through flows.
- Note where they pause, ask questions, or get confused.
- After the session, collect:
  - Completed [FEEDBACK_FORM.md](./FEEDBACK_FORM.md)
  - Any [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md) submissions
  - Screenshots they took (if any)

---

## After Each Tester

### 9. Capture Bug Context (if bugs found)

For any P0 or P1 issue:
```bash
bash scripts/capture_demo_bug_context.sh --bug-id ROUND-001-<tester-name>
```

This captures: API health, git HEAD, pod status, connector status, Zammad/GLPI context, pod logs with secret redaction, no-secret scan.

### 10. Log Results

Add an entry to **[FEEDBACK_LOG.md](./FEEDBACK_LOG.md)**:
- Tester name, persona, date, round
- Clarity score, usefulness score, trust score, speed score, polish score
- Top issue found
- Severity (P0/P1/P2/P3/P4)
- Backlog link (BL-XXX)
- Status (open / resolved / documented)

### 11. Triage After Session

Follow **[TRIAGE_WORKFLOW.md](./TRIAGE_WORKFLOW.md)**:
1. Classify each item: bug / honesty-gap / feature / known-limitation
2. Assign severity P0-P4
3. Create BL items for non-trivial P1/P2 items
4. Add P0/P1 items to NEXT_ACTIONS.md
5. For P0 demo-blockers: stop testing, fix, re-verify before next tester

### Reset for Next Tester

If another tester follows:
- Go back to step 2 (Reset Demo Data)
- Pick a different persona if possible
- Repeat the full checklist

---

## Stop-Testing Rules

Stop immediately if:
1. **Reset fails** — `reset_demo_data.sh` exits non-zero
2. **Smoke test fails** — any FAIL in verify_user_testing_demo.sh
3. **P0 demo-blocker found** — system crashes, unreachable, or shows wrong data
4. **Honesty gap found** — label contradicts actual behavior
5. **Raw secret exposed** — in UI, API, logs, or evidence
6. **3+ P1 issues in the same flow**

See [TRIAGE_WORKFLOW.md Section 6](./TRIAGE_WORKFLOW.md) for full escalation rules.

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bash scripts/start_demo_mode.sh` | Start the demo stack |
| `bash scripts/reset_demo_data.sh --yes` | Clear stale data (non-interactive) |
| `bash scripts/verify_user_testing_demo.sh` | 10/10 smoke test |
| `bash scripts/capture_demo_bug_context.sh --bug-id X` | Capture bug diagnostics |
| `curl http://localhost:3300` | Web UI health |
| `curl http://localhost:4210/health` | API health |

## Login Credentials

| Role | Email | Password | Tenant |
|------|-------|----------|--------|
| Admin | `admin@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| Operator | `operator@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| Viewer | `viewer@supportplane.local` | `supportplane-demo` | `dev-tenant` |
