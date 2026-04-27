import {
  CallDirection,
  CallStatus,
  TelephonyAdapterCapabilities,
  TelephonyAdapterConfig,
  TelephonyAdapterMode,
  TelephonyAdapterStatus,
  TelephonyCallControlAction,
  TelephonyCallControlResult,
  TelephonyProviderError,
  TelephonyProviderType,
  TelephonyWebhookVerification,
  TelephonyWebhookVerificationStatus,
  normalizePhoneNumber,
  type CallEvent,
  type TelephonyAdapterCapabilities as TelephonyAdapterCapabilitiesShape,
  type TelephonyAdapterConfig as TelephonyAdapterConfigShape,
  type TelephonyAdapterStatus as TelephonyAdapterStatusShape,
  type TelephonyCallControlIntent as TelephonyCallControlIntentShape,
  type TelephonyCallControlResult as TelephonyCallControlResultShape,
  type TelephonyProviderError as TelephonyProviderErrorShape,
  type TelephonyWebhookEvent as TelephonyWebhookEventShape,
  type TelephonyWebhookVerification as TelephonyWebhookVerificationShape,
} from '@supportplane/contracts';

export interface TelephonyAdapter {
  readonly providerType: TelephonyProviderType;
  readonly mode: TelephonyAdapterMode;
  getStatus(tenantId: string): TelephonyAdapterStatusShape;
  test(tenantId: string): TelephonyAdapterStatusShape;
  verifyWebhook(input: {
    tenantId: string;
    headers?: Record<string, string | string[] | undefined>;
    body: Record<string, unknown>;
  }): TelephonyWebhookVerificationShape;
  mapWebhookToCallEvent(input: TelephonyWebhookEventShape & { id: string; now: string }): CallEvent;
  handleControlIntent(
    intent: TelephonyCallControlIntentShape,
    currentCall?: CallEvent
  ): TelephonyCallControlResultShape;
  getAdapterMetadata(): Record<string, unknown>;
}

export const MOCK_TELEPHONY_CAPABILITIES: TelephonyAdapterCapabilitiesShape =
  TelephonyAdapterCapabilities.parse({
    inboundCalls: true,
    answer: true,
    hold: true,
    resume: true,
    end: true,
    transfer: false,
    recording: false,
    transcription: false,
  });

const DISCLOSURES = [
  'Telephony bridge boundary',
  'Mock mode',
  'No real PBX connected',
  'No media or voice connected',
  'Controls update local mock state only',
];

const SECRET_KEY_PATTERN =
  /authorization|signature|token|secret|password|credential|api[-_]?key/i;

export function redactTelephonySecrets(
  value: Record<string, unknown>
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      redacted[key] = '[REDACTED]';
    } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      redacted[key] = redactTelephonySecrets(raw as Record<string, unknown>);
    } else if (
      typeof raw === 'string' &&
      (/^Bearer\s+/i.test(raw) || /^Token\s+/i.test(raw))
    ) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = raw;
    }
  }
  return redacted;
}

export function sanitizeTelephonyError(error: unknown): TelephonyProviderErrorShape {
  const maybe = error as { code?: unknown; message?: unknown };
  const code = typeof maybe?.code === 'string' ? maybe.code : 'TELEPHONY_ERROR';
  const message =
    typeof maybe?.message === 'string'
      ? maybe.message.replace(/Bearer\s+\S+|Token\s+\S+|signature=\S+/gi, '[REDACTED]')
      : 'Telephony adapter boundary error';
  return TelephonyProviderError.parse({
    code,
    message,
    safeToDisplay: true,
  });
}

export function createMockTelephonyConfig(
  tenantId: string
): TelephonyAdapterConfigShape {
  return TelephonyAdapterConfig.parse({
    tenantId,
    providerType: TelephonyProviderType.enum.mock,
    mode: TelephonyAdapterMode.enum.mock,
    displayName: 'Mock telephony bridge',
    webhookPath: '/telephony/webhooks/fake-provider',
    signatureRequired: false,
    capabilities: MOCK_TELEPHONY_CAPABILITIES,
    mockDevOnly: true,
    metadata: {
      boundaryOnly: true,
      noRealTelephonyConnected: true,
    },
  });
}

function statusForAction(action: TelephonyCallControlAction): CallStatus | undefined {
  switch (action) {
    case TelephonyCallControlAction.enum.answer:
      return CallStatus.enum.answered;
    case TelephonyCallControlAction.enum.hold:
      return CallStatus.enum.on_hold;
    case TelephonyCallControlAction.enum.resume:
      return CallStatus.enum.answered;
    case TelephonyCallControlAction.enum.end:
      return CallStatus.enum.ended;
    case TelephonyCallControlAction.enum.transfer:
      return undefined;
  }
}

