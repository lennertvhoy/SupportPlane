# SupportPlane — Bug Report Template

Use this template to report any unexpected behavior, errors, or issues you encounter during testing. A good bug report is worth its weight in code.

---

## Bug Report

| Field                | Value                               |
| -------------------- | ----------------------------------- |
| **Bug ID**           | (leave blank — will be assigned)    |
| **Date/time**        |                                     |
| **Tester name/role** |                                     |
| **URL/page**         | e.g., `http://localhost:3300/admin` |
| **Browser**          | e.g., Chrome 124, Firefox 126       |

---

## What Were You Trying To Do?

Brief description of your goal:

---

## Steps to Reproduce

Numbered, exact steps. Be specific — include what you clicked, what you typed, and what you selected.

1.
2.
3.
4.

---

## Expected Result

What did you think would happen?

---

## Actual Result

What actually happened? Error messages, blank screens, wrong data, etc. Copy-paste any error text.

---

## Screenshot or Log

Attach or describe what the screen showed:

_(Paste screenshot link or description here)_

---

## Severity

| Option       | Description                                             |
| ------------ | ------------------------------------------------------- |
| **Critical** | System is unusable. Data loss or security breach.       |
| **Major**    | Feature is broken. Workflow blocked. No workaround.     |
| **Minor**    | Feature works incorrectly. Workaround exists.           |
| **Cosmetic** | Visual issue. Typo. Misalignment. No functional impact. |

**Severity:** **\*\***\_\_\_**\*\***

---

## Blocker Status

- **Blocker** — This issue prevents further testing of a flow.
- **Non-blocker** — Testing can continue.

**Status:** **\*\***\_\_\_**\*\***

---

## Component

- **Frontend** — UI, layout, rendering, browser behavior
- **Backend** — API, data, server errors
- **Connector** — Zammad, GLPI, osTicket, MeshCentral, Fortinet
- **Governance** — Policy, RBAC, audit, permissions
- **Docs** — Documentation error or omission
- **Other** (describe): **\*\***\_\_\_**\*\***

---

## Additional Notes

Anything else that might help reproduce or understand the issue:

---

---

---

## Example (Filled Out)

| Field         | Value                    |
| ------------- | ------------------------ |
| **Bug ID**    | —                        |
| **Date/time** | 2026-05-03 15:45         |
| **Tester**    | John Smith, MSP Owner    |
| **URL/page**  | `http://localhost:3300/` |
| **Browser**   | Chrome 124               |

**What were you trying to do?**
Load a Zammad ticket for an existing support session.

**Steps to reproduce:**

1. Log in as admin@supportplane.local
2. Click "New Session"
3. Enter title "Test session"
4. Select the new session from the sidebar
5. Enter "2" in the external ticket ID field
6. Click "Load ticket"

**Expected result:**
Ticket details should appear in the Ticket Context panel with subject, customer, and status.

**Actual result:**
"Internal Server Error" toast appeared. Ticket did not load. Console shows `POST /support-sessions/.../ticket-context 500`.

**Screenshot:** _(attached or described)_

**Severity:** Major
**Blocker:** Blocker (cannot proceed with Zammad flow)
**Component:** Connector
