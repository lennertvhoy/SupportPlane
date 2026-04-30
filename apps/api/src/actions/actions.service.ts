import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createConnection } from 'net';
import { AckPolicy, connect, StorageType, StringCodec } from 'nats';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  ActionOutboxAttempt,
  ActionOutboxItem,
  AuditEvent,
  NatsOutboxEnvelope,
  SupportAction,
  SupportActionCreateRequest,
  type DeliveryPolicyDecision,
} from '@supportplane/contracts';
import type { CurrentIdentity } from '../auth/auth.types.js';
import { hasPermission } from '../auth/rbac.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import { DeliveryPolicyService } from '../delivery-policy/delivery-policy.service.js';
import { ConnectorsService } from '../connectors/connectors.service.js';
import { CredentialResolverService } from '../credential-references/credential-resolver.service.js';
import { evaluateEgressPolicy } from '@supportplane/policy';

function nowIso(): string {
  return new Date().toISOString();
}

function preview(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/(api[_-]?token|password|secret)=\S+/gi, '$1=[REDACTED]')
    .slice(0, 480);
}

function redactedError(value: string): string {
  return preview(value).replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]');
}

function addSeconds(iso: string, seconds: number): string {
  return new Date(new Date(iso).getTime() + seconds * 1000).toISOString();
}

const MOCK_SAFETY_FLAGS = {
  mode: 'mock' as const,
  realNetwork: false as const,
  writebackEnabled: false as const,
  externalWriteAttempted: false as const,
  noSecrets: true,
  noRawMedia: true,
  localMockOnly: true,
  sandboxOnly: false,
};

const SANDBOX_SAFETY_FLAGS = {
  mode: 'sandbox' as const,
  realNetwork: true as const,
  writebackEnabled: true as const,
  externalWriteAttempted: false as const,
  noSecrets: true,
  noRawMedia: true,
  localMockOnly: false,
  sandboxOnly: true,
};

const NATS_STREAM = process.env['NATS_OUTBOX_STREAM'] ?? 'SUPPORTPLANE_OUTBOX';
const NATS_SUBJECT = process.env['NATS_OUTBOX_SUBJECT'] ?? 'supportplane.outbox.ready';
const NATS_CONSUMER = process.env['NATS_OUTBOX_CONSUMER'] ?? 'SUPPORTPLANE_WORKER';

type DeliverySimulation =
  | { outcome: 'success' }
  | { outcome: 'retryable_failure'; errorCode: string; errorMessage: string }
  | { outcome: 'non_retryable_failure'; errorCode: string; errorMessage: string };

@Injectable()
export class ActionsService {
  constructor(
    @Inject(InMemoryStore) private readonly store: Store,
    @Inject(DeliveryPolicyService) private readonly policyService: DeliveryPolicyService,
    @Inject(ConnectorsService) private readonly connectorsService: ConnectorsService,
    @Inject(CredentialResolverService) private readonly credentialResolver: CredentialResolverService
  ) {}

  async listSessionActions(identity: CurrentIdentity, sessionId: string) {
    await this.assertPermission(identity, 'action:read', sessionId);
    await this.requireSession(identity, sessionId);
    const actions = await this.store.listSupportActions(identity.tenantId, { sessionId });
    // Only return outbox items for actions that have reached queue or beyond.
    // Draft and review_required actions must not display outbox/attempt state.
    const hasQueuedOrDelivered = actions.some(
      (a) => a.status === 'queued' || a.status === 'mock_delivered' || a.status === 'failed'
    );
    const outboxItems = hasQueuedOrDelivered
      ? await this.store.listActionOutboxItems(identity.tenantId, { sessionId })
      : [];
    return { actions, outboxItems };
  }

  async createAction(identity: CurrentIdentity, sessionId: string, rawBody: unknown) {
    await this.assertPermission(identity, 'action:create', sessionId);
    await this.requireSession(identity, sessionId);
    const body = SupportActionCreateRequest.parse(rawBody);
    const at = nowIso();
    const idempotencyKey =
      body.idempotencyKey ?? `${identity.tenantId}:${sessionId}:${body.actionType}:${Buffer.from(body.body).toString('base64url').slice(0, 48)}`;
    const existing = (await this.store.listSupportActions(identity.tenantId, { sessionId })).find(
      (a) => a.idempotencyKey === idempotencyKey
    );
    if (existing) {
      return { action: existing, idempotentReplay: true };
    }
    const action: SupportAction = {
      id: randomUUID(),
      tenantId: identity.tenantId as SupportAction['tenantId'],
      sessionId,
      callEventId: body.callEventId,
      customerReferenceId: body.customerReferenceId,
      ticketReferenceId: body.ticketReferenceId,
      connectorInstallationId: body.connectorInstallationId,
      actionType: body.actionType,
      status: 'draft',
      idempotencyKey,
      requestedBy: identity.userId,
      payloadSummary: {
        externalTicketId: body.externalTicketId ?? 'not_provided',
        subject: body.subject ?? 'Support note',
        bodyLength: body.body.length,
        redactedPreview: preview(body.body),
        mockDeliveryScenario: body.mockDeliveryScenario ?? 'success',
        localOnly: true,
      },
      safeBodyPreview: preview(body.body),
      mockDevOnly: true,
      createdAt: at,
      updatedAt: at,
    };
    await this.store.saveSupportAction(action);
    await this.audit(identity, 'action_created', sessionId, 'support_action', action.id, {
      actionType: action.actionType,
      status: action.status,
      mockDevOnly: true,
    });
    return { action, idempotentReplay: false };
  }

  async getAction(identity: CurrentIdentity, id: string) {
    await this.assertPermission(identity, 'action:read');
    const action = await this.requireAction(identity, id);
    const outboxItems = await this.store.listActionOutboxItems(identity.tenantId, { supportActionId: id });
    return { action, outboxItems };
  }

  async submitForReview(identity: CurrentIdentity, id: string) {
    await this.assertPermission(identity, 'action:submit');
    const action = await this.requireAction(identity, id);
    if (action.status !== 'draft') throw new BadRequestException(`Cannot submit action from ${action.status}`);
    const updated = { ...action, status: 'review_required' as const, submittedAt: nowIso(), updatedAt: nowIso() };
    await this.store.saveSupportAction(updated);
    await this.audit(identity, 'action_submitted_for_review', action.sessionId, 'support_action', action.id, { status: updated.status });
    return { action: updated };
  }

  async approve(identity: CurrentIdentity, id: string, body: { reason?: string }) {
    await this.assertPermission(identity, 'action:approve');
    const action = await this.requireAction(identity, id);
    if (action.status !== 'review_required') throw new BadRequestException(`Cannot approve action from ${action.status}`);
    const updated = {
      ...action,
      status: 'approved' as const,
      reviewedBy: identity.userId,
      reviewDecision: 'approved' as const,
      reviewReason: body.reason,
      reviewedAt: nowIso(),
      updatedAt: nowIso(),
    };
    await this.store.saveSupportAction(updated);
    await this.audit(identity, 'action_approved', action.sessionId, 'support_action', action.id, { reviewedBy: identity.userId });
    return { action: updated };
  }

