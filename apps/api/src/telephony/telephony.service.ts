import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AuditEventType,
  CallDirection,
  CallStatus,
  TelephonyAdapterStatus,
  TelephonyCallControlAction,
  TelephonyCallControlIntent,
  TelephonyWebhookEvent,
  TelephonyWebhookLifecycleEventType,
  type TelephonyAdapterStatus as TelephonyAdapterStatusShape,
  type TelephonyCallControlResult as TelephonyCallControlResultShape,
  type TelephonyWebhookEvent as TelephonyWebhookEventShape,
} from '@supportplane/contracts';
import {
  MockTelephonyAdapter,
  sanitizeTelephonyError,
  type TelephonyAdapter,
} from '@supportplane/connectors';
import { CallsService } from '../calls/calls.service.js';
import { type DevIdentity } from '../auth/auth.types.js';
import { requirePermission } from '../auth/rbac.js';

export interface FakeProviderWebhookBody {
  sourceEventId?: string;
  externalCallId: string;
  eventType?: string;
  rawCallerNumber?: string;
  callerDisplayName?: string;
  autoCreateSession?: boolean;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class TelephonyService {
  private readonly adapter: TelephonyAdapter = new MockTelephonyAdapter();

  constructor(
    @Inject(CallsService)
    private readonly callsService: CallsService
  ) {}

  async getStatus(identity: DevIdentity): Promise<TelephonyAdapterStatusShape> {
    requirePermission(identity, 'telephony:read');
    const status = this.adapter.getStatus(identity.tenantId);
    await this.callsService.recordTelephonyAuditEvent(
      identity,
      undefined,
      AuditEventType.enum.telephony_adapter_tested,
      identity.tenantId,
      {
        tenantId: identity.tenantId as never,
        actorId: identity.userId,
        providerType: status.providerType,
        adapterMode: status.mode,
        verificationStatus: status.webhookVerification.status,
        success: true,
        mockDevOnly: true,
      }
    );
    return status;
  }

  async test(identity: DevIdentity): Promise<TelephonyAdapterStatusShape> {
    requirePermission(identity, 'telephony:read');
    const status = TelephonyAdapterStatus.parse(this.adapter.test(identity.tenantId));
    await this.callsService.recordTelephonyAuditEvent(
      identity,
      undefined,
      AuditEventType.enum.telephony_adapter_tested,
      identity.tenantId,
      {
        tenantId: identity.tenantId as never,
        actorId: identity.userId,
        providerType: status.providerType,
        adapterMode: status.mode,
        verificationStatus: status.webhookVerification.status,
        success: true,
        mockDevOnly: true,
      }
    );
    return status;
  }

  async receiveFakeProviderWebhook(
    identity: DevIdentity,
    body: FakeProviderWebhookBody,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{ event: TelephonyWebhookEventShape; callEvent: unknown; mockDevOnly: boolean; receivedAt: string }> {
    requirePermission(identity, 'telephony:webhook');
    const lifecycle = TelephonyWebhookLifecycleEventType.safeParse(
      body.eventType ?? 'incoming_call'
    );
    if (!lifecycle.success) {
      throw new BadRequestException(
        `Invalid telephony lifecycle event: ${body.eventType}. Allowed: ${TelephonyWebhookLifecycleEventType.options.join(', ')}`
      );
    }
    const verification = this.adapter.verifyWebhook({
      tenantId: identity.tenantId as never,
      headers,
      body: body as unknown as Record<string, unknown>,
    });
    const now = new Date().toISOString();
    const event = TelephonyWebhookEvent.parse({
      tenantId: identity.tenantId as never,
      providerType: 'mock',
      adapterMode: 'mock',
      sourceEventId: body.sourceEventId ?? `mock-provider-${randomUUID()}`,
      externalCallId: body.externalCallId,
      eventType: lifecycle.data,
      rawCallerNumber: body.rawCallerNumber,
      callerDisplayName: body.callerDisplayName,
      occurredAt: now,
      verification,
      autoCreateSession: body.autoCreateSession,
      metadata: body.metadata ?? {},
      mockDevOnly: true,
    });

    const mapped = this.adapter.mapWebhookToCallEvent({
      ...event,
      id: randomUUID(),
      now,
    });
    const { callEvent, receivedAt } = await this.callsService.createFromTelephonyWebhook(
      identity,
      event,
      mapped
    );

    await this.callsService.recordTelephonyAuditEvent(
      identity,
      callEvent.sessionId,
      AuditEventType.enum.telephony_webhook_received,
      callEvent.id,
      {
        tenantId: identity.tenantId as never,
        actorId: identity.userId,
        providerType: event.providerType,
        adapterMode: event.adapterMode,
        externalCallId: event.externalCallId,
        callEventId: callEvent.id,
        verificationStatus: verification.status,
        success: true,
        mockDevOnly: true,
      }
    );
    await this.callsService.recordTelephonyAuditEvent(
      identity,
      callEvent.sessionId,
      AuditEventType.enum.telephony_webhook_verified,
      callEvent.id,
      {
        tenantId: identity.tenantId as never,
        actorId: identity.userId,
        providerType: event.providerType,
        adapterMode: event.adapterMode,
        externalCallId: event.externalCallId,
        callEventId: callEvent.id,
        verificationStatus: verification.status,
        success: true,
        mockDevOnly: true,
      }
    );

    return { event, callEvent, mockDevOnly: true, receivedAt };
  }

  async controlCall(
    identity: DevIdentity,
    callId: string,
    body: { action: string; reason?: string; target?: string }
  ): Promise<TelephonyCallControlResultShape> {
    requirePermission(identity, 'telephony:control');
    const call = await this.callsService.getCall(identity, callId);
    const action = TelephonyCallControlAction.safeParse(body.action);
    if (!action.success) {
      throw new BadRequestException(
        `Invalid telephony control action: ${body.action}. Allowed: ${TelephonyCallControlAction.options.join(', ')}`
      );
    }
    const now = new Date().toISOString();
    const intent = TelephonyCallControlIntent.parse({
      tenantId: identity.tenantId as never,
      actorId: identity.userId,
      callEventId: call.id,
      externalCallId: call.externalCallId,
      providerType: 'mock',
      adapterMode: 'mock',
      action: action.data,
      target: body.target,
      reason: body.reason,
      requestedAt: now,
      mockDevOnly: true,
    });

    await this.callsService.recordTelephonyAuditEvent(
      identity,
      call.sessionId,
      AuditEventType.enum.telephony_call_control_requested,
      call.id,
      {
        tenantId: identity.tenantId as never,
        actorId: identity.userId,
        providerType: intent.providerType,
        adapterMode: intent.adapterMode,
        externalCallId: intent.externalCallId,
        callEventId: call.id,
        controlIntent: intent.action,
        success: true,
        mockDevOnly: true,
      }
    );

    const adapterResult = this.adapter.handleControlIntent(intent, call);
    if (!adapterResult.success || !adapterResult.resultingStatus) {
      await this.callsService.recordTelephonyAuditEvent(
        identity,
        call.sessionId,
        AuditEventType.enum.telephony_call_control_failed,
        call.id,
        {
          tenantId: identity.tenantId as never,
          actorId: identity.userId,
          providerType: intent.providerType,
          adapterMode: intent.adapterMode,
          externalCallId: intent.externalCallId,
          callEventId: call.id,
          controlIntent: intent.action,
          success: false,
          error: adapterResult.error,
          mockDevOnly: true,
        }
      );
      return adapterResult;
    }

    try {
      const transition = await this.callsService.updateCallStatus(identity, callId, {
        status: adapterResult.resultingStatus,
        reason: body.reason ?? `Telephony bridge intent: ${intent.action}`,
      });
      const result: TelephonyCallControlResultShape = {
        ...adapterResult,
        callEvent: transition.callEvent,
        resultingStatus: transition.newStatus as CallStatus,
      };
      await this.callsService.recordTelephonyAuditEvent(
        identity,
        transition.callEvent.sessionId,
        AuditEventType.enum.telephony_call_control_succeeded,
        call.id,
        {
          tenantId: identity.tenantId as never,
          actorId: identity.userId,
          providerType: intent.providerType,
          adapterMode: intent.adapterMode,
          externalCallId: intent.externalCallId,
          callEventId: call.id,
          controlIntent: intent.action,
          success: true,
          mockDevOnly: true,
        }
      );
      return result;
    } catch (error) {
      const sanitized = sanitizeTelephonyError(error);
      await this.callsService.recordTelephonyAuditEvent(
        identity,
        call.sessionId,
        AuditEventType.enum.telephony_call_control_failed,
        call.id,
        {
          tenantId: identity.tenantId as never,
          actorId: identity.userId,
          providerType: intent.providerType,
          adapterMode: intent.adapterMode,
          externalCallId: intent.externalCallId,
          callEventId: call.id,
          controlIntent: intent.action,
          success: false,
          error: sanitized,
          mockDevOnly: true,
        }
      );
      return {
        ...adapterResult,
        success: false,
        error: sanitized,
        completedAt: new Date().toISOString(),
      };
    }
  }

  async receiveAsteriskAmiEvent(
    identity: DevIdentity,
    body: {
      tenantId?: string;
      externalCallId: string;
      eventType: string;
      callerNumber: string;
      calleeNumber?: string;
      direction?: string;
      status?: string;
      rawEvent?: Record<string, unknown>;
      autoCreateSession?: boolean;
      preferredSessionTitle?: string;
      preferredPriority?: string;
    }
  ) {
    requirePermission(identity, 'telephony:webhook');

    const result = await this.callsService.createFromAsteriskAmiEvent(identity, {
      ...body,
      tenantId: body.tenantId ?? identity.tenantId,
    });

    return {
      callEvent: result.callEvent,
      autoCreateResult: result.autoCreateResult,
      createdSession: result.createdSession,
      source: 'asterisk-ami',
      sandboxOnly: true,
      pstn: false,
      recording: false,
      receivedAt: result.receivedAt,
    };
  }
}
