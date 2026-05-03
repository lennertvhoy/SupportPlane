# SupportPlane — Tester Personas

Use these personas to guide your testing. Pick the one closest to your real-world role, or try multiple perspectives. Each persona has different goals, concerns, and questions.

---

## Persona 1: MSP Owner / IT Manager

**Background:** Runs a managed services company with 5–50 employees. Currently uses a mix of ticketing systems (Zammad, ConnectWise, Autotask). Needs to evaluate whether SupportPlane could replace or augment their current stack.

**What they care about most:**
- Multi-tenancy: Can each customer see only their own data?
- White-label options: Can the dashboard be branded for the MSP?
- ROI: Does this save technician time? By how much?
- Pricing model: Per-technician, per-ticket, flat rate?
- Integration depth: How many connectors are real vs planned?

**What they will test:**
1. Is the tenant boundary visible and enforced? (Try switching tenants, check cross-tenant data isolation)
2. Are there obvious branding/white-label touchpoints?
3. Does the connector status panel give confidence about what's real?
4. Does the cockpit reduce the number of tabs/tools a technician needs?

**What would make them say YES:**
- Clear multi-tenant isolation demo
- Credible connector roster (Zammad + GLPI real, more roadmapped)
- Time-to-resolution metrics or audit trail showing efficiency gains

**What would make them say NO:**
- No multi-tenant proof
- Too many mock/fixture connectors
- No pricing or business model clarity
- Slow or confusing UI that would frustrate technicians

**Key questions they'll ask:**
- "How do I add my own Zammad instance — not the sandbox one?"
- "Can I resell this to my customers with my own branding?"
- "What does this cost per technician per month?"
- "When will ServiceNow / Jira / ConnectWise connectors be ready?"

---

## Persona 2: Helpdesk Operator

**Background:** Handles 20–50 tickets per day. Currently toggles between Zammad, knowledge base, and internal chat. Wants to reduce clicks and context-switching. Doesn't care about architecture or deployment.

**What they care about most:**
- Speed: How fast does ticket context load? How fast does AI draft?
- Intuitive UI: Can they use this without training?
- Clear AI suggestions: Are drafts useful, safe, and reviewable?
- Minimal clicks: How many clicks from login to ticket context?

**What they will test:**
1. How fast does the dashboard load after login? (subjective feel)
2. How many clicks to load a Zammad ticket? Enter ID → click Load → done?
3. Is the ticket context panel readable at a glance? (subject, customer, status, priority)
4. Does the AI draft button work? Is the draft relevant?
5. Are the safety labels distracting or helpful?
6. What happens if they accidentally try to write back? (should be blocked with clear message)

**What would make them say YES:**
- Ticket context loads in under 2 seconds
- AI drafts are actually helpful (not generic)
- UI feels faster than their current toolset
- Clear, non-annoying safety labels

**What would make them say NO:**
- Slow ticket loading (>5 seconds)
- Confusing navigation or too many panels
- AI drafts that are wrong or generic
- Too many mock/fixture warnings that look like errors

**Key questions they'll ask:**
- "Can I customize which panels I see?"
- "Does this work with keyboard shortcuts?"
- "What happens when the AI gets it wrong — can I override?"
- "Can I see ticket history / previous notes?"

---

## Persona 3: Security / Governance Reviewer

**Background:** Security engineer, compliance officer, or CISO evaluating whether SupportPlane meets internal security standards. Focused on boundaries, audit, RBAC, and data safety. Skeptical by nature.

**What they care about most:**
- RBAC enforcement: Can a Viewer create a session? Can an Operator change policy?
- Audit trail completeness: Is every action logged? With actor, timestamp, and outcome?
- Policy controls: Are kill switches, approval gates, and real-network locks enforced?
- Data boundaries: Are credentials visible anywhere in the UI, API, or evidence exports?
- AI safety: Can AI autonomously execute actions? Are prompts and responses logged?

**What they will test:**
1. **RBAC:** Log in as Viewer. Try to create a session, load a ticket, or change a policy. Expect 403 denial.
2. **Cross-tenant isolation:** Try to access data from a different tenant. Expect 404 or denial.
3. **Policy enforcement:** Check that "Real network: Locked OFF" is visible and can't be bypassed from the UI.
4. **Kill switch:** Toggle the delivery kill switch in Admin → Policies. Verify blocked state.
5. **Audit trail:** Load a ticket, then check Audit Explorer. Does the event appear with actor, timestamp, and metadata?
6. **Secret leakage:** Scan the UI, browser dev tools (Network tab), and any evidence export for raw tokens, passwords, or API keys. None should appear.
7. **AI governance:** Verify AI policy tab shows that autonomous send is locked off and cloud AI is disabled.

**What would make them say YES:**
- Clean RBAC enforcement with visible denial (not silent failure)
- Complete audit trail with non-repudiable event records
- No secret leakage in any surface (UI, API, logs, exports)
- Policy controls that are visibly enforced, not just cosmetic

