# SupportPlane — First Test Round

**Welcome to the first real user-testing round of SupportPlane.** You are among the very first people outside the development team to see this. Your honest, unfiltered feedback is the most valuable output of this session.

---

## Demo URLs

| Service    | URL                     |
| ---------- | ----------------------- |
| **Web UI** | `http://localhost:3300` |
| **API**    | `http://localhost:4210` |

> The demo operator must start the stack before you can access it: `bash scripts/start_demo_mode.sh`. **Before each tester, the operator must also run:** `bash scripts/reset_demo_data.sh` (clears stale sessions from prior testing). If the page doesn't load, ask the operator to run the smoke test: `bash scripts/verify_user_testing_demo.sh`.

---

## Expected Duration

**20–30 minutes.** You are welcome to spend more or less time. Even 10 minutes of honest impressions is valuable.

---

## What Testers Should Try First

Follow the guided test script in **[TEST_SCRIPT.md](./TEST_SCRIPT.md)** . It walks you through exactly what to click, what to look for, and what questions to ask yourself. The five flows are:

1. **Flow A — First Impressions & Cockpit Layout** (5 min): Log in, scan the panels, notice the honesty badges.
2. **Flow B — Zammad Real Sandbox Ticket** (5 min): Load a real ticket from a real Zammad instance. Check the labels.
3. **Flow C — GLPI Real Sandbox Ticket** (5 min): Load a ticket from a second real ticketing system (GLPI).
4. **Flow D — Governance, Policy & Audit** (5–8 min): Explore connector status, policy controls, audit trail.
5. **Flow E — What Feels Wrong?** (5 min): The most important part. Be brutally honest about what confused or worried you.

---

## What NOT to Judge Yet

These are known limitations. They are not bugs and not what we need feedback on:

- **Production readiness** — This is a local sandbox demo, not a production deployment.
- **Cloud AI** — AI uses local Ollama only. No OpenAI, Azure, or Anthropic calls.
- **Missing connectors** — osTicket is fixture-backed (blocked by upstream), MeshCentral and Fortinet are unconfigured. All are honestly labeled.
- **Performance under load** — This runs on localhost. Real-world latency is not represented.
- **Pricing, SLAs, certifications** — Not part of this demo. These are business questions for later.
- **Full list:** `docs/KNOWN_DEMO_LIMITATIONS.md`

---

## Known Limitations

| System      | Status                                              |
| ----------- | --------------------------------------------------- |
| Zammad      | Real sandbox read. Writeback is sandbox-only.       |
| GLPI        | Real sandbox read. Read-only adapter.               |
| osTicket    | Fixture data only. No real osTicket.                |
| MeshCentral | Unconfigured. Honest about it.                      |
| Fortinet    | Unconfigured. Honest about it.                      |
| AI          | Local Ollama only. May fall back if Ollama is down. |
| Secrets     | In-memory OpenBao. Lost on pod restart.             |
| Telephony   | Mock/simulated only. No real phone calls.           |

Full list: `docs/KNOWN_DEMO_LIMITATIONS.md`

---

## How to Submit Feedback

1. **Fill out the [FEEDBACK_FORM.md](./FEEDBACK_FORM.md)** — structured form with first impressions, clarity ratings, trust assessment, and open-ended thoughts.
2. **For bugs or unexpected behavior, use the [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md).**
3. **Share the completed forms** with the SupportPlane operator or team lead.

---

## How to Report a Blocker

A blocker is anything that prevents you from completing a documented demo flow.

**If you hit a blocker:**

1. Note which flow and step you were on.
2. Describe exactly what happened instead of what you expected.
3. If possible, take a screenshot.
4. Tag it as **P0 / Demo-Blocker** on your feedback form or bug report.
5. Tell the demo operator immediately so they can capture bug context: `bash scripts/capture_demo_bug_context.sh --bug-id <your-name>-BLOCKER`

---

## What Screenshots/Logs to Include

If you can take screenshots, capture:

- The full browser window of any confusing panel or error
- Connector Status panel (to show real/fixture/unconfigured labels)
- Any error message or blank panel
- Browser console output if you know how (F12 → Console tab, look for red errors)

If you can't take screenshots, describe what you saw in as much detail as possible.

---

## Tester Personas to Assign

Ask the demo operator to assign you one or more of these perspectives before you start. Each persona focuses on different concerns:

| Persona                            | Log in as          | Focus                                         |
| ---------------------------------- | ------------------ | --------------------------------------------- |
| **MSP Owner / IT Manager**         | Admin              | Multi-tenancy, connector roster, ROI signals  |
| **Helpdesk Operator**              | Operator           | Speed, usability, AI draft quality            |
| **Security / Governance Reviewer** | Admin, then Viewer | RBAC, audit, policy controls, secret scanning |
| **Technical Admin**                | Admin              | Connector config, health, monitoring          |
| **Skeptical Enterprise Buyer**     | Admin              | Honesty labels, real vs mock, polish, roadmap |

Full persona descriptions: **[TESTER_PERSONAS.md](./TESTER_PERSONAS.md)**

---

## Login Credentials

| Role         | Email                         | Password            | Tenant       |
| ------------ | ----------------------------- | ------------------- | ------------ |
| **Admin**    | `admin@supportplane.local`    | `supportplane-demo` | `dev-tenant` |
| **Operator** | `operator@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| **Viewer**   | `viewer@supportplane.local`   | `supportplane-demo` | `dev-tenant` |

---

## Quick Links

- **[README.md](./README.md)** — Tester onboarding overview
- **[TEST_SCRIPT.md](./TEST_SCRIPT.md)** — Step-by-step guided test flows
- **[FEEDBACK_FORM.md](./FEEDBACK_FORM.md)** — Structured feedback form
- **[BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)** — Bug report template
- **[TESTER_PERSONAS.md](./TESTER_PERSONAS.md)** — Persona descriptions
- **[KNOWN_DEMO_LIMITATIONS.md](../KNOWN_DEMO_LIMITATIONS.md)** — Full limitations list

---

## Your Feedback Is the Goal

You cannot break anything. There are no wrong answers. We want honest feedback — especially about what confused you, what labels were unclear, and what you would need before trusting this in your own environment.

**Thank you for your time.**
