import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ConnectorPolicyUpdateRequest,
  AiPolicyUpdateRequest,
  RetentionPolicyUpdateRequest,
  type ConnectorPolicy as ConnectorPolicyShape,
  type AiPolicy as AiPolicyShape,
  type RetentionPolicy as RetentionPolicyShape,
  type PolicySummary,
  type PolicyAuditPreview,
  type AuditEvent,
} from '@supportplane/contracts';
import type { CurrentIdentity } from '../auth/auth.types.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import { DeliveryPolicyService } from '../delivery-policy/delivery-policy.service.js';

function nowIso(): string {
  return new Date().toISOString();
}

function redactedDiff<T extends Record<string, unknown>>(
  before: T,
  after: T,
): Record<string, unknown> {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diff: Record<string, unknown> = {};
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = { changed: true };
    }
  }
  return diff;
}

@Injectable()
export class AdminPolicyService {
  constructor(
    @Inject(InMemoryStore) private readonly store: Store,
    @Inject(DeliveryPolicyService) private readonly deliveryPolicyService: DeliveryPolicyService,
  ) {}

  // ─── List all policies ────────────────────────────────────────────────────
  async listPolicies(identity: CurrentIdentity): Promise<{ policies: PolicySummary[] }> {
    const deliveryPolicies = await this.store.listDeliveryPolicies(identity.tenantId);
    const tenantPolicies = await this.store.listTenantPolicies(identity.tenantId);

    const summaries: PolicySummary[] = [
      ...deliveryPolicies.map((p) => ({
        policyType: 'delivery' as const,
        id: p.id,
        name: p.name,
        enabled: p.enabled,
        killSwitch: p.killSwitch,
        version: p.policyVersion,
        updatedAt: p.updatedAt,
        updatedBy: p.updatedBy,
      })),
      ...tenantPolicies.map((p) => ({
        policyType: p.policyType as PolicySummary['policyType'],
        id: p.id,
        name: p.name,
        enabled: p.enabled,
        killSwitch: (p as ConnectorPolicyShape).killSwitch,
        version: p.version,
        updatedAt: p.updatedAt,
        updatedBy: p.updatedBy,
        scopeCount: p.policyType === 'connector' ? 1 : undefined,
      })),
    ];

    return { policies: summaries };
  }

  // ─── Delivery policy (delegated) ──────────────────────────────────────────
  async updateDeliveryPolicy(identity: CurrentIdentity, id: string, rawBody: unknown) {
    return this.deliveryPolicyService.updatePolicy(identity, id, rawBody);
  }

  // ─── Connector policy ─────────────────────────────────────────────────────
  async getConnectorPolicy(
    identity: CurrentIdentity,
    installationId: string,
  ): Promise<{ policy: ConnectorPolicyShape }> {
    let policy = (await this.store.getTenantPolicy(
      identity.tenantId,
      'connector',
      installationId,
    )) as ConnectorPolicyShape | undefined;
    if (!policy) {
      policy = this.createDefaultConnectorPolicy(identity.tenantId, installationId);
      await this.store.saveTenantPolicy(policy, 'connector', installationId);
    }
    return { policy };
  }

