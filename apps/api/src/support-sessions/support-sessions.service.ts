import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InMemoryStore } from './in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import {
  SupportSessionStatus,
  SupportSessionPriority,
  AIContextProvenance,
  AuditEventType,
  AuditActorType,
  ConnectorMode,
  InternalNoteWritebackResult,
  EvidenceBundleFormat,
  GreetingSuggestionTone,
  ScreenObservationSource,
  ScreenObservationStatus,
  ScreenObservationSharingState,
  ScreenObservationRawImageRetention,

  type SupportSession as SupportSessionShape,
  type AIContextPacket as AIContextPacketShape,
  type AuditEvent as AuditEventShape,
  type TenantId,
  type SupportSessionId,
  type AIContextPacketId,
  type AuditEventId,
  type TicketingAdapterId,
  type InternalNoteDraft as InternalNoteDraftShape,
  type TicketReference as TicketReferenceShape,
  type ScreenObservation as ScreenObservationShape,
  type ScreenObservationId,

} from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import {
  createZammadAdapter,
  type TicketingAdapterDriver,
} from '@supportplane/connectors';
import {
  createDefaultModelGateway,
  GenerateDraftResponse,
  ModelSelection,
  type GenerateDraftResponse as GenerateDraftResponseShape,
  GreetingSuggestionResponse,
  type GreetingSuggestionResponse as GreetingSuggestionResponseShape,
} from '@supportplane/ai';
import { type DevIdentity } from '../auth/auth.types.js';
import { requirePermission } from '../auth/rbac.js';
import { ConnectorsService } from '../connectors/connectors.service.js';
import {
  buildEvidenceBundle,
  bundleToMarkdown,
} from '../evidence-bundle/evidence-bundle.builder.js';
import { redactPlaceholder } from '../evidence-bundle/redaction.js';

@Injectable()
export class SupportSessionsService {
  private readonly modelGateway = createDefaultModelGateway();
  private readonly fallbackAdapter = createZammadAdapter(
    ConnectorMode.enum.mock,
    'mock-adapter-001' as TicketingAdapterId
  );

  constructor(
    @Inject(ConnectorsService)
    private readonly connectorsService: ConnectorsService,
    @Inject(InMemoryStore)
    private readonly store: Store
  ) {}

  private getAdapter(): TicketingAdapterDriver {
    return this.connectorsService.getZammadAdapter() ?? this.fallbackAdapter;
  }

  async createSession(
    identity: DevIdentity,
    dto: { title: string; description?: string; priority?: string }
  ): Promise<SupportSessionShape> {
    requirePermission(identity, 'support_session:create');
    const now = new Date().toISOString();
    const id = randomUUID();
    const priority = dto.priority
      ? SupportSessionPriority.parse(dto.priority)
      : SupportSessionPriority.enum.normal;

    const session: SupportSessionShape = {
      id: id as SupportSessionId,
      tenantId: identity.tenantId as TenantId,
      status: SupportSessionStatus.enum.open,
      priority,
      title: dto.title,
      description: dto.description,
      assignedUserId: identity.userId,
      linkedTicketIds: [],
      aiContextPacketIds: [],
      screenObservationIds: [],
      callEventIds: [],
      auditEventIds: [],
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await this.store.saveSession(session);
    await this.appendAuditEvent(
      identity,
      session.id,
      AuditEventType.enum.session_created,
      'session',
      session.id,
      { title: session.title }
    );
    return session;
  }

  async getSession(identity: DevIdentity, id: string): Promise<SupportSessionShape>{
    requirePermission(identity, 'support_session:read');
    const session = await this.store.getSession(identity.tenantId, id);
    if (!session) {
      await this.recordTenantBoundaryDenial(identity, 'support_session', id);
      throw new NotFoundException(`Support session ${id} not found`);
    }
    return session;
  }

  async loadTicketContext(
    identity: DevIdentity,
    sessionId: string,
    externalTicketId: string
  ): Promise<{
    ticketReference: unknown;
    contextPacket: AIContextPacketShape;
    session: SupportSessionShape;
  }> {
    requirePermission(identity, 'ticket_context:load');
    const session = await this.getSession(identity, sessionId);
    const adapter = this.getAdapter();
    const mode = this.connectorsService.getMode();

    const ticket = await adapter.getTicket(
      identity.tenantId as TenantId,
      externalTicketId
    );

    const linkedSession: SupportSessionShape = {
      ...session,
      linkedTicketIds: Array.from(new Set([...session.linkedTicketIds, (ticket as { id: string }).id])),
      callEventIds: session.callEventIds,
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveSession(linkedSession);
    await this.store.saveTicketReference(linkedSession.id, ticket as TicketReferenceShape);

    const packet: AIContextPacketShape = {
      id: randomUUID() as AIContextPacketId,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      provenance: AIContextProvenance.enum.ticket,
      sourceTicketIds: [(ticket as { id: string }).id],
      sourceAdapterId: (adapter.getAdapterMetadata?.().id as string) ?? 'unknown',
      payload: {
        ticketSubject: (ticket as { subject: string }).subject,
        ticketStatus: (ticket as { status: string }).status,
        ticketPriority: (ticket as { priority: string }).priority,
        customerEmail: (ticket as { customerEmail?: string }).customerEmail,
        customerName: (ticket as { customerName?: string }).customerName,
        connectorMode: mode,
      },
      redactionLog: [],
      createdAt: new Date().toISOString(),
    };
    await this.store.saveContextPacket(packet);
    const updatedSession: SupportSessionShape = {
      ...linkedSession,
      aiContextPacketIds: Array.from(
        new Set([...linkedSession.aiContextPacketIds, packet.id])
      ),
      callEventIds: linkedSession.callEventIds,
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveSession(updatedSession);

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ticket_linked,
      'ticket_reference',
      (ticket as { id: string }).id,
      { externalTicketId, connectorMode: mode, connectorType: adapter.adapterType }
    );
    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ai_context_loaded,
      'ai_context_packet',
      packet.id,
      { provenance: packet.provenance, connectorMode: mode }
    );
    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.zammad_ticket_loaded,
      'ticket_reference',
      (ticket as { id: string }).id,
      { externalTicketId, connectorMode: mode, connectorType: adapter.adapterType }
    );

    return { ticketReference: ticket, contextPacket: packet, session: updatedSession };
  }

