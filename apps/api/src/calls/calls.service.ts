import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
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
  CallTimelineItem,
  CallTimelineItemType,
  TelephonyAuditMetadata,
  CallRecording,
  CallRecordingStatus,
  CallRecordingSource,
  CallRecordingStorageType,
  type CallEvent as CallEventShape,
  type TelephonyWebhookEvent as TelephonyWebhookEventShape,
  type TelephonyAuditMetadata as TelephonyAuditMetadataShape,
  type SupportSession as SupportSessionShape,
  type TenantId,
  type AuditEventId,
  type SupportSessionId,
  type CallTimelineItem as CallTimelineItemShape,
  type CallRecording as CallRecordingShape,
} from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import { type DevIdentity } from '../auth/auth.types.js';
import { requirePermission } from '../auth/rbac.js';

@Injectable()
export class CallsService {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store
  ) {}

  async createFakeIncomingCall(
    identity: DevIdentity,
    dto: {
      externalCallId: string;
      rawCallerNumber: string;
      callerDisplayName?: string;
      autoCreateSession?: boolean;
      preferredSessionTitle?: string;
      preferredPriority?: string;
    }
  ): Promise<{ callEvent: CallEventShape; autoCreateResult: AutoCreateSessionResult; createdSession?: SupportSessionShape }> {
    requirePermission(identity, 'call:write');
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

    await this.store.saveCallEvent(callEvent);

    await this.appendAuditEvent(identity, undefined, AuditEventType.enum.call_event_received, 'call_event', callEvent.id, {
      externalCallId: callEvent.externalCallId,
      provider: callEvent.provider,
      normalizedNumber: normalized.normalized,
      mockDevOnly: true,
    });

    if (callerMatch.status === 'matched') {
      await this.appendAuditEvent(identity, undefined, AuditEventType.enum.caller_matched, 'call_event', callEvent.id, {
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

        let priority: SupportSessionPriority = SupportSessionPriority.enum.normal;
        if (dto.preferredPriority) {
          const parsed = SupportSessionPriority.safeParse(dto.preferredPriority);
          if (!parsed.success) {
            throw new BadRequestException(
              `Invalid preferredPriority: ${dto.preferredPriority}. Allowed: ${SupportSessionPriority.options.join(', ')}`
            );
          }
          priority = parsed.data;
        }

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

        await this.store.saveSession(session);
        createdSession = session;

        // Link call to session
        const updatedCall: CallEventShape = {
          ...callEvent,
          sessionId: session.id,
          status: CallStatus.enum.answered,
          answeredAt: now,
          updatedAt: now,
        };
        await this.store.saveCallEvent(updatedCall);

        autoCreateResult = AutoCreateSessionResult.enum.auto_created;

        await this.appendAuditEvent(
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

        await this.appendAuditEvent(
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

  async createFromTelephonyWebhook(
    identity: DevIdentity,
    webhookEvent: TelephonyWebhookEventShape,
    mappedCall: CallEventShape
  ) {
    requirePermission(identity, 'call:write');
    const normalized = normalizePhoneNumber(
      webhookEvent.rawCallerNumber ?? mappedCall.caller.rawNumber
    );
    const callerMatch = matchCallerByPhone(normalized);
    const now = new Date().toISOString();
    const callEvent: CallEventShape = CallEvent.parse({
      ...mappedCall,
      tenantId: identity.tenantId,
      caller: {
        ...mappedCall.caller,
        normalizedNumber: mappedCall.caller.normalizedNumber ?? normalized.normalized,
        countryCodeHint: normalized.countryCode,
      },
      callerMatch,
      metadata: {
        ...mappedCall.metadata,
        sourceEventId: webhookEvent.sourceEventId,
        adapterMode: webhookEvent.adapterMode,
        verificationStatus: webhookEvent.verification.status,
        telephonyBridgeBoundary: true,
      },
      updatedAt: now,
    });

    await this.store.saveCallEvent(callEvent);

    await this.appendAuditEvent(identity, undefined, AuditEventType.enum.call_event_received, 'call_event', callEvent.id, {
      externalCallId: callEvent.externalCallId,
      provider: callEvent.provider,
      normalizedNumber: callEvent.caller.normalizedNumber,
      sourceEventId: webhookEvent.sourceEventId,
      telephonyBridgeBoundary: true,
      mockDevOnly: true,
    });

    if (callerMatch.status === 'matched') {
      await this.appendAuditEvent(identity, undefined, AuditEventType.enum.caller_matched, 'call_event', callEvent.id, {
        externalCallId: callEvent.externalCallId,
        normalizedNumber: callEvent.caller.normalizedNumber,
        matchStatus: callerMatch.status,
        matchConfidence: callerMatch.confidence,
        customerId: callerMatch.customerId,
        customerName: callerMatch.customerName,
        telephonyBridgeBoundary: true,
        mockDevOnly: true,
      });
    }

    return { callEvent, receivedAt: now };
  }

  async listRecentCalls(identity: DevIdentity): Promise<CallEventShape[]>{
    requirePermission(identity, 'call:read');
    return await this.store.listCallEvents(identity.tenantId);
  }

  async getCall(identity: DevIdentity, id: string): Promise<CallEventShape>{
    requirePermission(identity, 'call:read');
    const call = await this.store.getCallEvent(identity.tenantId, id);
    if (!call) {
      throw new NotFoundException(`Call event ${id} not found`);
    }
    return call;
  }

  async linkCallToSession(
    identity: DevIdentity,
    callId: string,
    dto: { sessionId: string }
  ): Promise<{ callEvent: CallEventShape; linkedAt: string }> {
    requirePermission(identity, 'call:write');
    const call = await this.getCall(identity, callId);

    const session = await this.store.getSession(identity.tenantId, dto.sessionId);
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

    await this.store.saveCallEvent(updated);

    const updatedSession = {
      ...session,
      callEventIds: Array.from(new Set([...session.callEventIds, callId])),
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveSession(updatedSession);

    await this.appendAuditEvent(identity, dto.sessionId, AuditEventType.enum.call_linked_to_session, 'call_event', callId, {
      externalCallId: call.externalCallId,
      sessionId: dto.sessionId,
      normalizedNumber: call.caller.normalizedNumber,
      mockDevOnly: true,
    });

    return { callEvent: updated, linkedAt: updated.updatedAt };
  }

  private getAllowedTransitions(): Array<{ from: string; to: string }> {
    return [
      { from: CallStatus.enum.ringing, to: CallStatus.enum.answered },
      { from: CallStatus.enum.ringing, to: CallStatus.enum.missed },
      { from: CallStatus.enum.answered, to: CallStatus.enum.on_hold },
      { from: CallStatus.enum.on_hold, to: CallStatus.enum.answered },
      { from: CallStatus.enum.answered, to: CallStatus.enum.ended },
      { from: CallStatus.enum.on_hold, to: CallStatus.enum.ended },
    ];
  }

  async updateCallStatus(
    identity: DevIdentity,
    callId: string,
    dto: { status: string; reason?: string }
  ): Promise<{ callEvent: CallEventShape; previousStatus: string; newStatus: string; changedAt: string }> {
    requirePermission(identity, 'call:write');
    const call = await this.getCall(identity, callId);
    const previousStatus = call.status;
    const newStatus = dto.status;

    if (previousStatus === newStatus) {
      throw new BadRequestException(`Call is already in status '${newStatus}'`);
    }

    const allowed = this.getAllowedTransitions();
    const isAllowed = allowed.some((t) => t.from === previousStatus && t.to === newStatus);
    if (!isAllowed) {
      throw new BadRequestException(
        `Invalid status transition from '${previousStatus}' to '${newStatus}'. Allowed from '${previousStatus}': ${allowed
          .filter((t) => t.from === previousStatus)
          .map((t) => t.to)
          .join(', ')}`
      );
    }

    const now = new Date().toISOString();
    const updated: CallEventShape = {
      ...call,
      status: newStatus as CallStatus,
      updatedAt: now,
      ...(newStatus === CallStatus.enum.answered && !call.answeredAt ? { answeredAt: now } : {}),
      ...(newStatus === CallStatus.enum.ended ? { endedAt: now } : {}),
      ...(newStatus === CallStatus.enum.missed ? { endedAt: now } : {}),
    };

    await this.store.saveCallEvent(updated);

    await this.appendAuditEvent(
      identity,
      call.sessionId ?? undefined,
      AuditEventType.enum.call_status_changed,
      'call_event',
      callId,
      {
        externalCallId: call.externalCallId,
        previousStatus,
        newStatus,
        reason: dto.reason ?? undefined,
        mockDevOnly: true,
        mockNote: 'This is a mock status change. No real telephony is connected.',
      }
    );

    return { callEvent: updated, previousStatus, newStatus, changedAt: now };
  }

  async recordTelephonyAuditEvent(
    identity: DevIdentity,
    sessionId: string | undefined,
    eventType: AuditEventType,
    resourceId: string,
    metadata: TelephonyAuditMetadataShape
  ): Promise<void> {
    requirePermission(identity, 'telephony:control');
    const safeMetadata = TelephonyAuditMetadata.parse(metadata);
    await this.appendAuditEvent(
      identity,
      sessionId,
      eventType,
      'telephony_bridge',
      resourceId,
      safeMetadata
    );
  }

  async attachMockRecording(
    identity: DevIdentity,
    callId: string,
    dto: { source?: string; durationSeconds?: number }
  ): Promise<{ recording: CallRecordingShape; attachedAt: string }> {
    requirePermission(identity, 'recording:write');
    const call = await this.getCall(identity, callId);
    const now = new Date().toISOString();

    const recording: CallRecordingShape = CallRecording.parse({
      id: randomUUID(),
      tenantId: identity.tenantId,
      callEventId: call.id,
      supportSessionId: call.sessionId,
      source: dto.source ?? CallRecordingSource.enum.mock_generated,
      status: CallRecordingStatus.enum.available,
      durationSeconds: dto.durationSeconds ?? 0,
      mockMediaUrl: `mock://recordings/${call.id}/placeholder.mp3`,
      placeholderReference: `mock-ref-${call.id.slice(0, 8)}`,
      storageType: CallRecordingStorageType.enum.mock_inline,
      checksumHash: `sha256-mock-${call.id.slice(0, 8)}`,
      createdAt: now,
      mockDevOnly: true,
      complianceDisclaimer: 'This is a mock recording. No real audio was captured. Not compliance-grade.',
      noRealAudio: true,
    });

    await this.store.saveCallRecording(recording);

    await this.appendAuditEvent(
      identity,
      call.sessionId ?? undefined,
      AuditEventType.enum.call_recording_attached,
      'call_recording',
      recording.id,
      {
        callEventId: call.id,
        supportSessionId: call.sessionId,
        recordingId: recording.id,
        source: recording.source,
        status: recording.status,
        durationSeconds: recording.durationSeconds,
        storageType: recording.storageType,
        mockDevOnly: true,
        noRealAudio: true,
      }
    );

    return { recording, attachedAt: now };
  }

  async listCallRecordings(identity: DevIdentity, callId: string): Promise<CallRecordingShape[]>{
    requirePermission(identity, 'recording:read');
    await this.getCall(identity, callId);
    return await this.store.listCallRecordings(identity.tenantId, callId);
  }

  async reviewCallRecording(
    identity: DevIdentity,
    callId: string,
    recordingId: string
  ) {
    requirePermission(identity, 'recording:write');
    await this.getCall(identity, callId);
    const recording = await this.store.getCallRecording(identity.tenantId, recordingId);
    if (!recording || recording.callEventId !== callId) {
      throw new NotFoundException(`Recording ${recordingId} not found for call ${callId}`);
    }

    const now = new Date().toISOString();
    const updated: CallRecordingShape = {
      ...recording,
      status: CallRecordingStatus.enum.mock_only,
      reviewedAt: now,
      reviewedBy: identity.userId,
      updatedAt: now,
    };

    await this.store.saveCallRecording(updated);

    await this.appendAuditEvent(
      identity,
      recording.supportSessionId ?? undefined,
      AuditEventType.enum.call_recording_reviewed,
      'call_recording',
      recordingId,
      {
        callEventId: callId,
        supportSessionId: recording.supportSessionId,
        recordingId,
        previousStatus: recording.status,
        newStatus: updated.status,
        reviewedBy: identity.userId,
        mockDevOnly: true,
        noRealAudio: true,
      }
    );

    return { recording: updated, reviewedAt: now };
  }

  async recordPlaybackOpened(
    identity: DevIdentity,
    callId: string,
    recordingId: string
  ) {
    requirePermission(identity, 'recording:read');
    await this.getCall(identity, callId);
    const recording = await this.store.getCallRecording(identity.tenantId, recordingId);
    if (!recording || recording.callEventId !== callId) {
      throw new NotFoundException(`Recording ${recordingId} not found for call ${callId}`);
    }

    const now = new Date().toISOString();

    await this.appendAuditEvent(
      identity,
      recording.supportSessionId ?? undefined,
      AuditEventType.enum.call_recording_playback_opened,
      'call_recording',
      recordingId,
      {
        callEventId: callId,
        supportSessionId: recording.supportSessionId,
        recordingId,
        source: recording.source,
        status: recording.status,
        durationSeconds: recording.durationSeconds,
        storageType: recording.storageType,
        mockDevOnly: true,
        noRealAudio: true,
        placeholderOnly: true,
      }
    );

    return {
      playbackState: {
        recordingId,
        callEventId: callId,
        openedAt: now,
        openedBy: identity.userId,
        mockDevOnly: true,
        noRealAudio: true,
        placeholderOnly: true,
      },
      recordedAt: now,
    };
  }

  async linkTicketToCall(
    identity: DevIdentity,
    callId: string,
    dto: { ticketReferenceId: string }
  ): Promise<{ callEvent: CallEventShape; linkedAt: string }> {
    requirePermission(identity, 'ticket:link');
    const call = await this.getCall(identity, callId);
    const tickets = await this.store.getTicketReferences(identity.tenantId, call.sessionId ?? '');
    const ticket = tickets.find((t) => t.id === dto.ticketReferenceId);
    if (!ticket) {
      throw new NotFoundException(`Ticket reference ${dto.ticketReferenceId} not found`);
    }
    const linkedTicketIds = (call.metadata.linkedTicketIds as string[] | undefined) ?? [];
    const updated: CallEventShape = {
      ...call,
      metadata: {
        ...call.metadata,
        linkedTicketIds: Array.from(new Set([...linkedTicketIds, dto.ticketReferenceId])),
      },
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveCallEvent(updated);
    await this.appendAuditEvent(
      identity,
      call.sessionId ?? undefined,
      AuditEventType.enum.ticket_linked_to_call,
      'call_event',
      callId,
      { ticketReferenceId: dto.ticketReferenceId, externalTicketId: ticket.externalTicketId }
    );
    return { callEvent: updated, linkedAt: updated.updatedAt };
  }

  async unlinkTicketFromCall(
    identity: DevIdentity,
    callId: string,
    dto: { ticketReferenceId: string }
  ): Promise<{ callEvent: CallEventShape; unlinkedAt: string }> {
    requirePermission(identity, 'ticket:unlink');
    const call = await this.getCall(identity, callId);
    const linkedTicketIds = (call.metadata.linkedTicketIds as string[] | undefined) ?? [];
    if (!linkedTicketIds.includes(dto.ticketReferenceId)) {
      throw new NotFoundException(`Ticket reference ${dto.ticketReferenceId} is not linked to call ${callId}`);
    }
    const updated: CallEventShape = {
      ...call,
      metadata: {
        ...call.metadata,
        linkedTicketIds: linkedTicketIds.filter((id) => id !== dto.ticketReferenceId),
      },
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveCallEvent(updated);
    await this.appendAuditEvent(
      identity,
      call.sessionId ?? undefined,
      AuditEventType.enum.ticket_unlinked_from_call,
      'call_event',
      callId,
      { ticketReferenceId: dto.ticketReferenceId }
    );
    return { callEvent: updated, unlinkedAt: updated.updatedAt };
  }

  async getCallTimeline(identity: DevIdentity, callId: string) {
    requirePermission(identity, 'call:read');
    const call = await this.getCall(identity, callId);
    const allAuditEvents = await this.store.getAllAuditEvents(identity.tenantId);
    const relatedAuditEvents = allAuditEvents.filter(
      (e) =>
        e.resourceId === callId ||
        e.metadata.externalCallId === call.externalCallId ||
        (call.sessionId && e.sessionId === call.sessionId)
    );

    const items: CallTimelineItemShape[] = [];

    // Call received
    items.push(
      CallTimelineItem.parse({
        id: `tl-${call.id.slice(0, 8)}-rcv`,
        callEventId: call.id,
        sessionId: call.sessionId,
        type: CallTimelineItemType.enum.call_received,
        timestamp: call.createdAt,
        actorId: call.tenantId,
        actorType: 'system',
        title: 'Call received',
        description: `Incoming call from ${call.caller.rawNumber}${call.caller.normalizedNumber ? ` (${call.caller.normalizedNumber})` : ''}`,
        metadata: { provider: call.provider, mockDevOnly: true },
      })
    );

    // Caller matched / no match
    if (call.callerMatch) {
      if (call.callerMatch.status === 'matched') {
        items.push(
          CallTimelineItem.parse({
            id: `tl-${call.id.slice(0, 8)}-mtch`,
            callEventId: call.id,
            sessionId: call.sessionId,
            type: CallTimelineItemType.enum.caller_matched,
            timestamp: call.createdAt,
            title: 'Caller matched',
            description: `Matched to ${call.callerMatch.customerName ?? 'unknown customer'} with confidence ${call.callerMatch.confidence}`,
            metadata: { customerName: call.callerMatch.customerName, matchedTicketIds: call.callerMatch.matchedTicketIds, mockDevOnly: true },
          })
        );
      } else {
        items.push(
          CallTimelineItem.parse({
            id: `tl-${call.id.slice(0, 8)}-nmt`,
            callEventId: call.id,
            sessionId: call.sessionId,
            type: CallTimelineItemType.enum.caller_no_match,
            timestamp: call.createdAt,
            title: 'Caller not matched',
            description: `No fixture match for ${call.caller.normalizedNumber ?? call.caller.rawNumber}`,
            metadata: { matchStatus: call.callerMatch.status, mockDevOnly: true },
          })
        );
      }
    }

    // Session auto-created
    const autoCreatedEvent = relatedAuditEvents.find((e) => e.eventType === AuditEventType.enum.support_session_auto_created);
    if (autoCreatedEvent) {
      items.push(
        CallTimelineItem.parse({
          id: `tl-${call.id.slice(0, 8)}-auto`,
          callEventId: call.id,
          sessionId: autoCreatedEvent.sessionId ?? undefined,
          type: CallTimelineItemType.enum.session_auto_created,
          timestamp: autoCreatedEvent.createdAt,
          actorId: autoCreatedEvent.actorId,
          actorType: autoCreatedEvent.actorType,
          title: 'Support session auto-created',
          description: `Session created from incoming call`,
          metadata: { sessionId: autoCreatedEvent.sessionId, mockDevOnly: true },
        })
      );
    }

    // Session linked
    const linkedEvent = relatedAuditEvents.find((e) =>
      e.eventType === AuditEventType.enum.call_linked_to_session ||
      e.eventType === AuditEventType.enum.call_auto_linked_to_session
    );
    if (linkedEvent && !autoCreatedEvent) {
      items.push(
        CallTimelineItem.parse({
          id: `tl-${call.id.slice(0, 8)}-lnk`,
          callEventId: call.id,
          sessionId: linkedEvent.sessionId ?? undefined,
          type: CallTimelineItemType.enum.session_linked,
          timestamp: linkedEvent.createdAt,
          actorId: linkedEvent.actorId,
          actorType: linkedEvent.actorType,
          title: 'Call linked to session',
          description: `Linked to session ${linkedEvent.sessionId ?? 'unknown'}`,
          metadata: { sessionId: linkedEvent.sessionId, mockDevOnly: true },
        })
      );
    }

    // Status changes from audit events
    const statusEvents = relatedAuditEvents.filter((e) => e.eventType === AuditEventType.enum.call_status_changed);
    for (const evt of statusEvents) {
      const newStatus = evt.metadata.newStatus as string;
      const previousStatus = evt.metadata.previousStatus as string;
      let type: CallTimelineItemType = CallTimelineItemType.enum.audit_event;
      let title = `Status changed to ${newStatus}`;
      if (newStatus === CallStatus.enum.answered && previousStatus === CallStatus.enum.on_hold) {
        type = CallTimelineItemType.enum.call_resumed;
        title = 'Call resumed';
      } else if (newStatus === CallStatus.enum.answered) {
        type = CallTimelineItemType.enum.call_answered;
        title = 'Call answered';
      }
      if (newStatus === CallStatus.enum.on_hold) { type = CallTimelineItemType.enum.call_held; title = 'Call placed on hold'; }
      if (newStatus === CallStatus.enum.ended) { type = CallTimelineItemType.enum.call_ended; title = 'Call ended'; }
      if (newStatus === CallStatus.enum.missed) { type = CallTimelineItemType.enum.call_missed; title = 'Call missed'; }

      items.push(
        CallTimelineItem.parse({
          id: `tl-${call.id.slice(0, 8)}-st-${evt.id.slice(0, 8)}`,
          callEventId: call.id,
          sessionId: evt.sessionId ?? undefined,
          type,
          timestamp: evt.createdAt,
          actorId: evt.actorId,
          actorType: evt.actorType,
          title,
          description: `Previous status: ${evt.metadata.previousStatus as string}${evt.metadata.reason ? ` — ${evt.metadata.reason as string}` : ''}`,
          metadata: { previousStatus: evt.metadata.previousStatus, newStatus: evt.metadata.newStatus, mockDevOnly: true },
        })
      );
    }

    // Greeting suggested
    const greetingEvents = relatedAuditEvents.filter((e) => e.eventType === AuditEventType.enum.greeting_suggestion_generated);
    for (const evt of greetingEvents) {
      items.push(
        CallTimelineItem.parse({
          id: `tl-${call.id.slice(0, 8)}-gr-${evt.id.slice(0, 8)}`,
          callEventId: call.id,
          sessionId: evt.sessionId ?? undefined,
          type: CallTimelineItemType.enum.greeting_suggested,
          timestamp: evt.createdAt,
          actorId: evt.actorId,
          actorType: evt.actorType,
          title: 'Greeting suggested',
          description: `Tone: ${evt.metadata.tone as string}`,
          metadata: { tone: evt.metadata.tone, provider: evt.metadata.provider, mockDevOnly: true },
        })
      );
    }

    const telephonyEventTypes = new Set<string>([
      AuditEventType.enum.telephony_webhook_received,
      AuditEventType.enum.telephony_webhook_verified,
      AuditEventType.enum.telephony_call_control_requested,
      AuditEventType.enum.telephony_call_control_succeeded,
      AuditEventType.enum.telephony_call_control_failed,
    ]);
    const telephonyEvents = relatedAuditEvents.filter((e) =>
      telephonyEventTypes.has(e.eventType)
    );
    for (const evt of telephonyEvents) {
      const metadata: Record<string, string | boolean> = {
        providerType: String(evt.metadata.providerType ?? 'mock'),
        adapterMode: String(evt.metadata.adapterMode ?? 'mock'),
        success: Boolean(evt.metadata.success ?? true),
        mockDevOnly: true,
      };
      if (typeof evt.metadata.controlIntent === 'string') {
        metadata.controlIntent = evt.metadata.controlIntent;
      }
      if (typeof evt.metadata.verificationStatus === 'string') {
        metadata.verificationStatus = evt.metadata.verificationStatus;
      }
      items.push(
        CallTimelineItem.parse({
          id: `tl-${call.id.slice(0, 8)}-tel-${evt.id.slice(0, 8)}`,
          callEventId: call.id,
          sessionId: evt.sessionId ?? undefined,
          type: CallTimelineItemType.enum.telephony_bridge_event,
          timestamp: evt.createdAt,
          actorId: evt.actorId,
          actorType: evt.actorType,
          title: 'Telephony bridge event',
          description: evt.eventType,
          metadata,
        })
      );
    }

    // Evidence bundle generated
    const evidenceEvents = relatedAuditEvents.filter((e) => e.eventType === AuditEventType.enum.evidence_bundle_generated);
    for (const evt of evidenceEvents) {
      items.push(
        CallTimelineItem.parse({
          id: `tl-${call.id.slice(0, 8)}-ev-${evt.id.slice(0, 8)}`,
          callEventId: call.id,
          sessionId: evt.sessionId ?? undefined,
          type: CallTimelineItemType.enum.evidence_bundle_generated,
          timestamp: evt.createdAt,
          actorId: evt.actorId,
          actorType: evt.actorType,
          title: 'Evidence bundle generated',
          description: `Format: ${evt.metadata.format as string}`,
          metadata: { format: evt.metadata.format, mockDevOnly: true },
        })
      );
    }

    // Sort by timestamp
    items.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return { timelineItems: items, generatedAt: new Date().toISOString() };
  }

  private async appendAuditEvent(
    identity: DevIdentity,
    sessionId: string | undefined,
    eventType: AuditEventType,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
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
    await this.store.saveAuditEvent(event);
  }
}