**What would make them say NO:**
- Secrets visible in browser dev tools or API responses
- RBAC bypass possible (Viewer can create sessions, Operator can change policy)
- Audit events missing or incomplete
- Policy controls that are cosmetic only (UI toggle doesn't affect backend)

**Key questions they'll ask:**
- "Where are audit events stored? Are they immutable?"
- "Can I export audit logs to a SIEM?"
- "Is the AI prompt logged? Can I audit what the model received?"
- "How are credentials stored and rotated?"
- "What certifications do you have? SOC2? ISO 27001?"

---

## Persona 4: Technical Admin

**Background:** System administrator or DevOps engineer who would deploy and maintain SupportPlane. Evaluates deployment complexity, monitoring, backup/recovery, and connector configuration.

**What they care about most:**
- Cluster topology: What services run where? How are they connected?
- Connector configuration: How do I add a new Zammad instance?
- Monitoring: Is there a health endpoint? Metrics? Logs?
- Backup/restore: Is there a documented procedure?
- Deployment complexity: How many steps from zero to running?

**What they will test:**
1. **Connector configuration:** Check Admin → Connectors. Is it clear how to add a new connector? What fields are required?
2. **Health check:** Look for `/health` or a health status panel. Does it show API, DB, and connector status?
3. **Connector Status panel:** Are the labels clear about which connectors are configured, which are unconfigured, and why?
4. **Observability:** Is there an Observability panel? Does it show metrics, logs, or cluster status?
5. **Documentation:** Review the ADMIN navigation. Is there an obvious path from "new system" to "fully configured"?

**What would make them say YES:**
- Clear, documented configuration path for adding connectors
- Health/status endpoints that return actionable information
- Observability panel with real metrics
- Backup/restore runbook that is actually runnable

**What would make them say NO:**
- Configuration is undocumented or requires code changes
- No health checks or monitoring endpoints
- Connector status is misleading (says "connected" when it's mock)
- Deployment requires too many manual steps or fragile dependencies

**Key questions they'll ask:**
- "How do I add my production Zammad instance?"
- "What happens when a connector goes down — does the cockpit break?"
- "Can I run this on my own Kubernetes cluster?"
- "How do I upgrade without downtime?"
- "Is there a Helm chart?"

---

## Persona 5: Skeptical Enterprise Buyer

**Background:** Procurement decision-maker or IT director at a 500+ employee organization. Evaluating SupportPlane as a potential purchase. Needs to separate marketing claims from operational reality. Will compare against ServiceNow, Jira Service Management, and Freshservice.

**What they care about most:**
- Real vs mock: What actually works today vs what's a roadmap promise?
- Compliance: What certifications exist? What's planned?
- AI safety: What happens when the AI fails or hallucinates?
- Vendor maturity: Is this a real product or a prototype?
- Integration breadth: How many connectors are production-ready?

**What they will test:**
1. **Honesty check:** Count the connectors. How many are real? How many are fixture? How many are unconfigured? Is this clearly labeled?
2. **Mock/fixture clarity:** The osTicket connector returns demo data. Is it clearly marked as "Fixture — not real data"? Or does it look like a bug?
3. **AI safety:** Is there a visible AI policy? Does it clearly state that AI cannot act autonomously?
4. **Roadmap transparency:** Is there any indication of what's planned vs what's available now?
5. **Error handling:** What happens when you do something unexpected? Are errors graceful or confusing?
6. **Overall polish:** Does the UI feel like a v0.8 prototype or a v2.0 product?

**What would make them say YES:**
- Clear, honest labeling of real vs mock vs planned
- Credible safety story with visible enforcement
- Polished UI that doesn't look like a prototype
- Documented roadmap with realistic timelines

**What would make them say NO:**
- Misleading labels (mock presented as real)
- AI safety claims that can't be verified in the demo
- Too many fixture/mock connectors with no clear roadmap
- UI that feels unfinished or buggy
- No compliance story whatsoever

**Key questions they'll ask:**
- "What grade of SOC2 certification do you have?"
- "What's your SLA for the hosted version?"
- "How many production deployments do you have?"
- "What's your data residency story for EU customers?"
- "What happens to our data if you go out of business?"
- "Show me your AI safety audit — has a third party reviewed it?"

---

## Testing Advice by Persona

| Persona | Log in as | Focus flows | Spend most time on |
|---------|-----------|-------------|-------------------|
| MSP Owner | Admin | A, B, C | Connector Status, multi-tenant indication, overall scope |
| Helpdesk Operator | Operator | A, B | Speed, usability, AI draft quality |
| Security Reviewer | Admin, then Viewer | C | RBAC, audit, policy controls, secret scanning |
| Technical Admin | Admin | C | Connector config, health, monitoring, docs |
| Enterprise Buyer | Admin | A, B, C, D | Honesty labels, real vs mock, polish, roadmap |

---

## Reference

- **[README.md](./README.md)** — Overview and login instructions
- **[TEST_SCRIPT.md](./TEST_SCRIPT.md)** — Step-by-step guided test flows
- **[FEEDBACK_FORM.md](./FEEDBACK_FORM.md)** — Structured feedback capture
- **[BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)** — Bug report template