  async reject(identity: CurrentIdentity, id: string, body: { reason?: string }) {
    await this.assertPermission(identity, 'action:approve');
    const action = await this.requireAction(identity, id);
    if (action.status !== 'review_required') throw new BadRequestException(`Cannot reject action from ${action.status}`);
    const updated = {
      ...action,
      status: 'rejected' as const,
      reviewedBy: identity.userId,
      reviewDecision: 'rejected' as const,
      reviewReason: body.reason,
      reviewedAt: nowIso(),
      updatedAt: nowIso(),
    };
    await this.store.saveSupportAction(updated);
    await this.audit(identity, 'action_rejected', action.sessionId, 'support_action', action.id, { reason: body.reason ?? 'not_provided' });
    return { action: updated };
  }

  async queue(identity: CurrentIdentity, id: string) {
    await this.assertPermission(identity, 'action:approve');
    const action = await this.requireAction(identity, id);
    if (action.status !== 'approved') throw new BadRequestException(`Cannot queue action from ${action.status}`);

    const decision = await this.policyService.evaluateDeliveryPolicy(
      identity.tenantId,
      action.actionType,
      action.connectorInstallationId,
      'admin',
      false,
      false,
      true,
      true
    );

    if (!decision.allowed) {
      await this.audit(identity, 'delivery_policy_blocked', action.sessionId, 'support_action', action.id, { decision });
      throw new ForbiddenException({ message: decision.reason, policyDecision: decision });
    }

    await this.audit(identity, 'delivery_policy_evaluated', action.sessionId, 'support_action', action.id, { decision });

    const existing = (await this.store.listActionOutboxItems(identity.tenantId, { supportActionId: id }))[0];
    if (existing) return { action, outboxItem: existing, idempotentReplay: true };
    const at = nowIso();
    const isSandbox = decision.mode === 'sandbox';
    const safetyFlags = isSandbox ? SANDBOX_SAFETY_FLAGS : MOCK_SAFETY_FLAGS;
    const outboxItem: ActionOutboxItem = {
      id: randomUUID(),
      tenantId: identity.tenantId as ActionOutboxItem['tenantId'],
      supportActionId: action.id,
      sessionId: action.sessionId,
      connectorInstallationId: action.connectorInstallationId,
      actionType: action.actionType,
      status: 'queued',
      idempotencyKey: `${action.idempotencyKey}:outbox`,
      deliveryMode: isSandbox ? 'sandbox' : 'mock',
      deliveryIntent: {
        mode: isSandbox ? 'sandbox' : 'mock',
        actionType: action.actionType,
        deliveryClaim: isSandbox ? 'queued_for_sandbox_delivery' : 'queued_for_mock_delivery',
        mockDeliveryScenario: action.payloadSummary['mockDeliveryScenario'] ?? 'success',
        realNetwork: isSandbox,
        writebackEnabled: isSandbox,
        externalWriteAttempted: false,
        policyDecision: decision.decision,
        policyVersion: decision.policyVersion,
      },
      attemptCount: 0,
      maxAttempts: 3,
      queuedAt: at,
      lastErrorRedacted: true,
      safetyFlags,
      mockDevOnly: !isSandbox,
      createdAt: at,
      updatedAt: at,
    };
    const updated = {
      ...action,
      status: 'queued' as const,
      queuedAt: at,
      updatedAt: at,
      payloadSummary: {
        ...action.payloadSummary,
        policyDecision: decision.decision,
      },
    };
    await this.store.saveSupportAction(updated);
    await this.store.saveActionOutboxItem(outboxItem);
    await this.publishOutboxEnvelope(outboxItem);
    await this.audit(identity, 'action_queued', action.sessionId, 'support_action', action.id, { outboxItemId: outboxItem.id });
    await this.audit(identity, 'outbox_item_created', action.sessionId, 'action_outbox_item', outboxItem.id, outboxItem.deliveryIntent);
    return { action: updated, outboxItem, idempotentReplay: false };
  }

  async mockDeliverAction(identity: CurrentIdentity, id: string) {
    await this.requireAction(identity, id);
    const item = (await this.store.listActionOutboxItems(identity.tenantId, { supportActionId: id }))[0];
    if (!item) throw new BadRequestException('Action has no queued outbox item');
    return this.mockDeliverOutbox(identity, item.id);
  }

  async cancel(identity: CurrentIdentity, id: string, body: { reason?: string }) {
    await this.assertPermission(identity, 'action:cancel');
    const action = await this.requireAction(identity, id);
    if (['mock_delivered', 'rejected', 'cancelled'].includes(action.status)) {
      throw new BadRequestException(`Cannot cancel action from ${action.status}`);
    }
    const updated = { ...action, status: 'cancelled' as const, failureReason: body.reason, updatedAt: nowIso() };
    await this.store.saveSupportAction(updated);
    const outboxItems = await this.store.listActionOutboxItems(identity.tenantId, { supportActionId: id });
    for (const item of outboxItems.filter((candidate) => ['queued', 'processing', 'failed', 'retry_scheduled'].includes(candidate.status))) {
      await this.store.saveActionOutboxItem({
        ...item,
        status: 'cancelled',
        latestAttemptState: 'cancelled',
        cancelledAt: updated.updatedAt,
        lastErrorMessage: redactedError(body.reason ?? 'action_cancelled'),
        lastErrorRedacted: true,
        workerLockId: undefined,
        workerLockedAt: undefined,
        workerLockExpiresAt: undefined,
        updatedAt: updated.updatedAt,
      });
      await this.audit(identity, 'outbox_cancelled', action.sessionId, 'action_outbox_item', item.id, { reason: body.reason ?? 'not_provided' });
    }
    await this.audit(identity, 'action_cancelled', action.sessionId, 'support_action', action.id, { reason: body.reason ?? 'not_provided' });
    return { action: updated };
  }

  async listOutbox(identity: CurrentIdentity) {
    await this.assertPermission(identity, 'outbox:read');
    const outboxItems = await this.store.listActionOutboxItems(identity.tenantId);
    return { outboxItems, summary: this.outboxSummary(outboxItems) };
  }

  async getOutbox(identity: CurrentIdentity, id: string) {
    await this.assertPermission(identity, 'outbox:read');
    const outboxItem = await this.requireOutbox(identity, id);
    const attempts = await this.store.listActionOutboxAttempts(identity.tenantId, id);
    return { outboxItem, attempts };
  }

