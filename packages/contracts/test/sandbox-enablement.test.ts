import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CredentialResolutionMetadata,
  EgressPolicyDecision,
  LocalAiProviderMetadata,
  NatsOutboxEnvelope,
  WorkerBackendMode,
} from '../src/index.js';

describe('sandbox enablement contracts', () => {
  it('captures Ollama local AI metadata without cloud/autonomous send', () => {
    const parsed = LocalAiProviderMetadata.parse({
      provider: 'ollama',
      providerMode: 'local',
      model: 'llama3.1:8b',
      promptVersion: 'ollama-draft-v1',
      contextHash: 'abc123',
      requestedAt: '2026-04-29T20:00:00.000Z',
      latencyMs: 42,
      fallbackUsed: false,
      noCloudCall: true,
      autonomousSend: false,
      redactionApplied: true,
    });
    assert.equal(parsed.provider, 'ollama');
    assert.equal(parsed.noCloudCall, true);
    assert.equal(parsed.autonomousSend, false);
  });

  it('keeps credential resolution metadata secret-free', () => {
    const parsed = CredentialResolutionMetadata.parse({
      tenantId: 'dev-tenant',
      credentialReferenceId: 'cred-ref-dev-001',
      resolver: 'openbao',
      resolverMode: 'local-sandbox',
      secretPath: 'supportplane/dev/zammad/api-token',
      status: 'resolved',
      resolvedAt: '2026-04-29T20:00:00.000Z',
      secretExposed: false,
      persistedRawSecret: false,
      safeLabel: 'OpenBao sandbox resolver',
    });
    assert.equal(parsed.secretExposed, false);
    assert.equal(parsed.persistedRawSecret, false);
  });

  it('preserves NATS outbox idempotency envelope fields', () => {
    const parsed = NatsOutboxEnvelope.parse({
      envelopeVersion: 'supportplane.outbox.v1',
      stream: 'SUPPORTPLANE_OUTBOX',
      subject: 'supportplane.outbox.ready',
      tenantId: 'dev-tenant',
      outboxItemId: 'outbox-1',
      supportActionId: 'action-1',
      sessionId: 'session-1',
      actionType: 'ticket_note',
      idempotencyKey: 'tenant:session:ticket_note:abc',
      deliveryMode: 'mock',
      retry: {
        attemptCount: 0,
        maxAttempts: 3,
        deadLetterSubject: 'supportplane.outbox.deadletter',
      },
      safety: {
        realNetwork: false,
        writebackEnabled: false,
        externalWriteAttempted: false,
        noSecrets: true,
      },
      createdAt: '2026-04-29T20:00:00.000Z',
    });
    assert.equal(parsed.idempotencyKey, 'tenant:session:ticket_note:abc');
    assert.equal(parsed.safety.noSecrets, true);
  });

  it('models worker backend modes and egress denials', () => {
    assert.equal(WorkerBackendMode.parse('nats-jetstream'), 'nats-jetstream');
    const decision = EgressPolicyDecision.parse({
      allowed: false,
      decision: 'blocked_writeback_disabled',
      reason: 'Writeback remains blocked.',
      connectorType: 'zammad',
      operation: 'writeback',
      tenantId: 'dev-tenant',
      sandboxAllowlisted: true,
      writebackEnabled: false,
      killSwitchEnabled: false,
      secretExposed: false,
    });
    assert.equal(decision.secretExposed, false);
  });
});