  async generateDraftSuggestion(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      operatorInstructions?: string;
      modelSelection?: { provider?: string; model?: string };
    }
  ): Promise<GenerateDraftResponseShape> {
    requirePermission(identity, 'ai:generate');
    const session = await this.getSession(identity, sessionId);
    const contextPackets = await this.store.getContextPackets(
      identity.tenantId,
      sessionId
    );
    const ticketReferences = await this.store.getTicketReferences(
      identity.tenantId,
      sessionId
    );
    const modelSelection = dto.modelSelection
      ? ModelSelection.parse(dto.modelSelection)
      : undefined;

    const response = GenerateDraftResponse.parse(
      await this.modelGateway.generateDraft({
        tenantId: identity.tenantId,
        actorId: identity.userId,
        session,
        ticketReferences,
        contextPackets,
        operatorInstructions: dto.operatorInstructions,
        modelSelection,
      })
    );

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ai_draft_generated,
      'support_session',
      session.id,
      {
        provider: response.provider,
        model: response.model,
        promptId: response.prompt.id,
        promptVersion: response.prompt.version,
        contextHash: response.contextHash,
        mockOnly: response.safety.mockOnly,
      }
    );

    return response;
  }

  async generateGreetingSuggestion(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      callEventId?: string;
      tone?: string;
      modelSelection?: { provider?: string; model?: string };
    }
  ): Promise<GreetingSuggestionResponseShape> {
    const session = await this.getSession(identity, sessionId);
    const tone = dto.tone
      ? GreetingSuggestionTone.parse(dto.tone)
      : GreetingSuggestionTone.enum.professional;
    const modelSelection = dto.modelSelection
      ? ModelSelection.parse(dto.modelSelection)
      : undefined;

    let callEvent = undefined;
    if (dto.callEventId) {
      callEvent = await this.store.getCallEvent(identity.tenantId, dto.callEventId);
      if (!callEvent) {
        await this.recordTenantBoundaryDenial(identity, 'call_event', dto.callEventId);
        throw new NotFoundException(`Call event ${dto.callEventId} not found`);
      }
      if (callEvent.sessionId && callEvent.sessionId !== sessionId) {
        throw new ForbiddenException(`Call event ${dto.callEventId} is not linked to session ${sessionId}`);
      }
    }

    const ticketReferences = await this.store.getTicketReferences(
      identity.tenantId,
      sessionId
    );

    const response = GreetingSuggestionResponse.parse(
      await this.modelGateway.generateGreeting({
        tenantId: identity.tenantId,
        actorId: identity.userId,
        supportSessionId: session.id,
        callEventId: callEvent?.id,
        tone,
        callerName: callEvent?.caller?.displayName,
        normalizedPhoneNumber: callEvent?.caller?.normalizedNumber,
        matchedTicketIds: callEvent?.callerMatch?.matchedTicketIds ?? ticketReferences.map((t) => t.externalTicketId),
        matchedCustomerName: callEvent?.callerMatch?.customerName,
        sessionTitle: session.title,
        modelSelection,
      })
    );

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.greeting_suggestion_generated,
      'support_session',
      session.id,
      {
        provider: response.provider,
        model: response.model,
        promptId: response.prompt.id,
        promptVersion: response.prompt.version,
        contextHash: response.contextHash,
        tone: response.suggestion.tone,
        callEventId: callEvent?.id,
        greetingText: response.suggestion.greetingText,
        mockOnly: response.safety.mockOnly,
      }
    );

    return response;
  }

  async createInternalNoteDraft(
    identity: DevIdentity,
    sessionId: string,
    dto: { externalTicketId: string; body: string; subject?: string }
  ): Promise<InternalNoteDraftShape> {
    requirePermission(identity, 'ticket:write');
    await this.getSession(identity, sessionId);
    const mode = this.connectorsService.getMode();

    const draft: InternalNoteDraftShape = {
      id: randomUUID() as never,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      externalTicketId: dto.externalTicketId,
      subject: dto.subject,
      body: dto.body,
      reviewed: false,
      createdAt: new Date().toISOString(),
    };

    await this.store.saveInternalNoteDraft(draft);

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.internal_note_drafted,
      'internal_note_draft',
      draft.id,
      {
        externalTicketId: dto.externalTicketId,
        connectorMode: mode,
        draftLength: dto.body.length,
      }
    );

    return draft;
  }

  async writebackInternalNote(
    identity: DevIdentity,
    sessionId: string,
    dto: { draftId: string; externalTicketId: string; body: string }
  ): Promise<unknown> {
    requirePermission(identity, 'ticket:write');
    await this.getSession(identity, sessionId);
    const adapter = this.getAdapter();
    const mode = this.connectorsService.getMode();

    const draft = await this.store.getInternalNoteDraft(identity.tenantId, dto.draftId);
    if (!draft) {
      throw new NotFoundException(`Draft ${dto.draftId} not found`);
    }

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.internal_note_writeback_attempted,
      'internal_note_draft',
      dto.draftId,
      {
        externalTicketId: dto.externalTicketId,
        connectorMode: mode,
        connectorType: adapter.adapterType,
      }
    );

    const result = await adapter.writeInternalNote(dto.externalTicketId, dto.body);
    const typedResult = result as { success: boolean; externalArticleId?: string; error?: { code: string; message: string } };

    if (typedResult.success) {
      await this.appendAuditEvent(
        identity,
        sessionId,
        AuditEventType.enum.internal_note_writeback_succeeded,
        'internal_note_draft',
        dto.draftId,
        {
          externalTicketId: dto.externalTicketId,
          externalArticleId: typedResult.externalArticleId,
          connectorMode: mode,
          connectorType: adapter.adapterType,
        }
      );
    } else {
      await this.appendAuditEvent(
        identity,
        sessionId,
        AuditEventType.enum.internal_note_writeback_failed,
        'internal_note_draft',
        dto.draftId,
        {
          externalTicketId: dto.externalTicketId,
          connectorMode: mode,
          connectorType: adapter.adapterType,
          errorCode: typedResult.error?.code,
          errorMessage: typedResult.error?.message,
        }
      );
    }

    return InternalNoteWritebackResult.parse({
      success: typedResult.success,
      externalArticleId: typedResult.externalArticleId,
      error: typedResult.error
        ? {
            code: typedResult.error.code as never,
            message: typedResult.error.message,
            safeToDisplay: true,
          }
        : undefined,
      metadata: {
        connectorMode: mode,
        connectorType: adapter.adapterType,
      },
    });
  }

  async createContextPacket(
    identity: DevIdentity,
    sessionId: string,
    dto: { provenance: string; payload: Record<string, unknown> }
  ): Promise<AIContextPacketShape> {
    requirePermission(identity, 'context_packet:create');
    const session = await this.getSession(identity, sessionId);
    const provenance = AIContextProvenance.parse(dto.provenance);
    const packet: AIContextPacketShape = {
      id: randomUUID() as AIContextPacketId,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      provenance,
      sourceTicketIds: [],
      payload: dto.payload,
      redactionLog: [],
      createdAt: new Date().toISOString(),
    };
    await this.store.saveContextPacket(packet);
    await this.store.saveSession({
      ...session,
      aiContextPacketIds: Array.from(
        new Set([...session.aiContextPacketIds, packet.id])
      ),
      updatedAt: new Date().toISOString(),
    });
    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ai_context_loaded,
      'ai_context_packet',
      packet.id,
      { provenance: packet.provenance, source: 'manual' }
    );
    return packet;
  }

  async getContextPackets(
    identity: DevIdentity,
    sessionId: string
  ): Promise<AIContextPacketShape[]>{
    requirePermission(identity, 'support_session:read');
    await this.getSession(identity, sessionId);
    return await this.store.getContextPackets(identity.tenantId, sessionId);
  }

  async getAuditEvents(
    identity: DevIdentity,
    sessionId: string
  ): Promise<AuditEventShape[]>{
    requirePermission(identity, 'audit:read');
    await this.getSession(identity, sessionId);
    return await this.store.getAuditEvents(identity.tenantId, sessionId);
  }

  async listSessions(identity: DevIdentity): Promise<SupportSessionShape[]>{
    requirePermission(identity, 'support_session:read');
    return await this.store.listSessions(identity.tenantId);
  }

  async captureMockScreenObservation(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      kind: string;
      callEventId?: string;
      rawInputPlaceholder?: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
    }
  ): Promise<ScreenObservationShape> {
    requirePermission(identity, 'screen_observation:create');
    const session = await this.getSession(identity, sessionId);
    const now = new Date().toISOString();
    const id = randomUUID();
    const sharingState = await this.store.getSharingState(identity.tenantId, sessionId);
    const { redacted: redactedSummary, redactionStatus } = redactPlaceholder(dto.rawInputPlaceholder);

    const observation: ScreenObservationShape = {
      id: id as ScreenObservationId,
      tenantId: identity.tenantId as TenantId,
      sessionId: session.id,
      callEventId: dto.callEventId,
      source: ScreenObservationSource.enum.mock_operator_companion,
      kind: dto.kind as ScreenObservationShape['kind'],
      status: ScreenObservationStatus.enum.review_required,
      rawInputPlaceholder: dto.rawInputPlaceholder,
      redactedSummary,
      redactionStatus,
      appLabel: dto.appLabel,
      windowLabel: dto.windowLabel,
      urlLabel: dto.urlLabel,
      sharingState: sharingState?.state ?? ScreenObservationSharingState.enum.inactive,
      rawImageRetention: ScreenObservationRawImageRetention.enum.disabled,
      safetyFlags: {
        mockDevOnly: true,
        noRealScreenCapture: true,
        noRawPixels: true,
        noClipboardAccess: true,
        noOcr: true,
        noCredentialCapture: true,
        rawImageStored: false,
      },
      noRawPixels: true,
      noClipboard: true,
      noOcr: true,
      noCredentialCapture: true,
      mockDevOnly: true,
      createdAt: now,
    };

    await this.store.saveScreenObservation(observation);
    await this.store.saveSession({
      ...session,
      screenObservationIds: Array.from(new Set([...session.screenObservationIds, observation.id])),
      updatedAt: now,
    });

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.screen_observation_captured,
      'screen_observation',
      observation.id,
      {
        kind: observation.kind,
        source: observation.source,
        callEventId: observation.callEventId,
        mockDevOnly: true,
        noRawPixels: true,
        noClipboard: true,
        sharingState: observation.sharingState,
        redactionStatus: observation.redactionStatus,
      }
    );

    return observation;
  }

  async captureActiveWindowMockMetadata(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      callEventId?: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
      rawInputPlaceholder?: string;
    }
  ): Promise<{ observation: ScreenObservationShape; redactedSummary: string; mockDevOnly: boolean }> {
    requirePermission(identity, 'screen_observation:create');
    const session = await this.getSession(identity, sessionId);
    const now = new Date().toISOString();
    const id = randomUUID();
    const sharingState = await this.store.getSharingState(identity.tenantId, sessionId);
    const { redacted: redactedSummary, redactionStatus } = redactPlaceholder(dto.rawInputPlaceholder);

    const observation: ScreenObservationShape = {
      id: id as ScreenObservationId,
      tenantId: identity.tenantId as TenantId,
      sessionId: session.id,
      callEventId: dto.callEventId,
      source: ScreenObservationSource.enum.mock_operator_companion,
      kind: 'active_window' as ScreenObservationShape['kind'],
      status: ScreenObservationStatus.enum.review_required,
      rawInputPlaceholder: dto.rawInputPlaceholder,
      redactedSummary,
      redactionStatus,
      appLabel: dto.appLabel,
      windowLabel: dto.windowLabel,
      urlLabel: dto.urlLabel,
      sharingState: sharingState?.state ?? ScreenObservationSharingState.enum.inactive,
      rawImageRetention: ScreenObservationRawImageRetention.enum.disabled,
      safetyFlags: {
        mockDevOnly: true,
        noRealScreenCapture: true,
        noRawPixels: true,
        noClipboardAccess: true,
        noOcr: true,
        noCredentialCapture: true,
        rawImageStored: false,
      },
      noRawPixels: true,
      noClipboard: true,
      noOcr: true,
      noCredentialCapture: true,
      mockDevOnly: true,
      createdAt: now,
    };

    await this.store.saveScreenObservation(observation);
    await this.store.saveSession({
      ...session,
      screenObservationIds: Array.from(new Set([...session.screenObservationIds, observation.id])),
      updatedAt: now,
    });

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.active_window_metadata_captured,
      'screen_observation',
      observation.id,
      {
        kind: observation.kind,
        source: observation.source,
        callEventId: observation.callEventId,
        mockDevOnly: true,
        noRawPixels: true,
        noClipboard: true,
        sharingState: observation.sharingState,
        redactionStatus: observation.redactionStatus,
      }
    );

    return { observation, redactedSummary, mockDevOnly: true };
  }

  async attachManualScreenshotMetadata(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      callEventId?: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
      rawInputPlaceholder?: string;
      fileNameHint?: string;
    }
  ): Promise<{ observation: ScreenObservationShape; redactedSummary: string; mockDevOnly: boolean; rawImageRetention: 'disabled' }> {
    requirePermission(identity, 'screen_observation:create');
    const session = await this.getSession(identity, sessionId);
    const now = new Date().toISOString();
    const id = randomUUID();
    const { redacted: redactedSummary, redactionStatus } = redactPlaceholder(dto.rawInputPlaceholder);

    const observation: ScreenObservationShape = {
      id: id as ScreenObservationId,
      tenantId: identity.tenantId as TenantId,
      sessionId: session.id,
      callEventId: dto.callEventId,
      source: ScreenObservationSource.enum.manual_screenshot_metadata,
      kind: 'screenshot_metadata' as ScreenObservationShape['kind'],
      status: ScreenObservationStatus.enum.review_required,
      rawInputPlaceholder: dto.rawInputPlaceholder,
      redactedSummary,
      redactionStatus,
      appLabel: dto.appLabel,
      windowLabel: dto.windowLabel,
      urlLabel: dto.urlLabel,
      sharingState: ScreenObservationSharingState.enum.active,
      rawImageRetention: ScreenObservationRawImageRetention.enum.disabled,
      safetyFlags: {
        mockDevOnly: true,
        noRealScreenCapture: true,
        noRawPixels: true,
        noClipboardAccess: true,
        noOcr: true,
        noCredentialCapture: true,
        rawImageStored: false,
      },
      noRawPixels: true,
      noClipboard: true,
      noOcr: true,
      noCredentialCapture: true,
      mockDevOnly: true,
      createdAt: now,
    };

    await this.store.saveScreenObservation(observation);
    await this.store.saveSession({
      ...session,
      screenObservationIds: Array.from(new Set([...session.screenObservationIds, observation.id])),
      updatedAt: now,
    });

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.manual_screenshot_metadata_attached,
      'screen_observation',
      observation.id,
      {
        kind: observation.kind,
        source: observation.source,
        callEventId: observation.callEventId,
        mockDevOnly: true,
        noRawPixels: true,
        noClipboard: true,
        sharingState: observation.sharingState,
        redactionStatus: observation.redactionStatus,
        fileNameHint: dto.fileNameHint,
      }
    );

    return { observation, redactedSummary, mockDevOnly: true, rawImageRetention: 'disabled' };
  }

  async uploadStructuredScreenObservation(
    identity: DevIdentity,
    sessionId: string,
    dto: {
      callEventId?: string;
      kind: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
      rawInputPlaceholder?: string;
    }
  ): Promise<{ observation: ScreenObservationShape; redactedSummary: string; mockDevOnly: boolean; redactionStatus: ScreenObservationShape['redactionStatus'] }> {
    requirePermission(identity, 'screen_observation:create');
    const session = await this.getSession(identity, sessionId);
    const now = new Date().toISOString();
    const id = randomUUID();
    const { redacted: redactedSummary, redactionStatus } = redactPlaceholder(dto.rawInputPlaceholder);

    const observation: ScreenObservationShape = {
      id: id as ScreenObservationId,
      tenantId: identity.tenantId as TenantId,
      sessionId: session.id,
      callEventId: dto.callEventId,
      source: ScreenObservationSource.enum.structured_upload,
      kind: dto.kind as ScreenObservationShape['kind'],
      status: ScreenObservationStatus.enum.review_required,
      rawInputPlaceholder: dto.rawInputPlaceholder,
      redactedSummary,
      redactionStatus,
      appLabel: dto.appLabel,
      windowLabel: dto.windowLabel,
      urlLabel: dto.urlLabel,
      sharingState: ScreenObservationSharingState.enum.active,
      rawImageRetention: ScreenObservationRawImageRetention.enum.disabled,
      safetyFlags: {
        mockDevOnly: true,
        noRealScreenCapture: true,
        noRawPixels: true,
        noClipboardAccess: true,
        noOcr: true,
        noCredentialCapture: true,
        rawImageStored: false,
      },
      noRawPixels: true,
      noClipboard: true,
      noOcr: true,
      noCredentialCapture: true,
      mockDevOnly: true,
      createdAt: now,
    };

    await this.store.saveScreenObservation(observation);
    await this.store.saveSession({
      ...session,
      screenObservationIds: Array.from(new Set([...session.screenObservationIds, observation.id])),
      updatedAt: now,
    });

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.structured_screen_observation_uploaded,
      'screen_observation',
      observation.id,
      {
        kind: observation.kind,
        source: observation.source,
        callEventId: observation.callEventId,
        mockDevOnly: true,
        noRawPixels: true,
        noClipboard: true,
        sharingState: observation.sharingState,
        redactionStatus: observation.redactionStatus,
      }
    );

    return { observation, redactedSummary, mockDevOnly: true, redactionStatus };
  }

  async getSharingState(
    identity: DevIdentity,
    sessionId: string
  ) {
    requirePermission(identity, 'support_session:read');
    await this.getSession(identity, sessionId);
    const sharingState = await this.store.getSharingState(identity.tenantId, sessionId);
    return {
      sessionId,
      state: sharingState?.state ?? ScreenObservationSharingState.enum.inactive,
      mockDevOnly: true,
    };
  }

  async updateSharingState(
    identity: DevIdentity,
    sessionId: string,
    dto: { state: string }
  ): Promise<{ sessionId: string; state: ScreenObservationShape['sharingState']; previousState: ScreenObservationShape['sharingState'] | undefined; mockDevOnly: boolean }> {
    requirePermission(identity, 'screen_observation:create');
    await this.getSession(identity, sessionId);
    const newState = ScreenObservationSharingState.parse(dto.state);
    const existing = await this.store.getSharingState(identity.tenantId, sessionId);
    const previousState = existing?.state;

    if (previousState === newState) {
      throw new BadRequestException(`Sharing state is already '${newState}'`);
    }

    const allowedTransitions: Record<string, string[]> = {
      inactive: ['active'],
      active: ['paused', 'inactive'],
      paused: ['active', 'inactive'],
    };

    const allowed = allowedTransitions[previousState ?? 'inactive'] ?? [];
    if (!allowed.includes(newState)) {
      throw new BadRequestException(
        `Invalid sharing state transition from '${previousState ?? 'inactive'}' to '${newState}'. Allowed: ${allowed.join(', ')}`
      );
    }

    const now = new Date().toISOString();
    await this.store.saveSharingState({
      tenantId: identity.tenantId,
      sessionId,
      state: newState,
      mockDevOnly: true,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    const eventTypeMap: Record<string, AuditEventType> = {
      active: AuditEventType.enum.screen_observation_sharing_started,
      paused: AuditEventType.enum.screen_observation_sharing_paused,
      inactive: AuditEventType.enum.screen_observation_sharing_stopped,
    };

    await this.appendAuditEvent(
      identity,
      sessionId,
      eventTypeMap[newState],
      'support_session',
      sessionId,
      {
        previousState: previousState ?? 'inactive',
        newState,
        mockDevOnly: true,
      }
    );

    return { sessionId, state: newState, previousState: previousState ?? ScreenObservationSharingState.enum.inactive, mockDevOnly: true };
  }

  async listScreenObservations(
    identity: DevIdentity,
    sessionId: string
  ): Promise<ScreenObservationShape[]>{
    requirePermission(identity, 'support_session:read');
    await this.getSession(identity, sessionId);
    return await this.store.listScreenObservations(identity.tenantId, sessionId);
  }

  async reviewScreenObservation(
    identity: DevIdentity,
    sessionId: string,
    observationId: string,
    dto: { status: 'approved' | 'discarded' }
  ): Promise<{ observation: ScreenObservationShape; previousStatus: string; newStatus: string }> {
    requirePermission(identity, 'screen_observation:review');
    await this.getSession(identity, sessionId);
    const observation = await this.store.getScreenObservation(identity.tenantId, observationId);
    if (!observation) {
      throw new NotFoundException(`Screen observation ${observationId} not found`);
    }
    if (observation.sessionId !== sessionId) {
      throw new NotFoundException(`Screen observation ${observationId} does not belong to session ${sessionId}`);
    }

    const previousStatus = observation.status;
    const now = new Date().toISOString();
    const updated: ScreenObservationShape = {
      ...observation,
      status: dto.status as ScreenObservationShape['status'],
      reviewedAt: now,
      reviewedBy: identity.userId,
    };

    await this.store.saveScreenObservation(updated);

    await this.appendAuditEvent(
      identity,
      sessionId,
      dto.status === 'approved'
        ? AuditEventType.enum.screen_observation_reviewed
        : AuditEventType.enum.screen_observation_discarded,
      'screen_observation',
      observationId,
      {
        previousStatus,
        newStatus: dto.status,
        reviewedBy: identity.userId,
        mockDevOnly: true,
      }
    );

    return { observation: updated, previousStatus, newStatus: dto.status };
  }

  async createContextPacketFromObservation(
    identity: DevIdentity,
    sessionId: string,
    observationId: string,
    dto?: { provenance?: string }
  ): Promise<{ observation: ScreenObservationShape; contextPacketId: string; mockDevOnly: boolean }> {
    requirePermission(identity, 'screen_observation:review');
    requirePermission(identity, 'context_packet:create');
    const session = await this.getSession(identity, sessionId);
    const observation = await this.store.getScreenObservation(identity.tenantId, observationId);
    if (!observation) {
      throw new NotFoundException(`Screen observation ${observationId} not found`);
    }
    if (observation.sessionId !== sessionId) {
      throw new NotFoundException(`Screen observation ${observationId} does not belong to session ${sessionId}`);
    }
    if (observation.status !== 'approved') {
      throw new Error(`Screen observation ${observationId} must be approved before creating a context packet`);
    }

    const provenance = dto?.provenance ?? 'screen_observation';
    const packet: AIContextPacketShape = {
      id: randomUUID() as AIContextPacketId,
      tenantId: identity.tenantId as TenantId,
      sessionId,
      provenance: provenance as AIContextPacketShape['provenance'],
      sourceTicketIds: [],
      payload: {
        source: 'screen_observation',
        observationId: observation.id,
        kind: observation.kind,
        appLabel: observation.appLabel,
        windowLabel: observation.windowLabel,
        urlLabel: observation.urlLabel,
        redactedSummary: observation.redactedSummary,
        rawInputPlaceholder: observation.redactedSummary ?? '[REDACTED]',
        mockDevOnly: true,
      },
      redactionLog: [
        { field: 'rawInputPlaceholder', reason: 'secret', method: 'mask' },
        { field: 'payload', reason: 'policy', method: 'mask' },
      ],
      createdAt: new Date().toISOString(),
    };

    await this.store.saveContextPacket(packet);
    await this.store.saveSession({
      ...session,
      aiContextPacketIds: Array.from(new Set([...session.aiContextPacketIds, packet.id])),
      updatedAt: new Date().toISOString(),
    });

    const updatedObservation: ScreenObservationShape = {
      ...observation,
      contextPacketId: packet.id,
    };
    await this.store.saveScreenObservation(updatedObservation);

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.screen_observation_context_packet_created,
      'screen_observation',
      observationId,
      {
        contextPacketId: packet.id,
        provenance,
        mockDevOnly: true,
      }
    );

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.ai_context_loaded,
      'ai_context_packet',
      packet.id,
      { provenance, source: 'screen_observation', observationId }
    );

    return { observation: updatedObservation, contextPacketId: packet.id, mockDevOnly: true };
  }

  async generateEvidenceBundle(
    identity: DevIdentity,
    sessionId: string,
    format: EvidenceBundleFormat
  ) {
    requirePermission(identity, 'evidence_bundle:read');
    const session = await this.getSession(identity, sessionId);
    const tickets = await this.store.getTicketReferences(identity.tenantId, sessionId);
    const contextPackets = await this.store.getContextPackets(identity.tenantId, sessionId);
    const callEvents = await this.store.listCallEventsForSession(identity.tenantId, sessionId);
    const callRecordingsNested = await Promise.all(
      callEvents.map((call) => this.store.listCallRecordings(identity.tenantId, call.id))
    );
    const callRecordings = callRecordingsNested.flat();
    const screenObservations = await this.store.listScreenObservations(identity.tenantId, sessionId);
    const sessionAuditEvents = await this.store.getAuditEvents(identity.tenantId, sessionId);
    const callEventIds = new Set<string>(callEvents.map((call) => call.id));
    const externalCallIds = new Set(callEvents.map((call) => call.externalCallId));
    const allAuditEvents = await this.store.getAllAuditEvents(identity.tenantId);
    const callAuditEvents = allAuditEvents.filter((event) => {
      if (event.sessionId === sessionId) return false;
      return (
        event.eventType === AuditEventType.enum.telephony_adapter_tested ||
        callEventIds.has(event.resourceId) ||
        (typeof event.metadata.externalCallId === 'string' && externalCallIds.has(event.metadata.externalCallId))
      );
    });
    const auditEvents = [...sessionAuditEvents, ...callAuditEvents].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );

    const storeType = process.env['SUPPORTPLANE_STORE'] ?? 'memory';
    const bundle = buildEvidenceBundle({
      tenantId: identity.tenantId as TenantId,
      sessionId: session.id as SupportSessionId,
      generatedBy: identity.userId,
      format,
      session,
      tickets,
      contextPackets,
      auditEvents,
      callEvents,
      callRecordings,
      screenObservations,
      connectorMode: this.connectorsService.getMode(),
      storeType: storeType === 'postgres' ? 'postgres' : 'memory',
    });

    await this.appendAuditEvent(
      identity,
      sessionId,
      AuditEventType.enum.evidence_bundle_generated,
      'evidence_bundle',
      bundle.bundleId,
      { format, bundleId: bundle.bundleId, version: bundle.version }
    );

    if (format === EvidenceBundleFormat.enum.markdown) {
      await this.appendAuditEvent(
        identity,
        sessionId,
        AuditEventType.enum.evidence_bundle_exported,
        'evidence_bundle',
        bundle.bundleId,
        { format: 'markdown', bundleId: bundle.bundleId }
      );
    } else {
      await this.appendAuditEvent(
        identity,
        sessionId,
        AuditEventType.enum.evidence_bundle_exported,
        'evidence_bundle',
        bundle.bundleId,
        { format: 'json', bundleId: bundle.bundleId }
      );
    }

    return {
      bundle,
      markdown: format === EvidenceBundleFormat.enum.markdown ? bundleToMarkdown(bundle) : undefined,
    };
  }

  private async appendAuditEvent(
    identity: DevIdentity,
    sessionId: string,
    eventType: AuditEventType,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const now = new Date().toISOString();
    const event: AuditEventShape = {
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

  private async recordTenantBoundaryDenial(identity: DevIdentity, resourceType: string, resourceId: string): Promise<void> {
    const now = new Date().toISOString();
    const metadata = { reason: 'not_found_in_actor_tenant', authMode: identity.authMode };
    const event: AuditEventShape = {
      id: randomUUID() as AuditEventId,
      tenantId: identity.tenantId as TenantId,
      eventType: AuditEventType.enum.tenant_boundary_denied,
      actorType: AuditActorType.enum.user,
      actorId: identity.userId,
      action: AuditEventType.enum.tenant_boundary_denied,
      resourceType,
      resourceId,
      metadata,
      integrityHash: computeIntegrityHash({
        eventType: AuditEventType.enum.tenant_boundary_denied,
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