  async updateConnectorPolicy(
    identity: CurrentIdentity,
    installationId: string,
    rawBody: unknown,
  ): Promise<{ policy: ConnectorPolicyShape }> {
    const body = ConnectorPolicyUpdateRequest.parse(rawBody);
    const existing = await this.getConnectorPolicy(identity, installationId);

    // Safety: reject real network/writeback enablement
    if (body.safetyFlags) {
      if (
        body.safetyFlags.realNetworkAllowed === true ||
        body.safetyFlags.writebackEnabled === true ||
        body.safetyFlags.externalWriteAllowed === true
      ) {
        throw new BadRequestException('Real writeback not implemented.');
      }
    }

    const before = { ...existing.policy };
    const updated: ConnectorPolicyShape = {
      ...existing.policy,
      enabled: body.enabled ?? existing.policy.enabled,
      killSwitch: body.killSwitch ?? existing.policy.killSwitch,
      allowedActionTypes: body.allowedActionTypes ?? existing.policy.allowedActionTypes,
      approvalRequired: body.approvalRequired ?? existing.policy.approvalRequired,
      minimumApproverRole: body.minimumApproverRole ?? existing.policy.minimumApproverRole,
      requireEvidenceBundleBeforeDelivery:
        body.requireEvidenceBundleBeforeDelivery ??
        existing.policy.requireEvidenceBundleBeforeDelivery,
      requireConnectorValidationBeforeDelivery:
        body.requireConnectorValidationBeforeDelivery ??
        existing.policy.requireConnectorValidationBeforeDelivery,
      maxRetries: body.maxRetries ?? existing.policy.maxRetries,
      backoffSeconds: body.backoffSeconds ?? existing.policy.backoffSeconds,
      safetyFlags: body.safetyFlags
        ? {
            realNetworkAllowed:
              body.safetyFlags.realNetworkAllowed ?? existing.policy.safetyFlags.realNetworkAllowed,
            writebackEnabled:
              body.safetyFlags.writebackEnabled ?? existing.policy.safetyFlags.writebackEnabled,
            externalWriteAllowed:
              body.safetyFlags.externalWriteAllowed ??
              existing.policy.safetyFlags.externalWriteAllowed,
            mockOnly: body.safetyFlags.mockOnly ?? existing.policy.safetyFlags.mockOnly,
            sandboxOnly: body.safetyFlags.sandboxOnly ?? existing.policy.safetyFlags.sandboxOnly,
          }
        : existing.policy.safetyFlags,
      version: existing.policy.version + 1,
      updatedBy: identity.userId,
      updatedAt: nowIso(),
    };

    await this.store.saveTenantPolicy(updated, 'connector', installationId);
    await this.audit(
      identity,
      'connector_policy_updated',
      undefined,
      'connector_policy',
      updated.id,
      {
        policyVersion: updated.version,
        connectorInstallationId: installationId,
        diff: redactedDiff(
          before as unknown as Record<string, unknown>,
          updated as unknown as Record<string, unknown>,
        ),
      },
    );

    return { policy: updated };
  }

  // ─── AI policy ────────────────────────────────────────────────────────────
  async getAiPolicy(identity: CurrentIdentity): Promise<{ policy: AiPolicyShape }> {
    let policy = (await this.store.getTenantPolicy(identity.tenantId, 'ai', null)) as
      | AiPolicyShape
      | undefined;
    if (!policy) {
      policy = this.createDefaultAiPolicy(identity.tenantId);
      await this.store.saveTenantPolicy(policy, 'ai', null);
    }
    return { policy };
  }

  async updateAiPolicy(
    identity: CurrentIdentity,
    rawBody: unknown,
  ): Promise<{ policy: AiPolicyShape }> {
    const body = AiPolicyUpdateRequest.parse(rawBody);
    const existing = await this.getAiPolicy(identity);

    // Safety: reject cloud calls or disabling mock-only
    if (body.safetyFlags) {
      if (body.safetyFlags.cloudCallsAllowed === true) {
        throw new BadRequestException('Cloud AI providers not permitted in this environment.');
      }
      if (body.safetyFlags.mockOnly === false) {
        throw new BadRequestException('Mock-only mode cannot be disabled.');
      }
    }
    if (body.allowAutonomousSend === true) {
      throw new BadRequestException('Autonomous send not permitted.');
    }

    const before = { ...existing.policy };
    const updated: AiPolicyShape = {
      ...existing.policy,
      enabled: body.enabled ?? existing.policy.enabled,
      killSwitch: body.killSwitch ?? existing.policy.killSwitch,
      allowedProviders: body.allowedProviders ?? existing.policy.allowedProviders,
      allowedModels: body.allowedModels ?? existing.policy.allowedModels,
      maxTokensPerRequest: body.maxTokensPerRequest ?? existing.policy.maxTokensPerRequest,
      maxCostPerDayUsd: body.maxCostPerDayUsd ?? existing.policy.maxCostPerDayUsd,
      requireHumanReview: body.requireHumanReview ?? existing.policy.requireHumanReview,
      allowAutonomousSend: body.allowAutonomousSend ?? existing.policy.allowAutonomousSend,
      allowDraftGeneration: body.allowDraftGeneration ?? existing.policy.allowDraftGeneration,
      allowGreetingSuggestions:
        body.allowGreetingSuggestions ?? existing.policy.allowGreetingSuggestions,
      allowScreenContext: body.allowScreenContext ?? existing.policy.allowScreenContext,
      redactionRequired: body.redactionRequired ?? existing.policy.redactionRequired,
      safetyFlags: body.safetyFlags
        ? {
            cloudCallsAllowed:
              body.safetyFlags.cloudCallsAllowed ?? existing.policy.safetyFlags.cloudCallsAllowed,
            localProvidersOnly:
              body.safetyFlags.localProvidersOnly ?? existing.policy.safetyFlags.localProvidersOnly,
            mockOnly: body.safetyFlags.mockOnly ?? existing.policy.safetyFlags.mockOnly,
            reviewRequired:
              body.safetyFlags.reviewRequired ?? existing.policy.safetyFlags.reviewRequired,
          }
        : existing.policy.safetyFlags,
      version: existing.policy.version + 1,
      updatedBy: identity.userId,
      updatedAt: nowIso(),
    };

    await this.store.saveTenantPolicy(updated, 'ai', null);
    await this.audit(identity, 'ai_policy_updated', undefined, 'ai_policy', updated.id, {
      policyVersion: updated.version,
      diff: redactedDiff(
        before as unknown as Record<string, unknown>,
        updated as unknown as Record<string, unknown>,
      ),
    });

    return { policy: updated };
  }

