import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ActionOutboxAttempt,
  ActionOutboxItem,
  AuditEvent,
  SupportAction,
  SupportActionCreateRequest,
} from '@supportplane/contracts';
import type { CurrentIdentity } from '../auth/auth.types.js';
import { hasPermission } from '../auth/rbac.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';

function nowIso(): string {
  return new Date().toISOString();
}

function preview(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/(api[_-]?token|password|secret)=\S+/gi, '$1=[REDACTED]')
    .slice(0, 480);
}

@Injectable()
export class ActionsService {
  constructor(@Inject(InMemoryStore) private readonly store: Store) {}

  async listSessionActions(identity: CurrentIdentity, sessionId: string) {
    await this.assertPermission(identity, 'action:read', sessionId);
    await this.requireSession(identity, sessionId);
    const actions = await this.store.listSupportActions(identity.tenantId, { sessionId });
    const outboxItems = await this.store.listActionOutboxItems(identity.tenantId, { sessionId });
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
      deliveryIntent: {
        mode: 'mock',
        actionType: action.actionType,
        deliveryClaim: 'queued_for_mock_delivery',
        realNetwork: false,
        writebackEnabled: false,
        externalWriteAttempted: false,
      },
      attemptCount: 0,
      queuedAt: at,
      safetyFlags: { noSecrets: true, noRawMedia: true, localMockOnly: true },
      mockDevOnly: true,
      createdAt: at,
      updatedAt: at,
    };
    const updated = { ...action, status: 'queued' as const, queuedAt: at, updatedAt: at };
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
    await this.audit(identity, 'action_cancelled', action.sessionId, 'support_action', action.id, { reason: body.reason ?? 'not_provided' });
    return { action: updated };
  }

  async listOutbox(identity: CurrentIdentity) {
    await this.assertPermission(identity, 'outbox:read');
    return { outboxItems: await this.store.listActionOutboxItems(identity.tenantId) };
  }

  async getOutbox(identity: CurrentIdentity, id: string) {
    await this.assertPermission(identity, 'outbox:read');
    const outboxItem = await this.requireOutbox(identity, id);
    const attempts = await this.store.listActionOutboxAttempts(identity.tenantId, id);
    return { outboxItem, attempts };
  }

  async retryOutbox(identity: CurrentIdentity, id: string) {
    await this.assertPermission(identity, 'outbox:mock_deliver');
    const item = await this.requireOutbox(identity, id);
    if (item.status !== 'failed') throw new BadRequestException(`Cannot retry outbox item from ${item.status}`);
    const updated = { ...item, status: 'queued' as const, latestAttemptState: 'retry_requested' as const, updatedAt: nowIso() };
    await this.store.saveActionOutboxItem(updated);
    await this.audit(identity, 'action_retry_requested', item.sessionId, 'action_outbox_item', item.id, { supportActionId: item.supportActionId });
    return { outboxItem: updated };
  }

  async mockDeliverOutbox(identity: CurrentIdentity, id: string) {
    await this.assertPermission(identity, 'outbox:mock_deliver');
    const item = await this.requireOutbox(identity, id);
    if (item.status !== 'queued') throw new BadRequestException(`Cannot mock deliver outbox item from ${item.status}`);
    const action = await this.requireAction(identity, item.supportActionId);
    const at = nowIso();
    const deliveryResult = {
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
      deliveryClaim: 'mock_delivered',
      externalReferenceId: null,
      responseSummary: 'Mock delivery recorded locally. No external connector was contacted.',
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
      attemptedAt: at,
      mockDevOnly: true,
    };
    const updatedItem = {
      ...item,
      status: 'mock_delivered' as const,
      attemptCount: item.attemptCount + 1,
      latestAttemptState: 'mock_delivered' as const,
      mockDeliveredAt: at,
      updatedAt: at,
    };
    const updatedAction = { ...action, status: 'mock_delivered' as const, mockDeliveredAt: at, updatedAt: at };
    await this.store.saveActionOutboxAttempt(attempt);
    await this.store.saveActionOutboxItem(updatedItem);
    await this.store.saveSupportAction(updatedAction);
    await this.audit(identity, 'outbox_item_attempted', item.sessionId, 'action_outbox_item', item.id, deliveryResult);
    await this.audit(identity, 'action_mock_delivered', item.sessionId, 'support_action', action.id, deliveryResult);
    return { action: updatedAction, outboxItem: updatedItem, attempt, delivery: deliveryResult };
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
    await this.audit(identity, 'action_access_denied', sessionId, 'permission', permission, { permission });
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
