# Delivery Policy Controls

**Backlog:** BL-094
**Status:** closure-grade implementation with mock-only safety
**Last updated:** 2026-04-28

## Purpose

Delivery policy controls provide tenant-scoped, deterministic safety gates for
action writeback readiness. They enforce decisions before queueing and
processing support actions. All decisions return `realNetworkAllowed: false`,
`writebackEnabled: false`, `externalWriteAllowed: false`; real writeback remains
impossible.

## Delivery Policy Model

The `DeliveryPolicy` Prisma model stores tenant-scoped policy state:

| Field | Default | Description |
|-------|---------|-------------|
| `enabled` | `true` | Master enable for this policy |
| `killSwitch` | `false` | Emergency stop; blocks all delivery immediately |
| `dryRunRequired` | `true` | Dry-run mode is required (structural placeholder) |
| `mockOnlyEnforced` | `true` | All delivery is mock-only; cannot be disabled |
| `allowRealNetworkCalls` | `false` | Real network calls are blocked; toggle requests return 400 |
| `allowedActionTypes` | `["ticket_note"]` | Action-type allowlist |
| `approvalRequired` | `true` | Actions must be approved before queueing |
| `minimumApproverRole` | `"admin"` | Minimum role required for approval |
| `requireHumanReview` | `true` | Human review gate before delivery |
| `requireEvidenceBundleBeforeDelivery` | `false` | Evidence bundle gate |
| `requireConnectorValidationBeforeDelivery` | `false` | Connector validation gate |
| `retryPolicy` | `{ maxAttempts: 3, ... }` | Retry configuration |
| `deadLetterPolicy` | `{ enabled: true, ... }` | Dead-letter configuration |
| `policyVersion` | `1` | Incremented on every safe update |
| `updatedBy` | `null` | Actor who last updated the policy |
| `safetyFlags` | `{ realNetworkAllowed: false, ... }` | Immutable safety metadata |

## Policy Evaluation Gates (in order)

1. **killSwitch** → blocks immediately if `true`
2. **enabled** → blocks if `false`
3. **allowedActionTypes** → blocks if action type not in list
4. **approvalRequired** → blocks if action not approved
5. **minimumApproverRole** → blocks if actor role rank is insufficient
6. **requireHumanReview** → blocks if action not reviewed
7. **requireEvidenceBundleBeforeDelivery** → blocks if no evidence bundle
8. **requireConnectorValidationBeforeDelivery** → blocks if connector not validated

If all gates pass, decision is `mock_only_allowed` (since `mockOnlyEnforced` is
always `true`).

## Connector Readiness Gate

`POST /connector-installations/:id/readiness` returns:

- `readyForMockDelivery` — true only if policy allows, connector is active, and
  connector supports the action type
- `readyForRealWriteback` — always `false`
- `realNetwork` — always `false`
- `writebackEnabled` — always `false`
- `externalWriteAttempted` — always `false`

## Queue/Worker Policy Enforcement

- `ActionsService.queue()` evaluates policy before creating an outbox item.
  Blocked actions throw `ForbiddenException` with the policy decision.
- `ActionsService.processClaimedOutbox()` re-evaluates policy before processing.
  Blocked items create a `policy_blocked` attempt and move to `dead_lettered`.

## Kill Switch Behavior

When `killSwitch` is `true`:
- All queue attempts return 403 with `blocked_by_kill_switch`
- All process-once attempts result in `policy_blocked` dead-letter
- Audit events include `delivery_policy_blocked` with full decision metadata

## Approval and Minimum Role

- `approvalRequired: true` means only `approved`-status actions can be queued.
- `minimumApproverRole` uses role rank: viewer(0) < operator(1) < admin(2) < owner(3).
- The approver's role must meet or exceed the minimum role.

## Dev-Mode Fallback Behavior

When no `DeliveryPolicy` exists in the database for a tenant, the evaluator
returns a hardcoded dev-mode fallback decision:

- `allowed: true`
- `decision: 'mock_only_allowed'`
- `realNetworkAllowed: false`
- `writebackEnabled: false`
- `externalWriteAllowed: false`
- `safetyFlags.mockOnly: true`
- `safetyFlags.localDevOnly: true`

**Constraints:**
- This fallback is active only when the store returns no policy record.
- In local auth + PostgreSQL mode, seeded policies ensure a DB policy always
  exists for seeded tenants (`dev-tenant`, `alt-tenant`).
- The fallback cannot weaken local auth or postgres enforcement because:
  - It still returns `realNetworkAllowed: false` and `writebackEnabled: false`
  - It is still scoped to the tenant ID passed to the evaluator
  - RBAC checks happen before policy evaluation in controllers
  - The fallback decision is labeled `localDevOnly: true` and `policyVersion: 0`
- Production deployments must seed tenant policies and must not rely on this
  fallback for safety decisions.

## RBAC

- `delivery_policy:read` — required for GET list, GET by ID, validate, connector-readiness
- `delivery_policy:write` — required for PATCH updates
- Viewer role lacks `delivery_policy:write` and sees a read-only panel
- Admin/owner can update safe fields (killSwitch, approvalRequired, minimumApproverRole, allowedActionTypes, retryPolicy, deadLetterPolicy)

## Tenant Boundaries

- All policy lookups are scoped by `tenantId`
- Cross-tenant policy access returns 404 or 403
- Forged identity headers are ignored in local auth mode

## Evidence Bundle

Evidence bundles include a `deliveryPolicies` array with tenant-scoped policy
summaries, safety flags, and version metadata. No secrets, tokens, or connector
credentials are included.

## Audit Events

- `delivery_policy_updated` — safe field updated, includes version and updated fields
- `delivery_policy_evaluated` — policy evaluated for queue or process
- `delivery_policy_blocked` — policy blocked queue or process attempt

## Real Writeback Blocked

Any PATCH requesting `allowRealNetworkCalls=true`, `writebackEnabled=true`, or
`externalWriteAllowed=true` returns 400 with "Real writeback not implemented."
The UI shows mock-only locked ON and real network calls locked OFF.

## Known Limitations

- Policy evaluation is local and deterministic; no external policy source is used.
- Real writeback readiness gates are structural only; real writeback requires
  future connector credential management, network path validation, and tenant
  admin configuration.
- No production queue semantics, external broker, or distributed worker
  infrastructure exists.
- The dev-mode fallback is safe but must not be relied upon in production;
  always seed tenant policies.

## Verification

```bash
scripts/verify_delivery_policy_controls.sh
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPPORTPLANE_STORE` | `memory` | Use `postgres` for Prisma-backed policy persistence |
| `DATABASE_URL` | — | Required when `SUPPORTPLANE_STORE=postgres` |
