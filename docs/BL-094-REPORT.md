# BL-094 Report: Connector Writeback Readiness Gates and Delivery Policy Controls

**Date:** 2026-04-28  
**Status:** ✅ Complete, validated, committed  
**Commits:**

- Implementation: `26cf3154905b9223238fe65136744c5c0ce96386`
- State docs: `94c9b713deca6375ab6f4ff8936ca5e4d294e548`
- Screenshots: `7d5bcdce4c17c0f7672362a52b16e10462469ed5`

---

## 1. Purpose

BL-094 adds a **governance layer** between the action/outbox workflow and any future real writeback. It ensures:

- Every queued action is evaluated against a **tenant-scoped delivery policy** before entering the outbox.
- Every outbox item is re-evaluated against policy before processing.
- **Real writeback is structurally impossible** in the current codebase — all policy decisions return `realNetworkAllowed: false`.
- Admins can configure policy gates; viewers can only inspect.

---

## 2. What Changed

### 2.1 Database

| Change                  | Location                                                     |
| ----------------------- | ------------------------------------------------------------ |
| `DeliveryPolicy` model  | `prisma/schema.prisma`                                       |
| Migration applied       | `prisma/migrations/20260428094012_delivery_policy_controls/` |
| Default policies seeded | `prisma/seed.ts` (dev-tenant + alt-tenant)                   |

**Key fields:**

- `enabled`, `killSwitch` — master on/off switches
- `mockOnlyEnforced` (always `true`), `allowRealNetworkCalls` (always `false`)
- `allowedActionTypes` — whitelist of action types
- `approvalRequired`, `minimumApproverRole` — human approval gates
- `requireHumanReview`, `requireEvidenceBundleBeforeDelivery`, `requireConnectorValidationBeforeDelivery`
- `retryPolicy`, `deadLetterPolicy` — JSON policy configs
- `policyVersion` — increments on every update

### 2.2 Contracts

| File                                        | Contents                                                    |
| ------------------------------------------- | ----------------------------------------------------------- |
| `packages/contracts/src/delivery-policy.ts` | Zod schemas for policy, update request, decision, readiness |

**Safety in contracts:** `DeliveryPolicyUpdateRequest` explicitly rejects `allowRealNetworkCalls=true`, `writebackEnabled=true`, and `externalWriteAllowed=true` via `.refine()` validation.

### 2.3 Backend

| File                                                         | Responsibility                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `apps/api/src/delivery-policy/delivery-policy.service.ts`    | `evaluateDeliveryPolicy()`, `checkConnectorReadiness()`, `buildDecisionFromPolicy()` |
| `apps/api/src/delivery-policy/delivery-policy.controller.ts` | GET list, GET by ID, PATCH (admin only), POST validate, POST connector-readiness     |
| `apps/api/src/actions/actions.service.ts`                    | Policy enforcement in `queue()` and `processClaimedOutbox()`                         |
| `apps/api/src/store/prisma.store.ts`                         | Delivery policy CRUD                                                                 |
| `apps/api/src/store/in-memory.store.ts`                      | Delivery policy CRUD                                                                 |

**Policy evaluation gates (in order):**

1. `killSwitch` → blocked
2. `enabled` → blocked if disabled
3. `allowedActionTypes` → blocked if action type not in whitelist
4. `approvalRequired` → blocked if action not approved
5. `minimumApproverRole` → blocked if approver role too low
6. `requireHumanReview` → blocked if not reviewed
7. `requireEvidenceBundleBeforeDelivery` → blocked if no evidence bundle
8. `requireConnectorValidationBeforeDelivery` → blocked if connector not validated

### 2.4 Frontend

| File                                          | Responsibility                                        |
| --------------------------------------------- | ----------------------------------------------------- |
| `apps/web/components/DeliveryPolicyPanel.tsx` | Policy panel with admin edit / viewer read-only modes |
| `apps/web/lib/api.ts`                         | Delivery policy API client methods                    |

**Admin view:** Can toggle kill switch, approval required, minimum approver role, allowed action types, max attempts.  
**Viewer view:** All controls disabled. Message: "View-only. Admin role required to modify policy."

### 2.5 RBAC

New permissions added:

