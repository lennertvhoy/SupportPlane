import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  AIContextPacket,
  SupportSession,
  TicketReference,
  type AIContextPacket as AIContextPacketShape,
  type SupportSession as SupportSessionShape,
  type TicketReference as TicketReferenceShape,
} from '@supportplane/contracts';

export const AI_VERSION = '0.1.0';

export const AiProviderId = z.enum(['mock']);
export type AiProviderId = z.infer<typeof AiProviderId>;

export const ModelSelection = z.object({
  provider: AiProviderId.default('mock'),
  model: z.string().min(1).max(128).default('mock-support-note-v1'),
});
export type ModelSelection = z.infer<typeof ModelSelection>;

export const PromptVersion = z.string().min(1).max(64);
export type PromptVersion = z.infer<typeof PromptVersion>;

export const ContextHash = z.string().min(1).max(128);
export type ContextHash = z.infer<typeof ContextHash>;

export const PromptTemplate = z.object({
  id: z.string().min(1).max(128),
  version: PromptVersion,
  purpose: z.string().min(1).max(256),
});
export type PromptTemplate = z.infer<typeof PromptTemplate>;

export const ModelUsageMetadata = z.object({
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  costEstimateUsd: z.number().nonnegative().optional(),
  latencyMs: z.number().int().nonnegative().optional(),
  placeholder: z.literal(true).default(true),
});
export type ModelUsageMetadata = z.infer<typeof ModelUsageMetadata>;

export const AiSafetyMetadata = z.object({
  mockOnly: z.literal(true),
  externalCallMade: z.literal(false),
  policyChecks: z.array(z.string()).default([]),
  reviewRequired: z.literal(true),
  writebackAllowed: z.literal(false),
});
export type AiSafetyMetadata = z.infer<typeof AiSafetyMetadata>;

export const GenerateDraftRequest = z.object({
  tenantId: z.string().min(1),
  actorId: z.string().min(1),
  session: SupportSession,
  ticketReferences: z.array(TicketReference).default([]),
  contextPackets: z.array(AIContextPacket).default([]),
  operatorInstructions: z.string().max(2000).optional(),
  modelSelection: ModelSelection.optional(),
});
export type GenerateDraftRequest = z.infer<typeof GenerateDraftRequest>;

export const GenerateDraftResponse = z.object({
  draft: z.string().min(1),
  provider: AiProviderId,
  model: z.string().min(1).max(128),
  prompt: PromptTemplate,
  contextHash: ContextHash,
  usage: ModelUsageMetadata,
  safety: AiSafetyMetadata,
  generatedAt: z.string().datetime(),
});
export type GenerateDraftResponse = z.infer<typeof GenerateDraftResponse>;

export interface AiProvider {
  readonly id: AiProviderId;
  generateDraft(request: GenerateDraftRequest): Promise<GenerateDraftResponse>;
}

export class ModelGateway {
  constructor(private readonly providers: readonly AiProvider[]) {}

  async generateDraft(
    input: GenerateDraftRequest
  ): Promise<GenerateDraftResponse> {
    const request = GenerateDraftRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const provider = this.providers.find((p) => p.id === selection.provider);
    if (!provider) {
      throw new Error(`AI provider ${selection.provider} is not configured`);
    }
    return provider.generateDraft({
      ...request,
      modelSelection: selection,
    });
  }
}

export class MockAiProvider implements AiProvider {
  readonly id = 'mock' as const;

  private readonly prompt: PromptTemplate = {
    id: 'support-note-draft',
    version: 'mock-v1',
    purpose: 'Draft a reviewable internal support note from session context.',
  };

  async generateDraft(
    input: GenerateDraftRequest
  ): Promise<GenerateDraftResponse> {
    const request = GenerateDraftRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const contextHash = computeContextHash({
      session: request.session,
      ticketReferences: request.ticketReferences,
      contextPackets: request.contextPackets,
      operatorInstructions: request.operatorInstructions ?? '',
      prompt: this.prompt,
    });

    return GenerateDraftResponse.parse({
      draft: buildMockDraft(
        request.session,
        request.ticketReferences,
        request.contextPackets,
        request.operatorInstructions
      ),
      provider: this.id,
      model: selection.model,
      prompt: this.prompt,
      contextHash,
      usage: {
        inputTokens: undefined,
        outputTokens: undefined,
        totalTokens: undefined,
        costEstimateUsd: undefined,
        latencyMs: 0,
        placeholder: true,
      },
      safety: {
        mockOnly: true,
        externalCallMade: false,
        policyChecks: ['mock_provider_only', 'review_required', 'writeback_disabled'],
        reviewRequired: true,
        writebackAllowed: false,
      },
      generatedAt: new Date().toISOString(),
    });
  }
}

export function createDefaultModelGateway(): ModelGateway {
  return new ModelGateway([new MockAiProvider()]);
}

export function computeContextHash(value: unknown): ContextHash {
  return createHash('sha256')
    .update(stableStringify(value))
    .digest('hex') as ContextHash;
}

function buildMockDraft(
  session: SupportSessionShape,
  tickets: TicketReferenceShape[],
  packets: AIContextPacketShape[],
  operatorInstructions?: string
): string {
  const primaryTicket = tickets[0];
  const packetSummary = packets
    .map((packet) => `${packet.provenance}:${Object.keys(packet.payload).sort().join(',')}`)
    .sort()
    .join('; ');
  const instructionLine = operatorInstructions?.trim()
    ? `Operator instruction considered: ${operatorInstructions.trim()}`
    : 'No operator-specific instruction was provided.';

  return [
    '[MOCK AI DRAFT - review required before any writeback]',
    `Session: ${session.title}`,
    primaryTicket
      ? `Ticket: ${primaryTicket.externalTicketId} - ${primaryTicket.subject} (${primaryTicket.status}, ${primaryTicket.priority})`
      : 'Ticket: no linked ticket context was available.',
    `Context used: ${packetSummary || 'no AI context packets were available.'}`,
    instructionLine,
    'Suggested internal note: Reviewed the available mock SupportPlane context, captured the customer issue, and prepared next-step guidance for a human operator to verify before any ticket update.',
  ].join('\n');
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}
