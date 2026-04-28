import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ActionOutboxAttempt,
  ActionOutboxItem,
  AuditEvent,
  SupportAction,
  SupportActionCreateRequest,
  type DeliveryPolicyDecision,
} from '@supportplane/contracts';
import type { CurrentIdentity } from '../auth/auth.types.js';
import { hasPermission } from '../auth/rbac.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import { DeliveryPolicyService } from '../delivery-policy/delivery-policy.service.js';

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
};

type DeliverySimulation =
  | { outcome: 'success' }
  | { outcome: 'retryable_failure'; errorCode: string; errorMessage: string }
  | { outcome: 'non_retryable_failure'; errorCode: string; errorMessage: string };

@Injectable()
export class ActionsService {
  constructor(
    @Inject(InMemoryStore) private readonly store: Store,
    @Inject(DeliveryPolicyService) private readonly policyService: DeliveryPolicyService
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
    const outboxItem: ActionOutboxItem = {
      id: randomUUID(),
      tenantId: identity.tenantId as ActionOutboxItem['tenantId'],
      supportActionId: action.id,
      sessionId: action.sessionId,
      connectorInstallationId: action.connectorInstallationId,
      actionType: action.actionType,
      status: 'queued',
      idempotencyKey: `${action.idempotencyKey}:outbox`,
      deliveryMode: 'mock',
      deliveryIntent: {
        mode: 'mock',
        actionType: action.actionType,
        deliveryClaim: 'queued_for_mock_delivery',
        mockDeliveryScenario: action.payloadSummary['mockDeliveryScenario'] ?? 'success',
        realNetwork: false,
        writebackEnabled: false,
        externalWriteAttempted: false,
        policyDecision: decision.decision,
        policyVersion: decision.policyVersion,
      },
      attemptCount: 0,
      maxAttempts: 3,
      queuedAt: at,
      lastErrorRedacted: true,
      safetyFlags: MOCK_SAFETY_FLAGS,
      mockDevOnly: true,
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
      queueBackend: 'postgres-local-outbox',
      storeMode: process.env['SUPPORTPLANE_STORE'] ?? 'memory',
      deliveryMode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
      summary: this.outboxSummary(items),
      warnings: [
        'Local PostgreSQL outbox worker foundation only.',
        'No real Zammad writeback, email, telephony, AI provider call, external broker, or production queue semantics.',
      ],
      checkedAt: nowIso(),
      mockDevOnly: true,
    };
    await this.audit(identity, 'outbox_worker_status_checked', undefined, 'worker', identity.tenantId, status);
    return status;
  }

  async processOutboxOnce(identity: CurrentIdentity, body: { outboxItemId?: string; workerId?: string }) {
    await this.assertPermission(identity, 'outbox:process_once');
    const workerId = body.workerId ?? `api-process-once:${identity.userId}`;
    const at = nowIso();
    await this.audit(identity, 'outbox_process_once_requested', undefined, 'worker', identity.tenantId, {
      workerId,
      outboxItemId: body.outboxItemId ?? 'next_available',
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
    });
    const item = await this.store.claimNextActionOutboxItem(identity.tenantId, {
      workerId,
      now: at,
      lockExpiresAt: addSeconds(at, 60),
      outboxItemId: body.outboxItemId,
    });
    if (!item) return { processed: false, reason: 'no_eligible_outbox_item', workerId, mode: 'mock' };
    await this.audit(identity, 'outbox_processing_started', item.sessionId, 'action_outbox_item', item.id, {
      workerId,
      attemptNumber: item.attemptCount + 1,
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
    });
    return this.processClaimedOutbox(identity, item, workerId);
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
    options?: { forceSuccess?: boolean }
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
