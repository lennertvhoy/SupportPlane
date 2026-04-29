import { z } from 'zod';
import { EntityId, Timestamp, TenantId } from './base.js';

export const GreetingSuggestionTone = z.enum([
  'professional',
  'friendly',
  'concise',
]);
export type GreetingSuggestionTone = z.infer<typeof GreetingSuggestionTone>;

export const GreetingSuggestionContextSummary = z.object({
  callerName: z.string().optional(),
  normalizedPhoneNumber: z.string().optional(),
  matchedTicketIds: z.array(z.string()).default([]),
  matchedCustomerName: z.string().optional(),
  sessionTitle: z.string().optional(),
});
export type GreetingSuggestionContextSummary = z.infer<
  typeof GreetingSuggestionContextSummary
>;

export const GreetingSuggestionMetadata = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  promptId: z.string().min(1).optional(),
  promptVersion: z.string().min(1).optional(),
  contextHash: z.string().min(1).optional(),
  mockDevOnly: z.literal(true),
  reviewRequired: z.literal(true),
  generatedAt: Timestamp,
});
export type GreetingSuggestionMetadata = z.infer<
  typeof GreetingSuggestionMetadata
>;

export const GreetingSuggestion = z.object({
  id: EntityId.brand<'GreetingSuggestionId'>(),
  tenantId: TenantId,
  supportSessionId: EntityId,
  callEventId: EntityId.optional(),
  greetingText: z.string().min(1),
  tone: GreetingSuggestionTone,
  contextSummary: GreetingSuggestionContextSummary,
  metadata: GreetingSuggestionMetadata,
});
export type GreetingSuggestion = z.infer<typeof GreetingSuggestion>;

export const GreetingSuggestionRequest = z.object({
  tenantId: z.string().min(1),
  actorId: z.string().min(1),
  supportSessionId: z.string().min(1),
  callEventId: z.string().min(1).optional(),
  tone: GreetingSuggestionTone.default('professional'),
  callerName: z.string().optional(),
  normalizedPhoneNumber: z.string().optional(),
  matchedTicketIds: z.array(z.string()).default([]),
  matchedCustomerName: z.string().optional(),
  sessionTitle: z.string().optional(),
  modelSelection: z
    .object({
      provider: z.enum(['mock', 'ollama', 'lmstudio']).default('mock'),
      model: z.string().min(1).max(128).default('mock-greeting-v1'),
    })
    .optional(),
});
export type GreetingSuggestionRequest = z.infer<
  typeof GreetingSuggestionRequest
>;

export const GreetingSuggestionResponse = z.object({
  suggestion: GreetingSuggestion,
  provider: z.enum(['mock', 'ollama', 'lmstudio']),
  model: z.string().min(1).max(128),
  prompt: z.object({
    id: z.string().min(1).max(128),
    version: z.string().min(1).max(64),
    purpose: z.string().min(1).max(256),
  }),
  contextHash: z.string().min(1).max(128),
  usage: z.object({
    inputTokens: z.number().int().nonnegative().optional(),
    outputTokens: z.number().int().nonnegative().optional(),
    totalTokens: z.number().int().nonnegative().optional(),
    costEstimateUsd: z.number().nonnegative().optional(),
    latencyMs: z.number().int().nonnegative().optional(),
    placeholder: z.boolean().default(true),
  }),
  safety: z.object({
    mockOnly: z.literal(true),
    externalCallMade: z.literal(false),
    policyChecks: z.array(z.string()).default([]),
    reviewRequired: z.literal(true),
    autoSend: z.literal(false),
    voiceEnabled: z.literal(false),
  }),
  generatedAt: z.string().datetime(),
});
export type GreetingSuggestionResponse = z.infer<
  typeof GreetingSuggestionResponse
>;
