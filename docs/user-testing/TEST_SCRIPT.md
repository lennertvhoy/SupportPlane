# SupportPlane — Guided Test Script

**Duration:** 20–30 minutes
**URL:** http://localhost:3300
**Login:** `admin@supportplane.local` / `supportplane-demo` / `dev-tenant`

> Open this script side-by-side with your browser. Follow the steps in order. At each step, note what you see, what confused you, and what felt useful.

---

## Flow A — First Impressions & Cockpit Layout (5 min)

**Goal:** Understand what you're looking at. Familiarize yourself with the cockpit.

### A1. Log In
1. Navigate to `http://localhost:3300`
2. Enter credentials: `admin@supportplane.local` / `supportplane-demo` / `dev-tenant`
3. Click **Sign In**

**Look for:**
- The header bar at the top
- The **"DEV / MOCK DATA"** badge (orange/yellow) — this means you're in a sandbox, not production
- Your identity pill showing your email, role (Admin), and tenant (dev-tenant)
- Store mode label: **"Store: postgres"** — real database, not in-memory

**Question:** Does the "DEV / MOCK DATA" badge make it obvious this is a demo? Or would you accidentally think this is production?

### A2. Scan the Cockpit Layout
1. Look at the left sidebar — this lists **Support Sessions**
2. Look at the main content area — panels arranged in cards/tabs

**You should see panels labeled:**
- **Ticket Context** — shows what ticket is loaded
- **AI Context Quality** — shows what data the AI has access to
- **Draft Note** — where AI can suggest responses
- **Case Timeline** — chronological events for the selected session
- **Evidence Bundle** — exportable proof of what happened
- **Audit Trail** — record of every action taken

**Questions:**
- Can you tell what each panel does without reading docs?
- Are the panel labels clear?
- Is there too much on screen? Too little?

### A3. Notice the Honesty Signals
Scan the page for these labels:
- **"All writeback blocked"** — no modifications go to external systems
- **"Mock mode"** badges on panels that use simulated data
- **"Sandbox — No production data"** labels
- **"Real network: Locked OFF"** in policy areas

**Question:** Do these labels make you feel more confident or less confident in the system?

---

## Flow B — Zammad Real Sandbox Ticket (5 min)

**Goal:** Load a real ticket from a real Zammad instance running in the sandbox. Prove the connector is working.

### B1. Create a New Support Session
1. Click the **"New Session"** button (top of session list or sidebar)
2. Give it a title: e.g., `Zammad Test - Your Name`
3. Select it from the session list

**Look for:** The session banner at the top of the main area, showing session ID, status (open), and creation time.

### B2. Load Zammad Ticket Context
1. Find the **Ticket Context** panel
2. Look for a field labeled **"External Ticket ID"** or a **"Load ticket"** button
3. Enter `2` as the external ticket ID
4. Click **Load** or the Zammad action button

**Look for:**
- **Ticket subject:** "VPN connection issue for remote office - TICKET-101"
- **Customer:** Acme BVBA
- **Status:** Open
- **Priority:** Normal
- **Connector:** Zammad

**Important labels to find:**
- A **"Zammad Sandbox"** or **"Zammad"** badge
- **"Sandbox — No writeback — No production data"** disclaimer
- **"Read-only"** or **"Real sandbox read"** indicator

### B3. Check Connector Runtime Provenance
1. Look for a **Connector Runtime Provenance** card (near the ticket context)
2. Read the metadata fields

**Expected values:**
| Field | Expected | Meaning |
|-------|----------|---------|
| **Mode** | `zammad` | The Zammad adapter is active |
| **Transport** | `real` | Real HTTP calls, not mock |
| **Credential source** | `vault` or `config` | Credentials are resolved server-side |
| **Connected** | `true` | Connection succeeded |
| **Network** | `sandbox local cluster` | Only local sandbox, no internet |
| **Linked credentials** | `1` or more | Credentials are attached |

**Question:** Do these labels make it clear that this is a real connection to a sandbox instance — not production, not mock? Is anything unclear about the provenance?

### B4. Check the Case Timeline
1. Scroll to the **Case Timeline** panel
2. Look for a **"Ticket linked"** event

**Question:** Does the timeline make the sequence of events clear?

---

## Flow C — GLPI Real Sandbox Ticket (5 min)

**Goal:** Prove SupportPlane connects to a second real ticketing system (GLPI), not just Zammad. Both are honest about their status.

### C1. Create a New Support Session
1. Click **"New Session"** again
2. Title it: `GLPI Test - Your Name`
3. Select it

