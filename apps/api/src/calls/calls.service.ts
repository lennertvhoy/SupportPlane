import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CallEvent,
  CallStatus,
  CallDirection,
  AuditEventType,
  AuditActorType,
  SupportSessionStatus,
  SupportSessionPriority,
  AutoCreateSessionResult,
  normalizePhoneNumber,
  matchCallerByPhone,
  type CallEvent as CallEventShape,
  type SupportSession as SupportSessionShape,
  type TenantId,
  type AuditEventId,
  type SupportSessionId,
} from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import { type DevIdentity } from '../common/dev-identity.middleware.js';

@Injectable()
export class CallsService {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: InMemoryStore
  ) {}

  createFakeIncomingCall(
    identity: DevIdentity,
    dto: {
      externalCallId: string;
      rawCallerNumber: string;
      callerDisplayName?: string;
      autoCreateSession?: boolean;
      preferredSessionTitle?: string;
      preferredPriority?: string;
    }
  ): { callEvent: CallEventShape; autoCreateResult: AutoCreateSessionResult; createdSession?: SupportSessionShape } {
    const normalized = normalizePhoneNumber(dto.rawCallerNumber);
    const callerMatch = matchCallerByPhone(normalized);
    const now = new Date().toISOString();

    const callEvent: CallEventShape = CallEvent.parse({
      id: randomUUID(),
      tenantId: identity.tenantId,
      provider: 'fake_webhook',
      source: 'fake_webhook',
      externalCallId: dto.externalCallId,
      direction: CallDirection.enum.inbound,
      status: CallStatus.enum.ringing,
      caller: {
        rawNumber: dto.rawCallerNumber,
        normalizedNumber: normalized.normalized,
        displayName: dto.callerDisplayName,
        countryCodeHint: normalized.countryCode,
      },
      callerMatch,
      startedAt: now,
      metadata: {
        mockNote: 'This is a simulated call event. No real telephony is connected.',
        rawInput: dto.rawCallerNumber,
        normalizationValid: normalized.valid,
      },
      mockDevOnly: true,
      createdAt: now,
      updatedAt: now,
    });

    this.store.saveCallEvent(callEvent);

    this.appendAuditEvent(identity, undefined, AuditEventType.enum.call_event_received, 'call_event', callEvent.id, {
      externalCallId: callEvent.externalCallId,
      provider: callEvent.provider,
      normalizedNumber: normalized.normalized,
      mockDevOnly: true,
    });

    if (callerMatch.status === 'matched') {
      this.appendAuditEvent(identity, undefined, AuditEventType.enum.caller_matched, 'call_event', callEvent.id, {
        externalCallId: callEvent.externalCallId,
        normalizedNumber: normalized.normalized,
        matchStatus: callerMatch.status,
        matchConfidence: callerMatch.confidence,
        customerId: callerMatch.customerId,
        customerName: callerMatch.customerName,
        mockDevOnly: true,
      });
    }

    let autoCreateResult: AutoCreateSessionResult = AutoCreateSessionResult.enum.not_requested;
    let createdSession: SupportSessionShape | undefined;

    if (dto.autoCreateSession) {
      if (!normalized.valid || callerMatch.status === 'invalid_number') {
        autoCreateResult = AutoCreateSessionResult.enum.skipped_invalid_phone;
      } else if (callerMatch.status !== 'matched') {
        autoCreateResult = AutoCreateSessionResult.enum.skipped_no_match;
      } else {
        // Create a new support session from the matched caller
        const sessionTitle =
          dto.preferredSessionTitle ??
          (callerMatch.customerName
            ? `Incoming call from ${callerMatch.customerName}`
            : `Incoming call from ${normalized.normalized ?? dto.rawCallerNumber}`);

        const priority = dto.preferredPriority
          ? SupportSessionPriority.parse(dto.preferredPriority)
          : SupportSessionPriority.enum.normal;

        const sessionId = randomUUID() as SupportSessionId;
        const session: SupportSessionShape = {
          id: sessionId,
          tenantId: identity.tenantId as TenantId,
          status: SupportSessionStatus.enum.open,
          priority,
          title: sessionTitle,
          description: `Auto-created from incoming call ${dto.externalCallId}. Normalized: ${normalized.normalized ?? 'n/a'}`,
          assignedUserId: identity.userId,
          linkedTicketIds: callerMatch.matchedTicketIds ?? [],
          aiContextPacketIds: [],
          screenObservationIds: [],
          callEventIds: [callEvent.id],
          auditEventIds: [],
          startedAt: now,
          createdAt: now,
          updatedAt: now,
        };

        this.store.saveSession(session);
        createdSession = session;

        // Link call to session
        const updatedCall: CallEventShape = {
          ...callEvent,
          sessionId: session.id,
          status: CallStatus.enum.answered,
          answeredAt: now,
          updatedAt: now,
        };
        this.store.saveCallEvent(updatedCall);

        autoCreateResult = AutoCreateSessionResult.enum.auto_created;

        this.appendAuditEvent(
          identity,
          session.id,
          AuditEventType.enum.support_session_auto_created,
          'support_session',
          session.id,
          {
            externalCallId: callEvent.externalCallId,
            normalizedNumber: normalized.normalized,
            customerId: callerMatch.customerId,
            customerName: callerMatch.customerName,
            matchedTicketIds: callerMatch.matchedTicketIds,
            mockDevOnly: true,
          }
        );

        this.appendAuditEvent(
          identity,
          session.id,
          AuditEventType.enum.call_auto_linked_to_session,
          'call_event',
          callEvent.id,
          {
            externalCallId: callEvent.externalCallId,
            sessionId: session.id,
            normalizedNumber: normalized.normalized,
            mockDevOnly: true,
          }
        );

        // Return the updated call event (linked)
        return { callEvent: updatedCall, autoCreateResult, createdSession };
      }
    }

    return { callEvent, autoCreateResult, createdSession };
  }

  listRecentCalls(identity: DevIdentity): CallEventShape[] {
    return this.store.listCallEvents(identity.tenantId);
  }

  getCall(identity: DevIdentity, id: string): CallEventShape {
    const call = this.store.getCallEvent(identity.tenantId, id);
    if (!call) {
      throw new NotFoundException(`Call event ${id} not found`);
    }
    return call;
  }

  linkCallToSession(
    identity: DevIdentity,
    callId: string,
    dto: { sessionId: string }
  ): { callEvent: CallEventShape; linkedAt: string } {
    const call = this.getCall(identity, callId);

    const session = this.store.getSession(identity.tenantId, dto.sessionId);
    if (!session) {
      throw new NotFoundException(`Support session ${dto.sessionId} not found`);
    }

    const updated: CallEventShape = {
      ...call,
      sessionId: dto.sessionId,
      status: CallStatus.enum.answered,
      answeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.store.saveCallEvent(updated);

    const updatedSession = {
      ...session,
      callEventIds: Array.from(new Set([...session.callEventIds, callId])),
      updatedAt: new Date().toISOString(),
    };
    this.store.saveSession(updatedSession);

    this.appendAuditEvent(identity, dto.sessionId, AuditEventType.enum.call_linked_to_session, 'call_event', callId, {
      externalCallId: call.externalCallId,
      sessionId: dto.sessionId,
      normalizedNumber: call.caller.normalizedNumber,
      mockDevOnly: true,
    });

    return { callEvent: updated, linkedAt: updated.updatedAt };
  }

  private appendAuditEvent(
    identity: DevIdentity,
    sessionId: string | undefined,
    eventType: AuditEventType,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown> = {}
  ): void {
    const now = new Date().toISOString();
    const event = {
      id: randomUUID() as AuditEventId,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      eventType,
      actorType: AuditActorType.enum.user,
      actorId: identity.userId,
      action: eventType,
      resourceType,
      resourceId,
      metadata,
      integrityHash: computeIntegrityHash({
        eventType,
        actorId: identity.userId,
        resourceId,
        metadata,
        now,
      }),
      createdAt: now,
    };
    this.store.saveAuditEvent(event);
  }
}