  async retryOutbox(identity: CurrentIdentity, id: string) {
    await this.assertPermission(identity, 'outbox:retry');
    const item = await this.requireOutbox(identity, id);
    if (!['failed', 'retry_scheduled', 'dead_lettered'].includes(item.status)) {
      throw new BadRequestException(`Cannot retry outbox item from ${item.status}`);
    }
    const at = nowIso();
    const updated = {
      ...item,
      status: 'queued' as const,
      latestAttemptState: 'retry_requested' as const,
      nextAttemptAt: undefined,
      workerLockId: undefined,
      workerLockedAt: undefined,
      workerLockExpiresAt: undefined,
      deadLetteredAt: undefined,
      deadLetterReason: undefined,
      updatedAt: at,
    };
    const action = await this.requireAction(identity, item.supportActionId);
    await this.store.saveActionOutboxItem(updated);
    await this.store.saveSupportAction({ ...action, status: 'queued', failureReason: undefined, updatedAt: at });
    await this.audit(identity, 'outbox_retry_requested', item.sessionId, 'action_outbox_item', item.id, {
      supportActionId: item.supportActionId,
      requestedBy: identity.userId,
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
    });
    return { outboxItem: updated };
  }

  async cancelOutbox(identity: CurrentIdentity, id: string, body: { reason?: string }) {
    await this.assertPermission(identity, 'outbox:cancel');
    const item = await this.requireOutbox(identity, id);
    if (!['queued', 'processing', 'failed', 'retry_scheduled'].includes(item.status)) {
      throw new BadRequestException(`Cannot cancel outbox item from ${item.status}`);
    }
    const action = await this.requireAction(identity, item.supportActionId);
    const at = nowIso();
    const reason = redactedError(body.reason ?? 'cancelled_by_admin');
    const updatedItem = {
      ...item,
      status: 'cancelled' as const,
      latestAttemptState: 'cancelled' as const,
      cancelledAt: at,
      lastErrorMessage: reason,
      lastErrorRedacted: true,
      workerLockId: undefined,
      workerLockedAt: undefined,
      workerLockExpiresAt: undefined,
      updatedAt: at,
    };
    const updatedAction = { ...action, status: 'cancelled' as const, failureReason: reason, updatedAt: at };
    await this.store.saveActionOutboxItem(updatedItem);
    await this.store.saveSupportAction(updatedAction);
    await this.audit(identity, 'outbox_cancelled', item.sessionId, 'action_outbox_item', item.id, { reason, cancelledBy: identity.userId });
    await this.audit(identity, 'action_cancelled', item.sessionId, 'support_action', action.id, { reason, cancelledBy: identity.userId });
    return { action: updatedAction, outboxItem: updatedItem };
  }

  async deadLetterOutbox(identity: CurrentIdentity, id: string, body: { reason?: string }) {
    await this.assertPermission(identity, 'outbox:dead_letter');
    const item = await this.requireOutbox(identity, id);
    if (!['failed', 'retry_scheduled', 'processing'].includes(item.status)) {
      throw new BadRequestException(`Cannot dead-letter outbox item from ${item.status}`);
    }
    return this.markDeadLetter(identity, item, redactedError(body.reason ?? item.lastErrorMessage ?? item.lastError ?? 'manual_dead_letter'));
  }

