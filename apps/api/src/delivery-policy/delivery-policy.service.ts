import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  DeliveryPolicyUpdateRequest,
  type DeliveryPolicyDecision,
  type ConnectorReadinessResult,
  type DeliveryPolicy as DeliveryPolicyShape,
  type AuditEvent,
} from '@supportplane/contracts';
import type { CurrentIdentity } from '../auth/auth.types.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import { ConnectorInstallationsService } from '../connector-installations/connector-installations.service.js';

function nowIso(): string {
  return new Date().toISOString();
}

const ROLE_RANK: Record<string, number> = {
  viewer: 0,
  operator: 1,
  admin: 2,
  owner: 3,
};

/**
 * Dev-mode fallback decision used ONLY when no DeliveryPolicy exists in the store.
 * This fallback is safe because it still returns mock-only flags and denies real
 * writeback. In local auth + postgres mode, seeded policies ensure this fallback
 * is never reached for seeded tenants. Production deployments must seed tenant
 * policies and must not rely on this fallback for safety decisions.
 */
const HARDCODED_DEFAULT_DECISION: DeliveryPolicyDecision = {
  allowed: true,
  decision: 'mock_only_allowed',
  reason: 'No default delivery policy found for tenant; safe mock fallback applied.',
  mode: 'mock',
  realNetworkAllowed: false,
  writebackEnabled: false,
  externalWriteAllowed: false,
  requiredApproverRole: null,
  policyVersion: 0,
  policyId: 'default-fallback',
  safetyFlags: {
    realNetworkAllowed: false,
    writebackEnabled: false,
    externalWriteAllowed: false,
    mockOnly: true,
    localDevOnly: true,
    sandboxOnly: false,
  },
};

@Injectable()
export class DeliveryPolicyService {
  constructor(
    @Inject(InMemoryStore) private readonly store: Store,
    @Inject(ConnectorInstallationsService) private readonly connectorService: ConnectorInstallationsService
  ) {}

  async listPolicies(identity: CurrentIdentity) {
    const policies = await this.store.listDeliveryPolicies(identity.tenantId);
    return { policies };
  }

  async getPolicy(identity: CurrentIdentity, id: string) {
    const policy = await this.store.getDeliveryPolicy(identity.tenantId, id);
    if (!policy) {
      throw new NotFoundException(`Delivery policy ${id} not found`);
    }
    return { policy };
  }

