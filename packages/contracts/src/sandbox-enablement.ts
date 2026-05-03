import { z } from 'zod';

export const LocalAiProviderMode = z.enum(['mock', 'local']);
export type LocalAiProviderMode = z.infer<typeof LocalAiProviderMode>;

export const LocalAiProviderMetadata = z.object({
  provider: z.enum(['mock', 'ollama']),
  providerMode: LocalAiProviderMode,
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  contextHash: z.string().min(1),
  requestedAt: z.string().datetime(),
  latencyMs: z.number().int().nonnegative(),
  fallbackUsed: z.boolean(),
  noCloudCall: z.literal(true),
  autonomousSend: z.literal(false),
  redactionApplied: z.boolean(),
});
export type LocalAiProviderMetadata = z.infer<typeof LocalAiProviderMetadata>;

export const CredentialResolutionStatus = z.enum([
  'resolved',
  'disabled',
  'missing',
  'error',
]);
export type CredentialResolutionStatus = z.infer<typeof CredentialResolutionStatus>;

export const CredentialResolutionMetadata = z.object({
  tenantId: z.string().min(1),
  credentialReferenceId: z.string().min(1),
  resolver: z.enum(['openbao', 'disabled']),
  resolverMode: z.enum(['local-sandbox', 'disabled']),
  secretPath: z.string().min(1).optional(),
  status: CredentialResolutionStatus,
  resolvedAt: z.string().datetime().optional(),
  secretExposed: z.literal(false),
  persistedRawSecret: z.literal(false),
  safeLabel: z.string().min(1),
});
export type CredentialResolutionMetadata = z.infer<typeof CredentialResolutionMetadata>;

export const NatsOutboxEnvelope = z.object({
  envelopeVersion: z.literal('supportplane.outbox.v1'),
  stream: z.literal('SUPPORTPLANE_OUTBOX'),
  subject: z.string().min(1),
  tenantId: z.string().min(1),
  outboxItemId: z.string().min(1),
  supportActionId: z.string().min(1),
  sessionId: z.string().min(1),
  actionType: z.string().min(1),
  idempotencyKey: z.string().min(8),
  deliveryMode: z.enum(['mock', 'sandbox']),
  retry: z.object({
    attemptCount: z.number().int().min(0),
    maxAttempts: z.number().int().min(1),
    deadLetterSubject: z.literal('supportplane.outbox.deadletter'),
  }),
  safety: z.object({
    realNetwork: z.boolean(),
    writebackEnabled: z.boolean(),
    externalWriteAttempted: z.boolean(),
    noSecrets: z.literal(true),
  }),
  telemetry: z.object({
    correlationId: z.string().min(1).max(128),
    localOnly: z.literal(true),
    noSecrets: z.literal(true),
  }).optional(),
  createdAt: z.string().datetime(),
});
export type NatsOutboxEnvelope = z.infer<typeof NatsOutboxEnvelope>;

export const WorkerBackendMode = z.enum([
  'postgres-local-outbox',
  'nats-jetstream',
  'fallback-postgres-local-outbox',
]);
export type WorkerBackendMode = z.infer<typeof WorkerBackendMode>;

export const EgressPolicyDecision = z.object({
  allowed: z.boolean(),
  decision: z.enum([
    'allowed_local_sandbox_read',
    'blocked_by_default_deny',
    'blocked_external_url',
    'blocked_production_like_url',
    'blocked_by_kill_switch',
    'blocked_writeback_disabled',
    'blocked_tenant_guardrail',
  ]),
  reason: z.string().min(1),
  url: z.string().optional(),
  connectorType: z.string().min(1),
  operation: z.enum(['read', 'writeback']),
  tenantId: z.string().min(1),
  sandboxAllowlisted: z.boolean(),
  writebackEnabled: z.boolean(),
  killSwitchEnabled: z.boolean(),
  secretExposed: z.literal(false),
});
export type EgressPolicyDecision = z.infer<typeof EgressPolicyDecision>;