  // ─── Retention policy ─────────────────────────────────────────────────────
  async getRetentionPolicy(identity: CurrentIdentity): Promise<{ policy: RetentionPolicyShape }> {
    let policy = (await this.store.getTenantPolicy(identity.tenantId, 'retention', null)) as
      | RetentionPolicyShape
      | undefined;
    if (!policy) {
      policy = this.createDefaultRetentionPolicy(identity.tenantId);
      await this.store.saveTenantPolicy(policy, 'retention', null);
    }
    return { policy };
  }

  async updateRetentionPolicy(
    identity: CurrentIdentity,
    rawBody: unknown,
  ): Promise<{ policy: RetentionPolicyShape }> {
    const body = RetentionPolicyUpdateRequest.parse(rawBody);
    const existing = await this.getRetentionPolicy(identity);

    // Safety: auto-purge requires approval
    if (body.autoPurgeEnabled === true && body.purgeRequiresApproval !== false) {
      const willRequireApproval =
        body.purgeRequiresApproval ?? existing.policy.purgeRequiresApproval;
      if (!willRequireApproval) {
        throw new BadRequestException('Auto-purge without approval is not permitted.');
      }
    }

    const before = { ...existing.policy };
    const updated: RetentionPolicyShape = {
      ...existing.policy,
      enabled: body.enabled ?? existing.policy.enabled,
      sessionRetentionDays: body.sessionRetentionDays ?? existing.policy.sessionRetentionDays,
      auditLogRetentionDays: body.auditLogRetentionDays ?? existing.policy.auditLogRetentionDays,
      callRecordingRetentionDays:
        body.callRecordingRetentionDays ?? existing.policy.callRecordingRetentionDays,
      screenObservationRetentionDays:
        body.screenObservationRetentionDays ?? existing.policy.screenObservationRetentionDays,
      evidenceBundleRetentionDays:
        body.evidenceBundleRetentionDays ?? existing.policy.evidenceBundleRetentionDays,
      actionOutboxRetentionDays:
        body.actionOutboxRetentionDays ?? existing.policy.actionOutboxRetentionDays,
      promptRetentionMode: body.promptRetentionMode ?? existing.policy.promptRetentionMode,
      outputRetentionMode: body.outputRetentionMode ?? existing.policy.outputRetentionMode,
      promptRetentionDays: body.promptRetentionDays ?? existing.policy.promptRetentionDays,
      outputRetentionDays: body.outputRetentionDays ?? existing.policy.outputRetentionDays,
      autoPurgeEnabled: body.autoPurgeEnabled ?? existing.policy.autoPurgeEnabled,
      purgeRequiresApproval: body.purgeRequiresApproval ?? existing.policy.purgeRequiresApproval,
      minimumPurgeApproverRole:
        body.minimumPurgeApproverRole ?? existing.policy.minimumPurgeApproverRole,
      version: existing.policy.version + 1,
      updatedBy: identity.userId,
      updatedAt: nowIso(),
    };

    await this.store.saveTenantPolicy(updated, 'retention', null);
    await this.audit(
      identity,
      'retention_policy_updated',
      undefined,
      'retention_policy',
      updated.id,
      {
        policyVersion: updated.version,
        diff: redactedDiff(
          before as unknown as Record<string, unknown>,
          updated as unknown as Record<string, unknown>,
        ),
      },
    );

    return { policy: updated };
  }