  async updatePolicy(identity: CurrentIdentity, id: string, rawBody: unknown) {
    const body = DeliveryPolicyUpdateRequest.parse(rawBody);

    // Reject any attempt to enable real writeback
    const update = body as Record<string, unknown>;
    if (update.allowRealNetworkCalls === true || update.writebackEnabled === true || update.externalWriteAllowed === true) {
      throw new BadRequestException('Real writeback not implemented.');
    }

    const existing = await this.store.getDeliveryPolicy(identity.tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Delivery policy ${id} not found`);
    }

    const updated: DeliveryPolicyShape = {
      ...existing,
      enabled: body.enabled ?? existing.enabled,
      killSwitch: body.killSwitch ?? existing.killSwitch,
      dryRunRequired: body.dryRunRequired ?? existing.dryRunRequired,
      mockOnlyEnforced: body.mockOnlyEnforced ?? existing.mockOnlyEnforced,
      allowedActionTypes: body.allowedActionTypes ?? existing.allowedActionTypes,
      approvalRequired: body.approvalRequired ?? existing.approvalRequired,
      minimumApproverRole: body.minimumApproverRole ?? existing.minimumApproverRole,
      requireHumanReview: body.requireHumanReview ?? existing.requireHumanReview,
      requireEvidenceBundleBeforeDelivery: body.requireEvidenceBundleBeforeDelivery ?? existing.requireEvidenceBundleBeforeDelivery,
      requireConnectorValidationBeforeDelivery: body.requireConnectorValidationBeforeDelivery ?? existing.requireConnectorValidationBeforeDelivery,
      retryPolicy: body.retryPolicy
        ? {
            maxAttempts: body.retryPolicy.maxAttempts ?? existing.retryPolicy.maxAttempts,
            baseDelaySeconds: body.retryPolicy.baseDelaySeconds ?? existing.retryPolicy.baseDelaySeconds,
            maxDelaySeconds: body.retryPolicy.maxDelaySeconds ?? existing.retryPolicy.maxDelaySeconds,
            backoffMultiplier: body.retryPolicy.backoffMultiplier ?? existing.retryPolicy.backoffMultiplier,
          }
        : existing.retryPolicy,
      deadLetterPolicy: body.deadLetterPolicy
        ? {
            enabled: body.deadLetterPolicy.enabled ?? existing.deadLetterPolicy.enabled,
            maxAttemptsBeforeDeadLetter: body.deadLetterPolicy.maxAttemptsBeforeDeadLetter ?? existing.deadLetterPolicy.maxAttemptsBeforeDeadLetter,
            requireManualRetry: body.deadLetterPolicy.requireManualRetry ?? existing.deadLetterPolicy.requireManualRetry,
          }
        : existing.deadLetterPolicy,
      policyVersion: existing.policyVersion + 1,
      updatedBy: identity.userId,
      updatedAt: nowIso(),
    };

    await this.store.saveDeliveryPolicy(updated);
    await this.audit(identity, 'delivery_policy_updated', undefined, 'delivery_policy', updated.id, {
      policyVersion: updated.policyVersion,
      updatedFields: Object.keys(body),
    });

    return { policy: updated };
  }

  async validatePolicy(identity: CurrentIdentity, id: string) {
    const policy = await this.store.getDeliveryPolicy(identity.tenantId, id);
    if (!policy) {
      throw new NotFoundException(`Delivery policy ${id} not found`);
    }
    const decision = this.buildDecisionFromPolicy(policy, 'ticket_note', 'admin', false, false, true, true);
    return { policy, decision };
  }

  async checkConnectorReadiness(
    identity: CurrentIdentity,
    connectorInstallationId: string,
    actionType = 'ticket_note'
  ): Promise<ConnectorReadinessResult> {
    const installation = await this.connectorService.getConnectorInstallation(identity, connectorInstallationId);

    const policy = await this.store.getDeliveryPolicyByConnector(identity.tenantId, connectorInstallationId)
      ?? await this.store.getDeliveryPolicyByConnector(identity.tenantId, null);

    const decision = policy
      ? this.buildDecisionFromPolicy(policy, actionType, 'admin', false, Boolean(installation.lastVerifiedAt), true, true)
      : HARDCODED_DEFAULT_DECISION;

    const capabilities = installation.config.capabilities as string[] | undefined;
    const connectorSupportsActionType = actionType === 'ticket_note'
      ? (capabilities?.includes('write_notes') ?? true)
      : false;

    const readyForMockDelivery = decision.allowed && installation.status === 'active' && connectorSupportsActionType;
    const isSandbox = decision.decision === 'sandbox_allowed';
    const sandboxWritebackReady = isSandbox && connectorSupportsActionType && installation.status === 'active';

    return {
      mode: isSandbox ? 'sandbox' : 'mock',
      readyForMockDelivery,
      readyForRealWriteback: false,
      sandboxWritebackReady,
      productionWritebackReady: false,
      publicReplyEnabled: false,
      realNetwork: isSandbox,
      writebackEnabled: sandboxWritebackReady,
      externalWriteAttempted: false,
      policyDecision: decision.decision,
      connectorInstalled: true,
      connectorActive: installation.status === 'active',
      connectorSupportsActionType,
      connectorValidationStatus: installation.lastVerifiedAt ? 'valid' : 'not_run',
      credentialsAbsentOrRedacted: true,
      policyVersion: decision.policyVersion,
      lastValidationResult: null,
      safetyFlags: decision.safetyFlags,
      registryPattern: true,
      adapterFactoryId: installation.adapterType,
      adapterRuntimeId: installation.id,
    };
  }

  async evaluateDeliveryPolicy(
    tenantId: string,
    actionType: string,
    connectorInstallationId: string | undefined,
    currentUserRole: string,
    hasEvidenceBundle: boolean,
    connectorValidated: boolean,
    actionIsApproved = false,
    actionIsReviewed = false
  ): Promise<DeliveryPolicyDecision> {
    const policy = connectorInstallationId
      ? (await this.store.getDeliveryPolicyByConnector(tenantId, connectorInstallationId))
      : (await this.store.getDeliveryPolicyByConnector(tenantId, null));

    if (!policy) {
      return HARDCODED_DEFAULT_DECISION;
    }

    return this.buildDecisionFromPolicy(policy, actionType, currentUserRole, hasEvidenceBundle, connectorValidated, actionIsApproved, actionIsReviewed);
  }

  private buildDecisionFromPolicy(
    policy: DeliveryPolicyShape,
    actionType: string,
    currentUserRole: string,
    hasEvidenceBundle: boolean,
    connectorValidated: boolean,
    actionIsApproved = false,
    actionIsReviewed = false
  ): DeliveryPolicyDecision {
    const sandboxEnabled = process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] === 'true';
    const safetyFlags = {
      realNetworkAllowed: false,
      writebackEnabled: false,
      externalWriteAllowed: false,
      mockOnly: true,
      localDevOnly: true,
      sandboxOnly: false,
    };

    if (policy.killSwitch) {
      return {
        allowed: false,
        decision: 'blocked_by_kill_switch',
        reason: 'Delivery is blocked by kill switch.',
        mode: 'mock',
        realNetworkAllowed: false,
        writebackEnabled: false,
        externalWriteAllowed: false,
        requiredApproverRole: null,
        policyVersion: policy.policyVersion,
        policyId: policy.id,
        safetyFlags,
      };
    }

    if (!policy.enabled) {
      return {
        allowed: false,
        decision: 'blocked_by_policy_disabled',
        reason: 'Delivery policy is disabled.',
        mode: 'mock',
        realNetworkAllowed: false,
        writebackEnabled: false,
        externalWriteAllowed: false,
        requiredApproverRole: null,
        policyVersion: policy.policyVersion,
        policyId: policy.id,
        safetyFlags,
      };
    }

    if (!policy.allowedActionTypes.includes(actionType)) {
      return {
        allowed: false,
        decision: 'blocked_by_action_type',
        reason: `Action type ${actionType} is not allowed by policy.`,
        mode: 'mock',
        realNetworkAllowed: false,
        writebackEnabled: false,
        externalWriteAllowed: false,
        requiredApproverRole: null,
        policyVersion: policy.policyVersion,
        policyId: policy.id,
        safetyFlags,
      };
    }

    if (policy.approvalRequired && !actionIsApproved) {
      return {
        allowed: false,
        decision: 'blocked_by_approval_required',
        reason: 'Approval is required before delivery.',
        mode: 'mock',
        realNetworkAllowed: false,
        writebackEnabled: false,
        externalWriteAllowed: false,
        requiredApproverRole: policy.minimumApproverRole,
        policyVersion: policy.policyVersion,
        policyId: policy.id,
        safetyFlags,
      };
    }

    if (ROLE_RANK[currentUserRole] < ROLE_RANK[policy.minimumApproverRole]) {
      return {
        allowed: false,
        decision: 'blocked_by_insufficient_approver_role',
        reason: `Current user role ${currentUserRole} does not meet minimum approver role ${policy.minimumApproverRole}.`,
        mode: 'mock',
        realNetworkAllowed: false,
        writebackEnabled: false,
        externalWriteAllowed: false,
        requiredApproverRole: policy.minimumApproverRole,
        policyVersion: policy.policyVersion,
        policyId: policy.id,
        safetyFlags,
      };
    }

    if (policy.requireHumanReview && !actionIsReviewed) {
      return {
        allowed: false,
        decision: 'blocked_by_human_review_required',
        reason: 'Human review is required before delivery.',
        mode: 'mock',
        realNetworkAllowed: false,
        writebackEnabled: false,
        externalWriteAllowed: false,
        requiredApproverRole: null,
        policyVersion: policy.policyVersion,
        policyId: policy.id,
        safetyFlags,
      };
    }

    if (policy.requireEvidenceBundleBeforeDelivery && !hasEvidenceBundle) {
      return {
        allowed: false,
        decision: 'blocked_by_evidence_required',
        reason: 'Evidence bundle is required before delivery.',
        mode: 'mock',
        realNetworkAllowed: false,
        writebackEnabled: false,
        externalWriteAllowed: false,
        requiredApproverRole: null,
        policyVersion: policy.policyVersion,
        policyId: policy.id,
        safetyFlags,
      };
    }

    if (policy.requireConnectorValidationBeforeDelivery && !connectorValidated) {
      return {
        allowed: false,
        decision: 'blocked_by_connector_validation_required',
        reason: 'Connector validation is required before delivery.',
        mode: 'mock',
        realNetworkAllowed: false,
        writebackEnabled: false,
        externalWriteAllowed: false,
        requiredApproverRole: null,
        policyVersion: policy.policyVersion,
        policyId: policy.id,
        safetyFlags,
      };
    }

    // All gates passed
    const allowSandbox = sandboxEnabled && !policy.mockOnlyEnforced;
    if (allowSandbox) {
      return {
        allowed: true,
        decision: 'sandbox_allowed',
        reason: 'Sandbox delivery allowed under current policy. No production writeback.',
        mode: 'sandbox',
        realNetworkAllowed: true,
        writebackEnabled: true,
        externalWriteAllowed: false,
        requiredApproverRole: null,
        policyVersion: policy.policyVersion,
        policyId: policy.id,
        safetyFlags: {
          ...safetyFlags,
          realNetworkAllowed: true,
          writebackEnabled: true,
          mockOnly: false,
          sandboxOnly: true,
        },
      };
    }

    return {
      allowed: true,
      decision: policy.mockOnlyEnforced ? 'mock_only_allowed' : 'allowed',
      reason: 'Delivery allowed under current policy.',
      mode: 'mock',
      realNetworkAllowed: false,
      writebackEnabled: false,
      externalWriteAllowed: false,
      requiredApproverRole: null,
      policyVersion: policy.policyVersion,
      policyId: policy.id,
      safetyFlags,
    };
  }

  private async audit(
    identity: CurrentIdentity,
    eventType: AuditEvent['eventType'],
    sessionId: string | undefined,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown>
  ) {
    const event: AuditEvent = {
      id: randomUUID() as AuditEvent['id'],
      tenantId: identity.tenantId as AuditEvent['tenantId'],
      sessionId,
      eventType,
      actorType: 'user',
      actorId: identity.userId as AuditEvent['actorId'],
      action: eventType,
      resourceType,
      resourceId: resourceId as AuditEvent['resourceId'],
      metadata: metadata as AuditEvent['metadata'],
      createdAt: nowIso(),
    };
    await this.store.saveAuditEvent(event);
  }
}