- `delivery_policy:read` — required to view policy
- `delivery_policy:write` — required to update policy

---

## 3. Verification Results

### 3.1 Automated Checks

| Check                                        | Result          |
| -------------------------------------------- | --------------- |
| `scripts/verify_delivery_policy_controls.sh` | ✅ 14/14 passed |
| API tests (`apps/api`)                       | ✅ 114/114      |
| Contract tests                               | ✅ 29/29        |
| Web tests                                    | ✅ 15/15        |
| AI tests                                     | ✅ 9/9          |
| Connector tests                              | ✅ 16/16        |
| Typecheck (all workspaces)                   | ✅ passed       |
| Lint                                         | ✅ passed       |
| State docs hygiene                           | ✅ passed       |
| Bootstrap gate                               | ✅ passed       |

### 3.2 Verification Script Checks

| #   | Check                                      | Status |
| --- | ------------------------------------------ | ------ |
| 1   | Local auth login                           | ✅     |
| 2   | Admin can read policy                      | ✅     |
| 3   | Admin can update policy                    | ✅     |
| 4   | Viewer denied write                        | ✅     |
| 5   | Forged headers ignored                     | ✅     |
| 6   | Cross-tenant denied                        | ✅     |
| 7   | Connector readiness (mock ready, not real) | ✅     |
| 8   | Policy validation endpoint                 | ✅     |
| 9   | Real writeback toggle blocked (400)        | ✅     |
| 10  | Action queue includes policy decision      | ✅     |
| 11  | Worker status (mock mode)                  | ✅     |
| 12  | Kill switch blocks queueing (403)          | ✅     |
| 13  | Audit events include policy events         | ✅     |
| 14  | Evidence bundle contains policy provenance | ✅     |

---

## 4. Browser Evidence

All screenshots are in:

```
output/playwright/session-094-delivery-policy-controls-foundation/
```

| #   | Filename                                     | What it shows                                                                     |
| --- | -------------------------------------------- | --------------------------------------------------------------------------------- |
| 01  | `01-login-local-auth.png`                    | Local auth login page                                                             |
| 02  | `02-admin-cockpit-delivery-policy-panel.png` | Admin cockpit with full Delivery Policy panel visible                             |
| 03  | `03-policy-validation-result.png`            | Policy validation result: `mock_only_allowed`                                     |
| 04  | `04-connector-readiness-result.png`          | Connector readiness: mock ready, real writeback not implemented                   |
| 05  | `05-session-audit-policy-events.png`         | Audit trail with `delivery_policy_evaluated` and `delivery_policy_blocked` events |
| 06  | `06-viewer-mode-readonly-policy.png`         | Viewer mode with all policy controls disabled                                     |

---

## 5. Safety Guarantees

| Claim                              | Evidence                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Real writeback is impossible       | All policy decisions return `realNetworkAllowed: false`                  |
| Real writeback toggle is blocked   | API returns 400 for any request setting `allowRealNetworkCalls=true`     |
| Policy is enforced at queue time   | `ActionsService.queue()` evaluates before outbox item creation           |
| Policy is enforced at process time | `ActionsService.processClaimedOutbox()` re-evaluates before processing   |
| Blocked actions are audited        | `delivery_policy_blocked` audit event with full decision metadata        |
| Viewer cannot modify policy        | UI controls disabled; server-side RBAC enforces `delivery_policy:write`  |
| Cross-tenant isolation             | All store queries are tenant-scoped; cross-tenant access returns 404/403 |
| Evidence bundles include policy    | Policy decision metadata is included in evidence bundle export           |

---

## 6. Known Limitations

- **Real writeback requires future work:** Connector credential management, network path validation, tenant admin configuration, and a deliberate decision to enable `allowRealNetworkCalls` (which is currently hard-rejected).
- **Dev-mode fallback:** When no DB policy exists, a hardcoded default decision returns `allowed: true` with `decision: mock_only_allowed` so that existing API tests continue to pass.
- **Local mock only:** All delivery is still local PostgreSQL-backed mock processing. No production queue, external broker, or real external integration exists.

---

## 7. Next Steps

- BL-094 is ready for CTO closure review.
- Next likely MVP slice: configurable connector installation settings (credentials, endpoints, validation) or production readiness hardening.