### C2. Load GLPI Ticket Context
1. Find the GLPI ticket-load action (may be a button, a dropdown, or a separate flow from Zammad)
2. Enter external ticket ID: `1`
3. Click to load GLPI context

**Look for:**
- **Ticket subject:** "VPN connection issue"
- **Source adapter:** GLPI (`glpi-adapter-001` or similar)
- **Status:** New
- **Priority:** High

### C3. Verify GLPI Provenance
**Expected labels:**
| Field | Expected | Meaning |
|-------|----------|---------|
| **Connector** | GLPI | The GLPI adapter is active |
| **Transport** | `real` | Real HTTP calls to GLPI sandbox |
| **Status** | `configured` | Credentials are present and connection works |
| **Mode** | Real sandbox read | Reads real sandbox data |

### C4. Compare Zammad vs GLPI
**Question:** Can you easily tell the difference between a Zammad-sourced ticket and a GLPI-sourced ticket? Are the labels distinct enough?

---

## Flow D — Governance, Policy & Audit (5–8 min)

**Goal:** Verify that safety gates exist and are enforced. Check that the system is honest about what's real vs what's fixture vs what's unconfigured.

### D1. Open the Connector Status Panel
1. Find the **Connector Status** panel (may be on the main cockpit or in the admin area)
2. Observe all 5 connector cards

**Expected statuses:**

| Connector | Expected Label | What It Means |
|-----------|---------------|---------------|
| **Zammad** | Configured / Real | Reads real sandbox data. Writeback is sandbox-only. |
| **GLPI** | Configured / Real | Reads real sandbox data. Read-only adapter. |
| **osTicket** | Fixture / Mock | Returns deterministic demo data. No real osTicket instance. |
| **MeshCentral** | Unconfigured / Not connected | No instance configured. Honest about it. |
| **Fortinet** | Unconfigured / Not connected | No instance configured. Honest about it. |

**Questions:**
- Is the difference between "real" and "fixture" easy to spot?
- Do the unconfigured connectors look like errors or bugs, or do they look intentionally unconfigured?
- If you were an MSP owner, would this panel make you feel informed or worried?

### D2. Check the Policy Editor (if available)
1. Navigate to **Admin** area (top nav or sidebar)
2. Find **Policies** in the admin navigation
3. Look for policy tabs: Delivery, AI, Connector, Retention

**Look for these safety indicators:**
- **"Real network: Locked OFF"** — no external network calls allowed
- **"Writeback: Locked OFF"** — modifications to external systems blocked
- **"Kill switch"** toggle — can immediately block all delivery
- **"Approval required"** — actions need approval before execution
- **"Mock-only enforced"** — mock data only, no real operations
- **"Cloud AI: Locked OFF"** — no OpenAI, Azure, or Anthropic calls

**Questions:**
- Do these controls make you feel safer or do they look like technical clutter?
- Is it clear what each toggle does?
- Would you trust that these controls actually work?

### D3. Browse the Audit Explorer
1. Find **Audit Explorer** in the admin navigation
2. Observe the list of recent events

**Look for event types:**
- `session_created` — someone created a support session
- `ticket_linked` — a ticket was loaded
- `connector_status_checked` — connector health was verified
- `policy_evaluated` — a policy decision was made

**Questions:**
- Is the audit trail readable and understandable?
- Do the timestamps, actors, and event types make sense?
- What would you want to see here that isn't present?

---

## Flow E — Identify What Feels Wrong (5 min)

**This is the most valuable part of the test. Be brutally honest.**

Spend 5 minutes freely exploring. Try things. Break things. Ask yourself:

### Labels & Clarity
- Are any labels or terms confusing? (e.g., "provenance," "adapter," "connector")
- Do the honesty badges (DEV/MOCK DATA, fixture, unconfigured) make the system feel less trustworthy or more trustworthy?
- Is it obvious what's real and what's not?

### Completeness
- What panels or features feel half-finished?
- What error messages are confusing?
- What would you expect to see that isn't there?

### Trustworthiness
- What would you need before trusting this in a daily support workflow?
- If the AI suggested a response, would you trust it? What proof would you want?
- Would you be comfortable showing this to a compliance auditor? Why or why not?

### The Big Questions
- If this were your tool, what would you change first?
- What one feature would make you say "yes, I'd use this"?
- What one issue would make you say "no, I wouldn't use this"?

---

## After Testing

Fill out the **[FEEDBACK_FORM.md](./FEEDBACK_FORM.md)** with your observations.

If you found a bug, use the **[BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)**.

Thank you for your time and honesty.