  // ─── Audit preview ────────────────────────────────────────────────────────
  async auditPreview(identity: CurrentIdentity): Promise<PolicyAuditPreview> {
    const deliveryPolicies = await this.store.listDeliveryPolicies(identity.tenantId);
    const tenantPolicies = await this.store.listTenantPolicies(identity.tenantId);

    const allPolicies = [
      ...deliveryPolicies.map((p) => ({
        policyType: 'delivery',
        policyId: p.id,
        policyName: p.name,
        version: p.policyVersion,
        enabled: p.enabled,
        safetyFlags: {
          realNetworkAllowed: p.safetyFlags.realNetworkAllowed,
          writebackEnabled: p.safetyFlags.writebackEnabled,
          externalWriteAllowed: p.safetyFlags.externalWriteAllowed,
          mockOnly: p.safetyFlags.mockOnly,
        },
      })),
      ...tenantPolicies.map((p) => ({
        policyType: p.policyType,
        policyId: p.id,
        policyName: p.name,
        version: p.version,
        enabled: p.enabled,
        safetyFlags: this.extractSafetyFlags(p),
      })),
    ];

    return {
      tenantId: identity.tenantId,
      generatedAt: nowIso(),
      policies: allPolicies as PolicyAuditPreview['policies'],
      disclaimers: [
        'This audit preview is generated from current policy snapshots.',
        'Historical policy versions are not included in this view.',
        'Safety flag evaluation is for informational purposes only.',
      ],
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private createDefaultConnectorPolicy(
    tenantId: string,
    connectorInstallationId: string,
  ): ConnectorPolicyShape {
    return {
      id: randomUUID(),
      tenantId,
      policyType: 'connector' as const,
      connectorInstallationId,
      name: 'Connector Policy',
      enabled: true,
      killSwitch: false,
      allowedActionTypes: ['ticket_note'],
      approvalRequired: true,
      minimumApproverRole: 'admin',
      requireEvidenceBundleBeforeDelivery: false,
      requireConnectorValidationBeforeDelivery: true,
      maxRetries: 3,
      backoffSeconds: 5,
      safetyFlags: {
        realNetworkAllowed: false,
        writebackEnabled: false,
        externalWriteAllowed: false,
        mockOnly: true,
        sandboxOnly: false,
      },
      updatedBy: null,
      updatedAt: nowIso(),
      version: 1,
      createdAt: nowIso(),
    };
  }

  private createDefaultAiPolicy(tenantId: string): AiPolicyShape {
    return {
      id: randomUUID(),
      tenantId,
      policyType: 'ai' as const,
      name: 'AI Policy',
      enabled: true,
      killSwitch: false,
      allowedProviders: ['mock', 'ollama', 'lmstudio'],
      allowedModels: [],
      maxTokensPerRequest: 4096,
      maxCostPerDayUsd: 100,
      requireHumanReview: true,
      allowAutonomousSend: false,
      allowDraftGeneration: true,
      allowGreetingSuggestions: true,
      allowScreenContext: false,
      redactionRequired: true,
      safetyFlags: {
        cloudCallsAllowed: false,
        localProvidersOnly: true,
        mockOnly: true,
        reviewRequired: true,
      },
      updatedBy: null,
      updatedAt: nowIso(),
      version: 1,
      createdAt: nowIso(),
    };
  }

  private createDefaultRetentionPolicy(tenantId: string): RetentionPolicyShape {
    return {
      id: randomUUID(),
      tenantId,
      policyType: 'retention' as const,
      name: 'Retention Policy',
      enabled: true,
      sessionRetentionDays: 365,
      auditLogRetentionDays: 1095,
      callRecordingRetentionDays: 90,
      screenObservationRetentionDays: 30,
      evidenceBundleRetentionDays: 365,
      actionOutboxRetentionDays: 90,
      promptRetentionMode: 'full',
      outputRetentionMode: 'full',
      promptRetentionDays: 365,
      outputRetentionDays: 365,
      autoPurgeEnabled: false,
      purgeRequiresApproval: true,
      minimumPurgeApproverRole: 'owner',
      updatedBy: null,
      updatedAt: nowIso(),
      version: 1,
      createdAt: nowIso(),
    };
  }

  private extractSafetyFlags(
    policy: ConnectorPolicyShape | AiPolicyShape | RetentionPolicyShape,
  ): Record<string, boolean> {
    if ('safetyFlags' in policy) {
      const flags: Record<string, boolean> = {};
      for (const [key, val] of Object.entries(policy.safetyFlags)) {
        flags[key] = Boolean(val);
      }
      return flags;
    }
    return {};
  }

  private async audit(
    identity: CurrentIdentity,
    eventType: string,
    sessionId: string | undefined,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown>,
  ) {
    const event: AuditEvent = {
      id: randomUUID() as AuditEvent['id'],
      tenantId: identity.tenantId as AuditEvent['tenantId'],
      sessionId,
      eventType: eventType as AuditEvent['eventType'],
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