export class MockTelephonyAdapter implements TelephonyAdapter {
  readonly providerType = TelephonyProviderType.enum.mock;
  readonly mode = TelephonyAdapterMode.enum.mock;

  constructor(private readonly configFactory = createMockTelephonyConfig) {}

  getStatus(tenantId: string): TelephonyAdapterStatusShape {
    const config = this.configFactory(tenantId);
    return TelephonyAdapterStatus.parse({
      tenantId,
      providerType: config.providerType,
      mode: config.mode,
      health: 'healthy',
      connected: true,
      capabilities: config.capabilities ?? MOCK_TELEPHONY_CAPABILITIES,
      webhookVerification: this.buildVerification(),
      mockDevOnly: true,
      disclaimers: DISCLOSURES,
      metadata: redactTelephonySecrets(config.metadata),
    });
  }

  test(tenantId: string): TelephonyAdapterStatusShape {
    return {
      ...this.getStatus(tenantId),
      lastTestedAt: new Date().toISOString(),
    };
  }

  verifyWebhook(_input?: {
    tenantId: string;
    headers?: Record<string, string | string[] | undefined>;
    body: Record<string, unknown>;
  }): TelephonyWebhookVerificationShape {
    return this.buildVerification();
  }

  mapWebhookToCallEvent(
    input: TelephonyWebhookEventShape & { id: string; now: string }
  ): CallEvent {
    const normalized =
      input.normalizedPhoneNumber ??
      (input.rawCallerNumber ? normalizePhoneNumber(input.rawCallerNumber).normalized : undefined);

    return {
      id: input.id as never,
      tenantId: input.tenantId,
      provider: input.providerType,
      source: 'telephony_bridge',
      externalCallId: input.externalCallId,
      direction: CallDirection.enum.inbound,
      status: this.statusFromWebhook(input.eventType),
      caller: {
        rawNumber: input.rawCallerNumber ?? normalized ?? 'unknown',
        normalizedNumber: normalized,
        displayName: input.callerDisplayName,
      },
      startedAt: input.occurredAt,
      metadata: {
        sourceEventId: input.sourceEventId,
        adapterMode: input.adapterMode,
        verificationStatus: input.verification.status,
        telephonyBridgeBoundary: true,
        mockNote: 'No real telephony provider is connected.',
        ...redactTelephonySecrets(input.metadata),
      },
      mockDevOnly: true,
      createdAt: input.now,
      updatedAt: input.now,
    };
  }

  handleControlIntent(
    intent: TelephonyCallControlIntentShape,
    currentCall?: CallEvent
  ): TelephonyCallControlResultShape {
    const resultingStatus = statusForAction(intent.action);
    if (!resultingStatus || intent.action === TelephonyCallControlAction.enum.transfer) {
      return TelephonyCallControlResult.parse({
        intent,
        success: false,
        providerType: this.providerType,
        adapterMode: this.mode,
        error: {
          code: 'UNSUPPORTED_CONTROL_INTENT',
          message: 'This mock boundary does not support transfer.',
          safeToDisplay: true,
          providerType: this.providerType,
        },
        completedAt: new Date().toISOString(),
        mockDevOnly: true,
      });
    }

    return TelephonyCallControlResult.parse({
      intent,
      success: true,
      providerType: this.providerType,
      adapterMode: this.mode,
      callEvent: currentCall,
      resultingStatus,
      completedAt: new Date().toISOString(),
      mockDevOnly: true,
    });
  }

  getAdapterMetadata(): Record<string, unknown> {
    return {
      providerType: this.providerType,
      mode: this.mode,
      capabilities: MOCK_TELEPHONY_CAPABILITIES,
      disclaimers: DISCLOSURES,
    };
  }

  private buildVerification(): TelephonyWebhookVerificationShape {
    return TelephonyWebhookVerification.parse({
      status: TelephonyWebhookVerificationStatus.enum.not_required,
      checkedAt: new Date().toISOString(),
      signatureRequired: false,
      mockDevOnly: true,
      reason: 'Mock mode does not require webhook signatures.',
    });
  }

  private statusFromWebhook(eventType: TelephonyWebhookEventShape['eventType']): CallStatus {
    switch (eventType) {
      case 'call_answered':
      case 'call_resumed':
        return CallStatus.enum.answered;
      case 'call_held':
        return CallStatus.enum.on_hold;
      case 'call_ended':
        return CallStatus.enum.ended;
      case 'call_missed':
        return CallStatus.enum.missed;
      case 'incoming_call':
        return CallStatus.enum.ringing;
    }
    return CallStatus.enum.ringing;
  }
}

export function createTelephonyAdapter(): TelephonyAdapter {
  return new MockTelephonyAdapter();
}
