# SupportPlane — Tester Invitation Packet

**Hello! You've been invited to test SupportPlane**, a governed AI support cockpit for IT teams and MSPs. This is a local sandbox demo — not a production product. Your honest feedback is the most valuable output.

---

## Quick Start (Copy-Paste Ready)

Send this to each tester:

---

**Subject: SupportPlane demo — your test session**

Hi! Thanks for testing SupportPlane. Here's what you need:

### Access

| What | Detail |
|------|--------|
| **Web UI** | `http://localhost:3300` |
| **Login** | `admin@supportplane.local` / `supportplane-demo` / `dev-tenant` |
| **Duration** | 20–30 minutes |
| **Test script** | [TEST_SCRIPT.md](./TEST_SCRIPT.md) — follow step-by-step |
| **Feedback form** | [FEEDBACK_FORM.md](./FEEDBACK_FORM.md) — fill out after testing |
| **Bug report** | [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md) — if something breaks |

### What to Test

1. **First impressions & cockpit layout** — 5 min. Look for the blue "Demo Guide — Start Here" panel with connector overview.
2. **Zammad real sandbox ticket** — 5 min (load ticket #2, TICKET-101)
3. **GLPI real sandbox ticket** — 5 min (load ticket #1)
4. **Governance, policy & audit** — 5–8 min
5. **What feels wrong?** — 5 min (most important!)

### What NOT to Judge

- This is a **local sandbox demo**, not production.
- **No cloud AI** — uses local Ollama only.
- **osTicket is fixture** (fake data), **MeshCentral/Fortinet are unconfigured**. All honestly labeled.
- **No pricing, SLAs, certifications** in this round.

### Known Limitations

| System | Status |
|--------|--------|
| Zammad | Real sandbox read. Writeback is sandbox-only. |
| GLPI | Real sandbox read. |
| osTicket | Fixture only. |
| MeshCentral | Unconfigured. |
| Fortinet | Unconfigured. |
| AI | Local Ollama only. |
| Secrets | In-memory, lost on restart. |

### Important Warnings

> **This is a sandbox/local demo. No production data. No public access. No internet writeback.**
> Do not enter real credentials, personal data, or production secrets.

### Contact / Escalation

If the demo breaks or you hit a blocker:
1. Stop testing.
2. Record the step you were on.
3. Take a screenshot if possible.
4. Tell the demo operator to run: `bash scripts/capture_demo_bug_context.sh --bug-id <your-name>-BLOCKER`
5. Contact: `_________________` (fill in operator contact)

### You Cannot Break Anything

There are no wrong answers. Be brutally honest — especially about what confused you, what felt misleading, and what you'd need before trusting this in your own environment.

**Thank you for your time.**

---

## Instructions for the Demo Operator

1. Replace the contact placeholder in the template above.
2. Before sending, verify:
   - `bash scripts/start_demo_mode.sh` has been run
   - `bash scripts/reset_demo_data.sh --yes` has been run (clears stale sessions)
   - `bash scripts/verify_user_testing_demo.sh` reports 10/10 PASS
   - Web UI is accessible at `http://localhost:3300`
3. Send the packet copy to the tester.
4. After the session, collect FEEDBACK_FORM.md and any BUG_REPORT_TEMPLATE.md submissions.