  async getWorkerStatus(identity: CurrentIdentity) {
    await this.assertPermission(identity, 'worker:read');
    const items = await this.store.listActionOutboxItems(identity.tenantId);
    const status = {
      mode: 'local_mock_worker',
      status: 'available',
      consumerEnabled: true,
      queueBackend: process.env['SUPPORTPLANE_QUEUE_BACKEND'] === 'nats-jetstream' ? 'nats-jetstream' : 'postgres-local-outbox',
      fallbackQueueBackend: 'postgres-local-outbox',
      nats: {
        enabled: process.env['SUPPORTPLANE_QUEUE_BACKEND'] === 'nats-jetstream',
        urlConfigured: Boolean(process.env['NATS_URL']),
        streamName: NATS_STREAM,
        subject: NATS_SUBJECT,
        consumerName: NATS_CONSUMER,
        bridgeMode: 'postgres-canonical-jetstream-bridge',
      },
      storeMode: process.env['SUPPORTPLANE_STORE'] ?? 'memory',
      deliveryMode: process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] === 'true' ? 'sandbox_available' : 'mock',
      realNetwork: process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] === 'true',
      writebackEnabled: process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] === 'true',
      externalWriteAttempted: false,
      summary: this.outboxSummary(items),
      warnings: [
        process.env['SUPPORTPLANE_QUEUE_BACKEND'] === 'nats-jetstream'
          ? 'NATS JetStream bridge is local sandbox only; PostgreSQL remains canonical outbox truth.'
          : 'Local PostgreSQL outbox worker foundation only.',
        process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] === 'true'
          ? 'Sandbox writeback is enabled. Only internal notes to local Zammad sandbox. No public replies. No production.'
          : 'No real Zammad writeback, email, telephony, cloud AI, production broker HA, or production queue semantics.',
      ],
      checkedAt: nowIso(),
      mockDevOnly: process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] !== 'true',
    };
    await this.audit(identity, 'outbox_worker_status_checked', undefined, 'worker', identity.tenantId, status);
    return status;
  }

  async processOutboxOnce(identity: CurrentIdentity, body: { outboxItemId?: string; workerId?: string; dryRun?: boolean }) {
    await this.assertPermission(identity, 'outbox:process_once');
    const workerId = body.workerId ?? `api-process-once:${identity.userId}`;
    const at = nowIso();
    const isSandbox = process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] === 'true';
    await this.audit(identity, 'outbox_process_once_requested', undefined, 'worker', identity.tenantId, {
      workerId,
      outboxItemId: body.outboxItemId ?? 'next_available',
      mode: isSandbox ? 'sandbox' : 'mock',
      realNetwork: isSandbox,
      writebackEnabled: isSandbox,
      externalWriteAttempted: false,
      dryRun: body.dryRun ?? false,
    });
    const item = await this.store.claimNextActionOutboxItem(identity.tenantId, {
      workerId,
      now: at,
      lockExpiresAt: addSeconds(at, 60),
      outboxItemId: body.outboxItemId,
    });
    if (!item) return { processed: false, reason: 'no_eligible_outbox_item', workerId, mode: isSandbox ? 'sandbox' : 'mock' };
    await this.audit(identity, 'outbox_processing_started', item.sessionId, 'action_outbox_item', item.id, {
      workerId,
      attemptNumber: item.attemptCount + 1,
      mode: item.deliveryMode,
      realNetwork: item.deliveryMode === 'sandbox',
      writebackEnabled: item.deliveryMode === 'sandbox',
      externalWriteAttempted: false,
      dryRun: body.dryRun ?? false,
    });
    return this.processClaimedOutbox(identity, item, workerId, { dryRun: body.dryRun });
  }

  async mockDeliverOutbox(identity: CurrentIdentity, id: string) {
    await this.assertPermission(identity, 'outbox:mock_deliver');
    const item = await this.requireOutbox(identity, id);
    if (!['queued', 'retry_scheduled'].includes(item.status)) throw new BadRequestException(`Cannot mock deliver outbox item from ${item.status}`);
    const claimed = await this.store.claimNextActionOutboxItem(identity.tenantId, {
      workerId: `manual-mock-deliver:${identity.userId}`,
      now: nowIso(),
      lockExpiresAt: addSeconds(nowIso(), 60),
      outboxItemId: item.id,
    });
    if (!claimed) throw new BadRequestException('Outbox item is not eligible for mock delivery');
    return this.processClaimedOutbox(identity, claimed, `manual-mock-deliver:${identity.userId}`, { forceSuccess: true });
  }

  private async processClaimedOutbox(
    identity: CurrentIdentity,
    item: ActionOutboxItem,
    workerId: string,
    options?: { forceSuccess?: boolean; dryRun?: boolean }
  ) {
    const action = await this.requireAction(identity, item.supportActionId);

    // Re-evaluate delivery policy before processing (BL-094)
    const connectorInstallation = action.connectorInstallationId
      ? await this.store.getConnectorInstallation(identity.tenantId, action.connectorInstallationId)
      : undefined;
    const decision = await this.policyService.evaluateDeliveryPolicy(
      identity.tenantId,
      action.actionType,
      action.connectorInstallationId,
      'admin',
      false,
      Boolean(connectorInstallation?.lastVerifiedAt),
      true,
      true
    );

    if (!decision.allowed) {
      return this.handlePolicyBlock(identity, item, action, workerId, decision);
    }

    const isSandbox = item.deliveryMode === 'sandbox' || decision.mode === 'sandbox';
    const isDryRun = options?.dryRun === true;

    if (isSandbox) {
      return this.processSandboxWriteback(identity, item, action, workerId, connectorInstallation, decision, isDryRun);
    }

    const at = nowIso();
    const simulation = options?.forceSuccess ? { outcome: 'success' as const } : this.simulateDelivery(item);
    if (simulation.outcome === 'success') {
      const deliveryResult = {
        mode: 'mock',
        realNetwork: false,
        writebackEnabled: false,
        externalWriteAttempted: false,
        deliveryClaim: 'mock_delivered',
        externalReferenceId: null,
        responseSummary: 'Mock delivery recorded locally. No external connector was contacted.',
        workerId,
        deliveredAt: at,
      };
      const attempt: ActionOutboxAttempt = {
        id: randomUUID(),
        tenantId: identity.tenantId as ActionOutboxAttempt['tenantId'],
        outboxItemId: item.id,
        supportActionId: action.id,
        attemptNumber: item.attemptCount + 1,
        state: 'mock_delivered',
        deliveryResult,
        errorRedacted: true,
        attemptedAt: item.processingStartedAt ?? at,
        completedAt: at,
        mockDevOnly: true,
      };
      const updatedItem = {
        ...item,
        status: 'mock_delivered' as const,
        attemptCount: item.attemptCount + 1,
        latestAttemptState: 'mock_delivered' as const,
        mockDeliveredAt: at,
        workerLockId: undefined,
        workerLockedAt: undefined,
        workerLockExpiresAt: undefined,
        updatedAt: at,
      };
      const updatedAction = { ...action, status: 'mock_delivered' as const, mockDeliveredAt: at, updatedAt: at };
      await this.store.saveActionOutboxAttempt(attempt);
      await this.store.saveActionOutboxItem(updatedItem);
      await this.store.saveSupportAction(updatedAction);
      await this.audit(identity, 'outbox_item_attempted', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
      await this.audit(identity, 'outbox_processing_succeeded', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
      await this.audit(identity, 'action_mock_delivered', item.sessionId, 'support_action', action.id, deliveryResult);
      return { processed: true, action: updatedAction, outboxItem: updatedItem, attempt, delivery: deliveryResult, workerId };
    }

    const errorMessage = redactedError(simulation.errorMessage);
    const attemptNumber = item.attemptCount + 1;
    const deliveryResult = {
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
      deliveryClaim: 'mock_delivery_failed',
      retryable: simulation.outcome === 'retryable_failure',
      errorCode: simulation.errorCode,
      errorMessage,
      workerId,
      failedAt: at,
    };
    const attempt: ActionOutboxAttempt = {
      id: randomUUID(),
      tenantId: identity.tenantId as ActionOutboxAttempt['tenantId'],
      outboxItemId: item.id,
      supportActionId: action.id,
      attemptNumber,
      state: 'failed',
      deliveryResult,
      errorCode: simulation.errorCode,
      errorMessage,
      errorRedacted: true,
      attemptedAt: item.processingStartedAt ?? at,
      completedAt: at,
      mockDevOnly: true,
    };
    await this.store.saveActionOutboxAttempt(attempt);
    await this.audit(identity, 'outbox_item_attempted', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
    await this.audit(identity, 'outbox_processing_failed', item.sessionId, 'action_outbox_item', item.id, deliveryResult);

    if (simulation.outcome === 'non_retryable_failure' || attemptNumber >= item.maxAttempts) {
      const result = await this.markDeadLetter(identity, { ...item, attemptCount: attemptNumber }, errorMessage, simulation.errorCode);
      return { ...result, processed: true, attempt, delivery: deliveryResult, workerId };
    }

    const nextAttemptAt = addSeconds(at, Math.min(300, 5 * 2 ** (attemptNumber - 1)));
    const updatedItem = {
      ...item,
      status: 'retry_scheduled' as const,
      attemptCount: attemptNumber,
      latestAttemptState: 'retry_scheduled' as const,
      nextAttemptAt,
      failedAt: at,
      retryScheduledAt: at,
      lastError: errorMessage,
      lastErrorCode: simulation.errorCode,
      lastErrorMessage: errorMessage,
      lastErrorRedacted: true,
      workerLockId: undefined,
      workerLockedAt: undefined,
      workerLockExpiresAt: undefined,
      updatedAt: at,
    };
    const updatedAction = { ...action, status: 'retry_scheduled' as const, failureReason: errorMessage, updatedAt: at };
    await this.store.saveActionOutboxItem(updatedItem);
    await this.store.saveSupportAction(updatedAction);
    await this.audit(identity, 'outbox_retry_scheduled', item.sessionId, 'action_outbox_item', item.id, {
      ...deliveryResult,
      nextAttemptAt,
      attemptNumber,
    });
    return { processed: true, action: updatedAction, outboxItem: updatedItem, attempt, delivery: deliveryResult, workerId };
  }

  private async processSandboxWriteback(
    identity: CurrentIdentity,
    item: ActionOutboxItem,
    action: SupportAction,
    workerId: string,
    connectorInstallation: import('@supportplane/contracts').ConnectorInstallation | undefined,
    decision: DeliveryPolicyDecision,
    dryRun: boolean
  ) {
    const at = nowIso();
    const externalTicketId = action.payloadSummary['externalTicketId'] as string | undefined;
    if (!externalTicketId || externalTicketId === 'not_provided') {
      const errorMessage = 'Sandbox writeback requires externalTicketId in action payload.';
      const deliveryResult = {
        mode: 'sandbox',
        realNetwork: false,
        writebackEnabled: true,
        externalWriteAttempted: false,
        deliveryClaim: 'sandbox_writeback_blocked',
        errorCode: 'MISSING_EXTERNAL_TICKET_ID',
        errorMessage,
        workerId,
        blockedAt: at,
      };
      const attempt: ActionOutboxAttempt = {
        id: randomUUID(),
        tenantId: identity.tenantId as ActionOutboxAttempt['tenantId'],
        outboxItemId: item.id,
        supportActionId: action.id,
        attemptNumber: item.attemptCount + 1,
        state: 'failed',
        deliveryResult,
        errorCode: 'MISSING_EXTERNAL_TICKET_ID',
        errorMessage,
        errorRedacted: true,
        attemptedAt: item.processingStartedAt ?? at,
        completedAt: at,
        mockDevOnly: false,
      };
      await this.store.saveActionOutboxAttempt(attempt);
      await this.store.saveActionOutboxItem({ ...item, status: 'dead_lettered' as const, attemptCount: item.attemptCount + 1, latestAttemptState: 'dead_lettered' as const, deadLetteredAt: at, deadLetterReason: errorMessage, lastError: errorMessage, lastErrorCode: 'MISSING_EXTERNAL_TICKET_ID', lastErrorMessage: errorMessage, lastErrorRedacted: true, workerLockId: undefined, workerLockedAt: undefined, workerLockExpiresAt: undefined, updatedAt: at });
      await this.store.saveSupportAction({ ...action, status: 'dead_lettered' as const, failureReason: errorMessage, updatedAt: at });
      await this.audit(identity, 'outbox_processing_failed', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
      return { processed: false, reason: errorMessage, errorCode: 'MISSING_EXTERNAL_TICKET_ID' };
    }

    // Egress allowlist check
    const zammadBaseUrl = process.env['ZAMMAD_BASE_URL'] ?? 'http://zammad.supportplane-integrations.svc.cluster.local:3000';
    const egress = evaluateEgressPolicy({
      tenantId: identity.tenantId,
      connectorType: 'zammad',
      operation: 'writeback',
      url: zammadBaseUrl,
      writebackEnabled: true,
      killSwitchEnabled: false,
    });
    if (!egress.allowed) {
      const errorMessage = `Egress policy blocked sandbox writeback: ${egress.reason}`;
      const deliveryResult = {
        mode: 'sandbox',
        realNetwork: false,
        writebackEnabled: true,
        externalWriteAttempted: false,
        deliveryClaim: 'egress_blocked',
        errorCode: 'EGRESS_BLOCKED',
        errorMessage,
        workerId,
        blockedAt: at,
      };
      const attempt: ActionOutboxAttempt = {
        id: randomUUID(),
        tenantId: identity.tenantId as ActionOutboxAttempt['tenantId'],
        outboxItemId: item.id,
        supportActionId: action.id,
        attemptNumber: item.attemptCount + 1,
        state: 'policy_blocked',
        deliveryResult,
        errorCode: 'EGRESS_BLOCKED',
        errorMessage,
        errorRedacted: true,
        attemptedAt: item.processingStartedAt ?? at,
        completedAt: at,
        mockDevOnly: false,
      };
      await this.store.saveActionOutboxAttempt(attempt);
      await this.store.saveActionOutboxItem({ ...item, status: 'dead_lettered' as const, attemptCount: item.attemptCount + 1, latestAttemptState: 'policy_blocked' as const, deadLetteredAt: at, deadLetterReason: errorMessage, lastError: errorMessage, lastErrorCode: 'EGRESS_BLOCKED', lastErrorMessage: errorMessage, lastErrorRedacted: true, workerLockId: undefined, workerLockedAt: undefined, workerLockExpiresAt: undefined, updatedAt: at });
      await this.store.saveSupportAction({ ...action, status: 'dead_lettered' as const, failureReason: errorMessage, updatedAt: at });
      await this.audit(identity, 'delivery_policy_blocked', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
      return { processed: false, reason: errorMessage, errorCode: 'EGRESS_BLOCKED', policyDecision: decision.decision };
    }

    // Dry-run path: do not call Zammad
    if (dryRun) {
      const deliveryResult = {
        mode: 'sandbox',
        realNetwork: true,
        writebackEnabled: true,
        externalWriteAttempted: false,
        deliveryClaim: 'sandbox_dry_run',
        wouldWriteTo: zammadBaseUrl,
        externalTicketId,
        idempotencyKey: item.idempotencyKey,
        workerId,
        dryRunAt: at,
      };
      const attempt: ActionOutboxAttempt = {
        id: randomUUID(),
        tenantId: identity.tenantId as ActionOutboxAttempt['tenantId'],
        outboxItemId: item.id,
        supportActionId: action.id,
        attemptNumber: item.attemptCount + 1,
        state: 'mock_delivered',
        deliveryResult,
        errorRedacted: true,
        attemptedAt: item.processingStartedAt ?? at,
        completedAt: at,
        mockDevOnly: false,
      };
      await this.store.saveActionOutboxAttempt(attempt);
      await this.audit(identity, 'outbox_item_attempted', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
      await this.audit(identity, 'outbox_processing_succeeded', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
      return { processed: true, action, outboxItem: item, attempt, delivery: deliveryResult, workerId, dryRun: true };
    }

    // Resolve credentials
    let apiToken: string | undefined;
    let credentialMetadata: Record<string, unknown> | undefined;
    try {
      if (!connectorInstallation) {
        throw new Error('No connector installation found for sandbox writeback.');
      }
      const resolved = await this.credentialResolver.resolveZammadApiToken(identity.tenantId, connectorInstallation);
      apiToken = resolved.apiToken;
      credentialMetadata = resolved.metadata;
    } catch (err) {
      const errorMessage = err instanceof Error ? redactedError(err.message) : 'Credential resolution failed';
      const deliveryResult = {
        mode: 'sandbox',
        realNetwork: true,
        writebackEnabled: true,
        externalWriteAttempted: false,
        deliveryClaim: 'credential_resolution_failed',
        errorCode: 'CREDENTIAL_RESOLUTION_FAILED',
        errorMessage,
        workerId,
        failedAt: at,
      };
      const attempt: ActionOutboxAttempt = {
        id: randomUUID(),
        tenantId: identity.tenantId as ActionOutboxAttempt['tenantId'],
        outboxItemId: item.id,
        supportActionId: action.id,
        attemptNumber: item.attemptCount + 1,
        state: 'failed',
        deliveryResult,
        errorCode: 'CREDENTIAL_RESOLUTION_FAILED',
        errorMessage,
        errorRedacted: true,
        attemptedAt: item.processingStartedAt ?? at,
        completedAt: at,
        mockDevOnly: false,
      };
      await this.store.saveActionOutboxAttempt(attempt);
      await this.store.saveActionOutboxItem({ ...item, status: 'retry_scheduled' as const, attemptCount: item.attemptCount + 1, latestAttemptState: 'retry_scheduled' as const, nextAttemptAt: addSeconds(at, 60), failedAt: at, retryScheduledAt: at, lastError: errorMessage, lastErrorCode: 'CREDENTIAL_RESOLUTION_FAILED', lastErrorMessage: errorMessage, lastErrorRedacted: true, workerLockId: undefined, workerLockedAt: undefined, workerLockExpiresAt: undefined, updatedAt: at });
      await this.store.saveSupportAction({ ...action, status: 'retry_scheduled' as const, failureReason: errorMessage, updatedAt: at });
      await this.audit(identity, 'outbox_processing_failed', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
      return { processed: false, reason: errorMessage, errorCode: 'CREDENTIAL_RESOLUTION_FAILED' };
    }

    // Execute real Zammad internal note writeback
    try {
      const adapter = await this.connectorsService.createResolvedZammadAdapter({
        baseUrl: zammadBaseUrl,
        apiToken,
        timeoutMs: 10000,
      });

      const noteBody = `[SupportPlane sandbox internal note]\nHuman-reviewed local sandbox writeback.\nNo production data. No public reply.\nIdempotency: ${item.idempotencyKey}`;
      const writeResult = await adapter.writeInternalNote(externalTicketId, noteBody);

      if (!writeResult.success) {
        throw new Error(writeResult.error?.message ?? 'Zammad writeInternalNote returned success=false');
      }

      const deliveryResult: Record<string, unknown> = {
        mode: 'sandbox',
        realNetwork: true,
        writebackEnabled: true,
        externalWriteAttempted: true,
        deliveryClaim: 'sandbox_writeback_succeeded',
        externalReferenceId: writeResult.externalArticleId ?? null,
        responseSummary: 'Sandbox internal note written to Zammad.',
        zammadTicketId: externalTicketId,
        idempotencyKey: item.idempotencyKey,
        credentialMetadata,
        workerId,
        deliveredAt: at,
      };

      // BL-112: MinIO evidence persistence
      await this.persistMinIOEvidence(item, action, deliveryResult, workerId).catch(() => undefined);

      // BL-113: Mailpit notification
      await this.sendMailpitNotification(item, action, deliveryResult, workerId).catch(() => undefined);

      const attempt: ActionOutboxAttempt = {
        id: randomUUID(),
        tenantId: identity.tenantId as ActionOutboxAttempt['tenantId'],
        outboxItemId: item.id,
        supportActionId: action.id,
        attemptNumber: item.attemptCount + 1,
        state: 'mock_delivered',
        deliveryResult: deliveryResult as ActionOutboxAttempt['deliveryResult'],
        errorRedacted: true,
        attemptedAt: item.processingStartedAt ?? at,
        completedAt: at,
        mockDevOnly: false,
      };
      const updatedItem = {
        ...item,
        status: 'mock_delivered' as const,
        attemptCount: item.attemptCount + 1,
        latestAttemptState: 'mock_delivered' as const,
        mockDeliveredAt: at,
        workerLockId: undefined,
        workerLockedAt: undefined,
        workerLockExpiresAt: undefined,
        updatedAt: at,
      };
      const updatedAction = { ...action, status: 'mock_delivered' as const, mockDeliveredAt: at, updatedAt: at };
      await this.store.saveActionOutboxAttempt(attempt);
      await this.store.saveActionOutboxItem(updatedItem);
      await this.store.saveSupportAction(updatedAction);
      await this.audit(identity, 'outbox_item_attempted', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
      await this.audit(identity, 'outbox_processing_succeeded', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
      await this.audit(identity, 'outbox_sandbox_writeback_succeeded', item.sessionId, 'support_action', action.id, deliveryResult);

      return { processed: true, action: updatedAction, outboxItem: updatedItem, attempt, delivery: deliveryResult, workerId };
    } catch (err) {
      const errorMessage = err instanceof Error ? redactedError(err.message) : 'Zammad sandbox writeback failed';
      const attemptNumber = item.attemptCount + 1;
      const deliveryResult = {
        mode: 'sandbox',
        realNetwork: true,
        writebackEnabled: true,
        externalWriteAttempted: true,
        deliveryClaim: 'sandbox_writeback_failed',
        retryable: true,
        errorCode: 'ZAMMAD_WRITEBACK_FAILED',
        errorMessage,
        workerId,
        failedAt: at,
      };
      const attempt: ActionOutboxAttempt = {
        id: randomUUID(),
        tenantId: identity.tenantId as ActionOutboxAttempt['tenantId'],
        outboxItemId: item.id,
        supportActionId: action.id,
        attemptNumber,
        state: 'failed',
        deliveryResult,
        errorCode: 'ZAMMAD_WRITEBACK_FAILED',
        errorMessage,
        errorRedacted: true,
        attemptedAt: item.processingStartedAt ?? at,
        completedAt: at,
        mockDevOnly: false,
      };
      await this.store.saveActionOutboxAttempt(attempt);
      await this.audit(identity, 'outbox_item_attempted', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
      await this.audit(identity, 'outbox_processing_failed', item.sessionId, 'action_outbox_item', item.id, deliveryResult);

      if (attemptNumber >= item.maxAttempts) {
        const result = await this.markDeadLetter(identity, { ...item, attemptCount: attemptNumber }, errorMessage, 'ZAMMAD_WRITEBACK_FAILED');
        return { ...result, processed: true, attempt, delivery: deliveryResult, workerId };
      }

      const nextAttemptAt = addSeconds(at, Math.min(300, 5 * 2 ** (attemptNumber - 1)));
      const updatedItem = {
        ...item,
        status: 'retry_scheduled' as const,
        attemptCount: attemptNumber,
        latestAttemptState: 'retry_scheduled' as const,
        nextAttemptAt,
        failedAt: at,
        retryScheduledAt: at,
        lastError: errorMessage,
        lastErrorCode: 'ZAMMAD_WRITEBACK_FAILED',
        lastErrorMessage: errorMessage,
        lastErrorRedacted: true,
        workerLockId: undefined,
        workerLockedAt: undefined,
        workerLockExpiresAt: undefined,
        updatedAt: at,
      };
      const updatedAction = { ...action, status: 'retry_scheduled' as const, failureReason: errorMessage, updatedAt: at };
      await this.store.saveActionOutboxItem(updatedItem);
      await this.store.saveSupportAction(updatedAction);
      await this.audit(identity, 'outbox_retry_scheduled', item.sessionId, 'action_outbox_item', item.id, {
        ...deliveryResult,
        nextAttemptAt,
        attemptNumber,
      });
      return { processed: true, action: updatedAction, outboxItem: updatedItem, attempt, delivery: deliveryResult, workerId };
    }
  }

  private async persistMinIOEvidence(
    item: ActionOutboxItem,
    action: SupportAction,
    deliveryResult: Record<string, unknown>,
    workerId: string
  ) {
    const minioUrl = process.env['MINIO_ENDPOINT'] ?? 'http://minio.supportplane-data.svc.cluster.local:9000';
    const minioAccessKey = process.env['MINIO_ACCESS_KEY'] ?? 'minioadmin';
    const minioSecretKey = process.env['MINIO_SECRET_KEY'] ?? 'minioadmin123';
    const bucket = process.env['MINIO_EVIDENCE_BUCKET'] ?? 'supportplane-evidence';

    const artifact = {
      envelopeVersion: 'supportplane.evidence.v1',
      tenantId: item.tenantId,
      outboxItemId: item.id,
      supportActionId: action.id,
      sessionId: item.sessionId,
      idempotencyKey: item.idempotencyKey,
      deliveryResult,
      workerId,
      createdAt: new Date().toISOString(),
      disclaimer: 'Local sandbox evidence only. No compliance claim.',
    };

    const objectKey = `${item.tenantId}/writebacks/${item.sessionId}/${item.id}.json`;
    const payload = JSON.stringify(artifact, null, 2);

    // Simple MinIO S3-compatible put using fetch
    const date = new Date().toISOString();
    const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
    const checksum = Array.from(new Uint8Array(contentHash)).map(b => b.toString(16).padStart(2, '0')).join('');

    // For local sandbox, use AWS SDK S3 client with MinIO endpoint
    try {
      const s3 = new S3Client({
        endpoint: minioUrl,
        region: 'us-east-1',
        credentials: { accessKeyId: minioAccessKey, secretAccessKey: minioSecretKey },
        forcePathStyle: true,
      });
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: payload,
        ContentType: 'application/json',
      }));
      // Update deliveryResult with MinIO metadata
      (deliveryResult as Record<string, unknown>)['minioEvidence'] = {
        objectKey,
        bucket,
        checksum,
        contentType: 'application/json',
        createdAt: date,
        disclaimer: 'Local sandbox evidence only. No compliance claim.',
      };
    } catch (err) {
      (deliveryResult as Record<string, unknown>)['minioEvidence'] = {
        error: err instanceof Error ? err.message : 'MinIO upload failed',
        objectKey,
        bucket,
      };
    }
  }

  private async sendMailpitNotification(
    item: ActionOutboxItem,
    action: SupportAction,
    deliveryResult: Record<string, unknown>,
    workerId: string
  ) {
    const mailpitSmtp = process.env['MAILPIT_SMTP'] ?? 'mailpit.supportplane-integrations.svc.cluster.local:1025';
    const [host, portStr] = mailpitSmtp.split(':');
    const port = parseInt(portStr ?? '1025', 10);

    const subject = 'SupportPlane sandbox writeback completed';
    const body = `Local sandbox notification only.\nNo production email was sent.\nNo customer email was contacted.\n\nOutbox item: ${item.id}\nAction: ${action.id}\nSession: ${item.sessionId}\nWorker: ${workerId}`;

    let capturedMessageId: string | undefined;
    let smtpStatus = 'recorded_intent_only';
    let smtpError: string | undefined;

    try {
      capturedMessageId = await this.sendSmtp(host, port, 'worker@supportplane.local', ['admin@supportplane.local'], subject, body);
      smtpStatus = 'captured';
    } catch (err) {
      smtpError = err instanceof Error ? err.message : 'SMTP send failed';
      smtpStatus = 'failed';
    }

    (deliveryResult as Record<string, unknown>)['mailpitNotification'] = {
      smtpHost: host,
      smtpPort: port,
      subject,
      bodyPreview: body.slice(0, 200),
      status: smtpStatus,
      capturedMessageId,
      smtpError,
      disclaimer: 'Local sandbox notification only. No production email was sent.',
      capturedAt: new Date().toISOString(),
    };
  }

  private sendSmtp(
    host: string,
    port: number,
    from: string,
    to: string[],
    subject: string,
    body: string
  ): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const socket = createConnection({ host, port });
      let step = 0;
      const steps = [
        `EHLO supportplane.local\r\n`,
        `MAIL FROM:<${from}>\r\n`,
        ...to.map((t) => `RCPT TO:<${t}>\r\n`),
        `DATA\r\n`,
        `Subject: ${subject}\r\nFrom: ${from}\r\nTo: ${to.join(', ')}\r\n\r\n${body}\r\n.\r\n`,
        `QUIT\r\n`,
      ];
      const messageId = `sp-sandbox-${Date.now()}@supportplane.local`;
      let buffer = '';
      let done = false;

      socket.on('connect', () => {
        // wait for server greeting
      });

      socket.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\r\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.match(/^\d{3}/)) continue;
          const code = parseInt(line.slice(0, 3), 10);
          if (code >= 400 && !done) {
            done = true;
            socket.end();
            reject(new Error(`SMTP error at step ${step}: ${line}`));
            return;
          }
          if (step === 0 && (code === 220)) {
            // greeting received, send EHLO
            socket.write(steps[step]);
            step++;
          } else if (step > 0 && step < steps.length && (code >= 200 && code < 400)) {
            socket.write(steps[step]);
            step++;
            if (step >= steps.length) {
              done = true;
              socket.end();
              resolve(messageId);
            }
          }
        }
      });

      socket.on('error', (err) => {
        if (!done) {
          done = true;
          reject(err);
        }
      });

      socket.on('close', () => {
        if (!done) {
          done = true;
          resolve(messageId);
        }
      });

      socket.setTimeout(10000, () => {
        if (!done) {
          done = true;
          socket.destroy();
          reject(new Error('SMTP connection timeout'));
        }
      });
    });
  }

  private async handlePolicyBlock(
    identity: CurrentIdentity,
    item: ActionOutboxItem,
    action: SupportAction,
    workerId: string,
    decision: DeliveryPolicyDecision
  ) {
    const at = nowIso();
    const deliveryResult = {
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
      deliveryClaim: 'policy_blocked',
      policyDecision: decision.decision,
      policyReason: decision.reason,
      workerId,
      blockedAt: at,
    };
    const attempt: ActionOutboxAttempt = {
      id: randomUUID(),
      tenantId: identity.tenantId as ActionOutboxAttempt['tenantId'],
      outboxItemId: item.id,
      supportActionId: action.id,
      attemptNumber: item.attemptCount + 1,
      state: 'policy_blocked',
      deliveryResult,
      errorCode: 'POLICY_BLOCKED',
      errorMessage: decision.reason,
      errorRedacted: true,
      attemptedAt: at,
      completedAt: at,
      mockDevOnly: true,
    };
    const updatedItem = {
      ...item,
      status: 'dead_lettered' as const,
      attemptCount: item.attemptCount + 1,
      latestAttemptState: 'policy_blocked' as const,
      deadLetteredAt: at,
      deadLetterReason: decision.reason,
      lastError: decision.reason,
      lastErrorCode: 'POLICY_BLOCKED',
      lastErrorMessage: decision.reason,
      lastErrorRedacted: true,
      workerLockId: undefined,
      workerLockedAt: undefined,
      workerLockExpiresAt: undefined,
      updatedAt: at,
    };
    const updatedAction = { ...action, status: 'dead_lettered' as const, failureReason: decision.reason, updatedAt: at };
    await this.store.saveActionOutboxAttempt(attempt);
    await this.store.saveActionOutboxItem(updatedItem);
    await this.store.saveSupportAction(updatedAction);
    await this.audit(identity, 'delivery_policy_blocked', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
    await this.audit(identity, 'action_failed', item.sessionId, 'support_action', action.id, {
      reason: decision.reason,
      errorCode: 'POLICY_BLOCKED',
      terminal: true,
    });
    return { processed: false, reason: decision.decision, policyDecision: decision };
  }

  private async markDeadLetter(identity: CurrentIdentity, item: ActionOutboxItem, reason: string, errorCode = 'MOCK_DEAD_LETTERED') {
    const action = await this.requireAction(identity, item.supportActionId);
    const at = nowIso();
    const updatedItem = {
      ...item,
      status: 'dead_lettered' as const,
      latestAttemptState: 'dead_lettered' as const,
      deadLetteredAt: at,
      deadLetterReason: reason,
      lastError: reason,
      lastErrorCode: errorCode,
      lastErrorMessage: reason,
      lastErrorRedacted: true,
      workerLockId: undefined,
      workerLockedAt: undefined,
      workerLockExpiresAt: undefined,
      updatedAt: at,
    };
    const updatedAction = { ...action, status: 'dead_lettered' as const, failureReason: reason, updatedAt: at };
    await this.store.saveActionOutboxItem(updatedItem);
    await this.store.saveSupportAction(updatedAction);
    await this.audit(identity, 'outbox_dead_lettered', item.sessionId, 'action_outbox_item', item.id, {
      reason,
      errorCode,
      supportActionId: item.supportActionId,
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
    });
    await this.audit(identity, 'action_failed', item.sessionId, 'support_action', action.id, { reason, errorCode, terminal: true });
    return { action: updatedAction, outboxItem: updatedItem };
  }

  private simulateDelivery(item: ActionOutboxItem): DeliverySimulation {
    const scenario = String(item.deliveryIntent['mockDeliveryScenario'] ?? 'success');
    if (scenario === 'connector_unavailable') {
      return { outcome: 'retryable_failure', errorCode: 'MOCK_CONNECTOR_UNAVAILABLE', errorMessage: 'Mock connector unavailable; retry scheduled. token=secret is redacted.' };
    }
    if (scenario === 'retryable_failure') {
      return { outcome: 'retryable_failure', errorCode: 'MOCK_RETRYABLE_FAILURE', errorMessage: 'Mock retryable delivery failure. password=hidden is redacted.' };
    }
    if (scenario === 'retryable_failure_once' && item.attemptCount < 1) {
      return { outcome: 'retryable_failure', errorCode: 'MOCK_TRANSIENT_TIMEOUT', errorMessage: 'Mock transient timeout; retry is safe.' };
    }
    if (scenario === 'validation_failure') {
      return { outcome: 'non_retryable_failure', errorCode: 'MOCK_VALIDATION_FAILURE', errorMessage: 'Mock validation failure; payload rejected before any network write.' };
    }
    if (scenario === 'non_retryable_failure') {
      return { outcome: 'non_retryable_failure', errorCode: 'MOCK_NON_RETRYABLE_FAILURE', errorMessage: 'Mock non-retryable delivery failure; no external write attempted.' };
    }
    return { outcome: 'success' };
  }

  private outboxSummary(items: ActionOutboxItem[]) {
    return items.reduce(
      (summary, item) => {
        summary.total += 1;
        summary[item.status] = (summary[item.status] ?? 0) + 1;
        return summary;
      },
      {
        total: 0,
        queued: 0,
        processing: 0,
        mock_delivered: 0,
        failed: 0,
        retry_scheduled: 0,
        dead_lettered: 0,
        cancelled: 0,
      } as Record<ActionOutboxItem['status'] | 'total', number>
    );
  }

  private async publishOutboxEnvelope(item: ActionOutboxItem): Promise<void> {
    if (process.env['SUPPORTPLANE_QUEUE_BACKEND'] !== 'nats-jetstream' || !process.env['NATS_URL']) {
      return;
    }
    const safetyFlags = item.safetyFlags ?? { realNetwork: false, writebackEnabled: false, externalWriteAllowed: false, mockOnly: true, localDevOnly: true };
    const envelope = NatsOutboxEnvelope.parse({
      envelopeVersion: 'supportplane.outbox.v1',
      stream: 'SUPPORTPLANE_OUTBOX',
      subject: NATS_SUBJECT,
      tenantId: item.tenantId,
      outboxItemId: item.id,
      supportActionId: item.supportActionId,
      sessionId: item.sessionId,
      actionType: item.actionType,
      idempotencyKey: item.idempotencyKey,
      deliveryMode: item.deliveryMode ?? 'mock',
      retry: {
        attemptCount: item.attemptCount,
        maxAttempts: item.maxAttempts,
        deadLetterSubject: 'supportplane.outbox.deadletter',
      },
      safety: {
        realNetwork: safetyFlags.realNetwork ?? false,
        writebackEnabled: safetyFlags.writebackEnabled ?? false,
        externalWriteAttempted: false,
        noSecrets: true,
      },
      createdAt: new Date().toISOString(),
    });
    let nc: Awaited<ReturnType<typeof connect>> | undefined;
    try {
      nc = await connect({ servers: process.env['NATS_URL'] });
      const jsm = await nc.jetstreamManager();
      try {
        await jsm.streams.info(NATS_STREAM);
      } catch {
        await jsm.streams.add({
          name: NATS_STREAM,
          subjects: ['supportplane.outbox.*'],
          storage: StorageType.File,
        });
      }
      try {
        await jsm.consumers.info(NATS_STREAM, NATS_CONSUMER);
      } catch {
        await jsm.consumers.add(NATS_STREAM, {
          durable_name: NATS_CONSUMER,
          ack_policy: AckPolicy.Explicit,
          filter_subject: NATS_SUBJECT,
        });
      }
      await nc.jetstream().publish(NATS_SUBJECT, StringCodec().encode(JSON.stringify(envelope)), {
        msgID: item.idempotencyKey,
      });
    } finally {
      await nc?.drain().catch(() => undefined);
    }
  }

  private async requireSession(identity: CurrentIdentity, sessionId: string) {
    const session = await this.store.getSession(identity.tenantId, sessionId);
    if (!session) throw new NotFoundException(`Support session ${sessionId} not found`);
    return session;
  }

  private async requireAction(identity: CurrentIdentity, id: string) {
    const action = await this.store.getSupportAction(identity.tenantId, id);
    if (!action) throw new NotFoundException(`Action ${id} not found`);
    return action;
  }

  private async requireOutbox(identity: CurrentIdentity, id: string) {
    const item = await this.store.getActionOutboxItem(identity.tenantId, id);
    if (!item) throw new NotFoundException(`Outbox item ${id} not found`);
    return item;
  }

  private async assertPermission(identity: CurrentIdentity, permission: string, sessionId?: string) {
    if (hasPermission(identity, permission)) return;
    const eventType = permission.startsWith('outbox:') || permission.startsWith('worker:')
      ? 'outbox_access_denied'
      : 'action_access_denied';
    await this.audit(identity, eventType, sessionId, 'permission', permission, { permission });
    throw new ForbiddenException(`Forbidden: ${permission} requires a higher role`);
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
