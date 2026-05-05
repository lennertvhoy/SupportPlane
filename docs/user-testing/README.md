# SupportPlane — Tester Onboarding Guide

**Welcome, and thank you for testing SupportPlane.** This guide explains what you're looking at, what to expect, and how to give us the most useful feedback.

---

## What Is SupportPlane?

SupportPlane is a **governed AI support cockpit** for IT teams and MSPs. It brings together tickets from multiple systems (Zammad, GLPI, and more), provides AI-assisted drafting and summarization, and enforces policy controls so that AI can suggest but never autonomously execute actions. Every action is auditable, every connector is labeled, and every safety gate is visible.

---

## What This Demo IS

| Feature                 | What you'll see                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Real Zammad sandbox** | A live Zammad instance running in the local Kubernetes cluster. SupportPlane reads real tickets from it (ticket #2, "VPN connection issue for remote office"). |
| **Real GLPI sandbox**   | A live GLPI (IT asset management) instance. SupportPlane reads real tickets from it (ticket #1, "VPN connection issue").                                       |
| **Honest labels**       | Every connector shows its real status: configured/real, fixture, or unconfigured. Nothing pretends to be real when it isn't.                                   |
| **Policy controls**     | Visible delivery policy, AI policy, and retention policy with kill switches, approval gates, and real-network lockdown.                                        |
| **Audit trail**         | Every ticket load, session creation, and policy decision is recorded and viewable in the Audit Explorer.                                                       |
| **Admin dashboard**     | Governance panels for policies, users, roles, model usage, audit, GDPR, and connectors.                                                                        |

---

## What This Demo Is NOT

| Not in scope                    | Why                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| **Not production**              | All data is sandbox/dev. No real customer data. No production infrastructure.          |
| **No cloud AI**                 | AI uses local Ollama only (gemma4:e4b). No OpenAI, Azure, or Anthropic calls are made. |
| **No internet writeback**       | Writeback is locked to the local sandbox. No external systems are written to.          |
| **No real email**               | Notifications go to local Mailpit. No internet email is sent.                          |
| **No compliance certification** | No SOC2, ISO 27001, or GDPR compliance is claimed.                                     |
| **No real telephony**           | Call Console is mock/simulated only. No phone calls.                                   |
| **No production secrets**       | All credentials are sandbox dev defaults. Secrets are lost on pod restart.             |

---

## Quick Start

1. Ask the demo operator to run `bash scripts/start_demo_mode.sh`.
2. Open your browser to: **http://localhost:3300**
3. Log in with one of these accounts:

| Role         | Email                         | Password            | Tenant       |
| ------------ | ----------------------------- | ------------------- | ------------ |
| **Admin**    | `admin@supportplane.local`    | `supportplane-demo` | `dev-tenant` |
| **Operator** | `operator@supportplane.local` | `supportplane-demo` | `dev-tenant` |
| **Viewer**   | `viewer@supportplane.local`   | `supportplane-demo` | `dev-tenant` |

> Start with the **Admin** account for the full experience. Switch to Operator or Viewer later to see role-based access differences.

4. Expected duration: **20–30 minutes**.

---

## What You'll Test — Three Flows

### Flow A: Zammad Sandbox Ticket (~5 min)

Load a real Zammad ticket through SupportPlane. Verify the connector is labeled as "real" transport and "sandbox" mode. See the ticket context, customer name, and provenance.

### Flow B: GLPI Sandbox Ticket (~5 min)

Load a real GLPI ticket through SupportPlane. Confirm the second connector system also reports honestly.

### Flow C: Governance, Policy & Audit (~5–8 min)

Explore the Connector Status panel, Policy Editor, and Audit Explorer. See which connectors are real vs fixture. Verify that safety gates (kill switch, real-network lockdown) are enforced.

### Flow D: What Feels Wrong? (~5 min)

The most valuable part. Tell us what confused you, what felt fake, what labels were unclear, and what you'd need before trusting this in a real workflow.

---

## Known Limitations (Honest List)

| System              | Status       | What this means                                                         |
| ------------------- | ------------ | ----------------------------------------------------------------------- |
| **Zammad**          | Real sandbox | Reads real sandbox data. Writeback is sandbox-only.                     |
| **GLPI**            | Real sandbox | Reads real sandbox data. Read-only adapter.                             |
| **osTicket**        | Fixture      | Returns deterministic demo data. No real osTicket. Blocked by upstream. |
| **MeshCentral**     | Unconfigured | No real instance. Shows honest "unconfigured" status.                   |
| **Fortinet**        | Unconfigured | No real instance. Shows honest "unconfigured" status.                   |
| **AI / Ollama**     | Local only   | Uses local Ollama gemma4:e4b. May fall back if Ollama is down.          |
| **OpenBao secrets** | In-memory    | Credentials lost on pod restart. Re-seed script exists.                 |

Full list: see `docs/KNOWN_DEMO_LIMITATIONS.md`.

---

## Reference Documents

- **[TEST_SCRIPT.md](./TEST_SCRIPT.md)** — Step-by-step guided test script with click paths and expected labels
- **[FEEDBACK_FORM.md](./FEEDBACK_FORM.md)** — Structured form to capture your observations
- **[BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)** — Template for reporting issues
- **[TESTER_PERSONAS.md](./TESTER_PERSONAS.md)** — Persona-specific testing perspectives (MSP owner, operator, security reviewer, admin, enterprise buyer)

---

## Your Feedback Is the Goal

You cannot break anything. There are no wrong answers. We want honest feedback — especially about what confused you, what labels were unclear, and what you would need before trusting this in your own environment.

**Thank you for your time.**
