import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  AIContextPacket,
  SupportSession,
  TicketReference,
  GreetingSuggestionTone,
  GreetingSuggestionRequest,
  GreetingSuggestionResponse,
  ChatRole,
  type AIContextPacket as AIContextPacketShape,
  type SupportSession as SupportSessionShape,
  type TicketReference as TicketReferenceShape,
  type GreetingSuggestionRequest as GreetingSuggestionRequestShape,
  type GreetingSuggestionResponse as GreetingSuggestionResponseShape,
  type ChatRole as ChatRoleShape,
} from '@supportplane/contracts';

export { GreetingSuggestionTone, GreetingSuggestionRequest, GreetingSuggestionResponse };
export type { GreetingSuggestionRequestShape, GreetingSuggestionResponseShape };

export const AI_VERSION = '0.1.0';

export const AiProviderId = z.enum(['mock', 'ollama', 'lmstudio']);
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
  placeholder: z.boolean().default(true),
  providerMode: z.enum(['mock', 'local']).default('mock'),
  runtime: z.enum(['mock', 'ollama', 'lmstudio']).default('mock'),
  runtimeBaseUrlRedacted: z.string().optional(),
  fallbackUsed: z.boolean().default(false),
  noCloudCall: z.literal(true).default(true),
});
export type ModelUsageMetadata = z.infer<typeof ModelUsageMetadata>;

export const AiSafetyMetadata = z.object({
  mockOnly: z.boolean(),
  externalCallMade: z.literal(false),
  cloudCallMade: z.literal(false).default(false),
  localProviderCallMade: z.boolean().default(false),
  fallbackUsed: z.boolean().default(false),
  policyChecks: z.array(z.string()).default([]),
  reviewRequired: z.literal(true),
  writebackAllowed: z.literal(false),
  autonomousSend: z.literal(false).default(false),
  redactionApplied: z.boolean().default(true),
  runtime: z.enum(['mock', 'ollama', 'lmstudio']).default('mock'),
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

export const GenerateSummaryRequest = z.object({
  tenantId: z.string().min(1),
  actorId: z.string().min(1),
  session: SupportSession,
  ticketReferences: z.array(TicketReference).default([]),
  contextPackets: z.array(AIContextPacket).default([]),
  modelSelection: ModelSelection.optional(),
});
export type GenerateSummaryRequest = z.infer<typeof GenerateSummaryRequest>;

export const GenerateSummaryResponse = z.object({
  summary: z.string().min(1),
  keyPoints: z.array(z.string()).default([]),
  sentiment: z.string().optional(),
  provider: AiProviderId,
  model: z.string().min(1).max(128),
  prompt: PromptTemplate,
  contextHash: ContextHash,
  usage: ModelUsageMetadata,
  safety: AiSafetyMetadata,
  generatedAt: z.string().datetime(),
});
export type GenerateSummaryResponse = z.infer<typeof GenerateSummaryResponse>;

export const GenerateChatRequest = z.object({
  tenantId: z.string().min(1),
  actorId: z.string().min(1),
  messages: z.array(
    z.object({
      role: ChatRole,
      content: z.string(),
    }),
  ),
  modelSelection: ModelSelection.optional(),
});
export type GenerateChatRequest = z.infer<typeof GenerateChatRequest>;

export const GenerateChatResponse = z.object({
  content: z.string().min(1),
  provider: AiProviderId,
  model: z.string().min(1).max(128),
  usage: ModelUsageMetadata,
  safety: AiSafetyMetadata,
  generatedAt: z.string().datetime(),
});
export type GenerateChatResponse = z.infer<typeof GenerateChatResponse>;

export interface AiProvider {
  readonly id: AiProviderId;
  generateDraft(request: GenerateDraftRequest): Promise<GenerateDraftResponse>;
  generateGreeting(request: GreetingSuggestionRequest): Promise<GreetingSuggestionResponse>;
  generateSummary(request: GenerateSummaryRequest): Promise<GenerateSummaryResponse>;
  generateChat(request: GenerateChatRequest): Promise<GenerateChatResponse>;
}

export class ModelGateway {
  constructor(private readonly providers: readonly AiProvider[]) {}

  async generateDraft(input: GenerateDraftRequest): Promise<GenerateDraftResponse> {
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

  async generateGreeting(input: GreetingSuggestionRequest): Promise<GreetingSuggestionResponse> {
    const request = GreetingSuggestionRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const provider = this.providers.find((p) => p.id === selection.provider);
    if (!provider) {
      throw new Error(`AI provider ${selection.provider} is not configured`);
    }
    return provider.generateGreeting({
      ...request,
      modelSelection: selection,
    });
  }

  async generateSummary(input: GenerateSummaryRequest): Promise<GenerateSummaryResponse> {
    const request = GenerateSummaryRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const provider = this.providers.find((p) => p.id === selection.provider);
    if (!provider) {
      throw new Error(`AI provider ${selection.provider} is not configured`);
    }
    return provider.generateSummary({
      ...request,
      modelSelection: selection,
    });
  }

  async generateChat(input: GenerateChatRequest): Promise<GenerateChatResponse> {
    const request = GenerateChatRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const provider = this.providers.find((p) => p.id === selection.provider);
    if (!provider) {
      throw new Error(`AI provider ${selection.provider} is not configured`);
    }
    return provider.generateChat({
      ...request,
      modelSelection: selection,
    });
  }
}

export class MockAiProvider implements AiProvider {
  readonly id = 'mock' as const;

  private readonly draftPrompt: PromptTemplate = {
    id: 'support-note-draft',
    version: 'mock-v1',
    purpose: 'Draft a reviewable internal support note from session context.',
  };

  private readonly greetingPrompt: PromptTemplate = {
    id: 'greeting-suggestion',
    version: 'mock-v1',
    purpose:
      'Suggest a safe, reviewable greeting for a support agent based on caller and ticket context.',
  };

  async generateDraft(input: GenerateDraftRequest): Promise<GenerateDraftResponse> {
    const request = GenerateDraftRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const contextHash = computeContextHash({
      session: request.session,
      ticketReferences: request.ticketReferences,
      contextPackets: request.contextPackets,
      operatorInstructions: request.operatorInstructions ?? '',
      prompt: this.draftPrompt,
    });

    return GenerateDraftResponse.parse({
      draft: buildMockDraft(
        request.session,
        request.ticketReferences,
        request.contextPackets,
        request.operatorInstructions,
      ),
      provider: this.id,
      model: selection.model,
      prompt: this.draftPrompt,
      contextHash,
      usage: {
        inputTokens: undefined,
        outputTokens: undefined,
        totalTokens: undefined,
        costEstimateUsd: undefined,
        latencyMs: 0,
        placeholder: true,
        providerMode: 'mock',
        runtime: 'mock',
        fallbackUsed: false,
        noCloudCall: true,
      },
      safety: {
        mockOnly: true,
        externalCallMade: false,
        cloudCallMade: false,
        localProviderCallMade: false,
        fallbackUsed: false,
        policyChecks: ['mock_provider_only', 'review_required', 'writeback_disabled'],
        reviewRequired: true,
        writebackAllowed: false,
        autonomousSend: false,
        redactionApplied: true,
        runtime: 'mock',
      },
      generatedAt: new Date().toISOString(),
    });
  }

  async generateGreeting(input: GreetingSuggestionRequest): Promise<GreetingSuggestionResponse> {
    const request = GreetingSuggestionRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const contextHash = computeContextHash({
      tenantId: request.tenantId,
      supportSessionId: request.supportSessionId,
      callEventId: request.callEventId,
      tone: request.tone,
      callerName: request.callerName,
      normalizedPhoneNumber: request.normalizedPhoneNumber,
      matchedTicketIds: request.matchedTicketIds,
      matchedCustomerName: request.matchedCustomerName,
      sessionTitle: request.sessionTitle,
      prompt: this.greetingPrompt,
    });

    const greetingText = buildMockGreeting(request);

    return GreetingSuggestionResponse.parse({
      suggestion: {
        id: randomUUID() as never,
        tenantId: request.tenantId,
        supportSessionId: request.supportSessionId,
        callEventId: request.callEventId,
        greetingText,
        tone: request.tone,
        contextSummary: {
          callerName: request.callerName,
          normalizedPhoneNumber: request.normalizedPhoneNumber,
          matchedTicketIds: request.matchedTicketIds,
          matchedCustomerName: request.matchedCustomerName,
          sessionTitle: request.sessionTitle,
        },
        metadata: {
          provider: this.id,
          model: selection.model,
          promptId: this.greetingPrompt.id,
          promptVersion: this.greetingPrompt.version,
          contextHash,
          mockDevOnly: true,
          reviewRequired: true,
          generatedAt: new Date().toISOString(),
        },
      },
      provider: this.id,
      model: selection.model,
      prompt: this.greetingPrompt,
      contextHash,
      usage: {
        inputTokens: undefined,
        outputTokens: undefined,
        totalTokens: undefined,
        costEstimateUsd: undefined,
        latencyMs: 0,
        placeholder: true,
        providerMode: 'mock',
        fallbackUsed: false,
        noCloudCall: true,
      },
      safety: {
        mockOnly: true,
        externalCallMade: false,
        cloudCallMade: false,
        localProviderCallMade: false,
        fallbackUsed: false,
        policyChecks: [
          'mock_provider_only',
          'review_required',
          'auto_send_disabled',
          'voice_disabled',
        ],
        reviewRequired: true,
        autoSend: false,
        voiceEnabled: false,
      },
      generatedAt: new Date().toISOString(),
    });
  }

  private readonly summaryPrompt: PromptTemplate = {
    id: 'ticket-summary',
    version: 'mock-v1',
    purpose: 'Generate a structured summary from ticket context.',
  };

  async generateSummary(input: GenerateSummaryRequest): Promise<GenerateSummaryResponse> {
    const request = GenerateSummaryRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const contextHash = computeContextHash({
      session: request.session,
      ticketReferences: request.ticketReferences,
      contextPackets: request.contextPackets,
      prompt: this.summaryPrompt,
    });
    const primaryTicket = request.ticketReferences[0];
    return GenerateSummaryResponse.parse({
      summary: `[MOCK AI SUMMARY] Session "${request.session.title}" ${primaryTicket ? `linked to ticket ${primaryTicket.externalTicketId} (${primaryTicket.subject})` : 'with no linked tickets'}.`,
      keyPoints: [
        'Mock key point: context reviewed deterministically',
        'Mock key point: no real AI model was called',
      ],
      sentiment: 'neutral',
      provider: this.id,
      model: selection.model,
      prompt: this.summaryPrompt,
      contextHash,
      usage: {
        latencyMs: 0,
        placeholder: true,
        providerMode: 'mock',
        runtime: 'mock',
        fallbackUsed: false,
        noCloudCall: true,
      },
      safety: {
        mockOnly: true,
        externalCallMade: false,
        cloudCallMade: false,
        localProviderCallMade: false,
        fallbackUsed: false,
        policyChecks: ['mock_provider_only', 'review_required', 'writeback_disabled'],
        reviewRequired: true,
        writebackAllowed: false,
        autonomousSend: false,
        redactionApplied: true,
        runtime: 'mock',
      },
      generatedAt: new Date().toISOString(),
    });
  }

  async generateChat(input: GenerateChatRequest): Promise<GenerateChatResponse> {
    const request = GenerateChatRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const lastMessage = request.messages[request.messages.length - 1]?.content ?? '';
    return GenerateChatResponse.parse({
      content: `[MOCK AI CHAT RESPONSE]\nYou said: "${lastMessage}"\n\nThis is a deterministic mock response. No real AI model was called. No cloud API was used.`,
      provider: this.id,
      model: selection.model,
      usage: {
        latencyMs: 0,
        placeholder: true,
        providerMode: 'mock',
        runtime: 'mock',
        fallbackUsed: false,
        noCloudCall: true,
      },
      safety: {
        mockOnly: true,
        externalCallMade: false,
        cloudCallMade: false,
        localProviderCallMade: false,
        fallbackUsed: false,
        policyChecks: ['mock_provider_only', 'review_required'],
        reviewRequired: true,
        writebackAllowed: false,
        autonomousSend: false,
        redactionApplied: true,
        runtime: 'mock',
      },
      generatedAt: new Date().toISOString(),
    });
  }
}

export interface OllamaClient {
  generate(input: {
    baseUrl: string;
    model: string;
    prompt: string;
    timeoutMs: number;
  }): Promise<string>;
}

export interface OllamaAiProviderOptions {
  baseUrl: string;
  model: string;
  timeoutMs?: number;
  fallbackEnabled?: boolean;
  client?: OllamaClient;
}

export class OllamaAiProvider implements AiProvider {
  readonly id = 'ollama' as const;
  private readonly prompt: PromptTemplate = {
    id: 'support-note-draft',
    version: 'ollama-local-v1',
    purpose: 'Draft a reviewable internal support note from redacted local SupportPlane context.',
  };
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fallbackEnabled: boolean;
  private readonly client: OllamaClient;

  constructor(options: OllamaAiProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.model = options.model;
    this.timeoutMs = options.timeoutMs ?? 15000;
    this.fallbackEnabled = options.fallbackEnabled ?? true;
    this.client = options.client ?? new FetchOllamaClient();
  }

  async generateDraft(input: GenerateDraftRequest): Promise<GenerateDraftResponse> {
    const request = GenerateDraftRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const selectedModel = selection.model === 'mock-support-note-v1' ? this.model : selection.model;
    const redactedContext = redactAiContext({
      session: request.session,
      ticketReferences: request.ticketReferences,
      contextPackets: request.contextPackets,
      operatorInstructions: request.operatorInstructions ?? '',
    });
    const contextHash = computeContextHash({ ...redactedContext, prompt: this.prompt });
    const requestedAt = new Date().toISOString();
    const start = Date.now();

    try {
      const draft = await this.client.generate({
        baseUrl: this.baseUrl,
        model: selectedModel,
        prompt: buildOllamaPrompt(redactedContext),
        timeoutMs: this.timeoutMs,
      });
      return GenerateDraftResponse.parse({
        draft: labelOllamaDraft(draft, false),
        provider: this.id,
        model: selectedModel,
        prompt: this.prompt,
        contextHash,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: false,
          providerMode: 'local',
          runtime: 'ollama',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: false,
          noCloudCall: true,
        },
        safety: {
          mockOnly: false,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: true,
          fallbackUsed: false,
          policyChecks: [
            'ollama_local_provider',
            'redaction_before_provider_call',
            'review_required',
            'writeback_disabled',
          ],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'ollama',
        },
        generatedAt: requestedAt,
      });
    } catch (error) {
      if (!this.fallbackEnabled) {
        throw error;
      }
      return GenerateDraftResponse.parse({
        draft: labelOllamaDraft(
          buildMockDraft(
            request.session,
            request.ticketReferences,
            request.contextPackets,
            request.operatorInstructions,
          ),
          true,
        ),
        provider: this.id,
        model: selectedModel,
        prompt: this.prompt,
        contextHash,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: true,
          providerMode: 'local',
          runtime: 'ollama',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: true,
          noCloudCall: true,
        },
        safety: {
          mockOnly: true,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: false,
          fallbackUsed: true,
          policyChecks: [
            'ollama_unavailable_deterministic_fallback',
            'redaction_before_provider_call',
            'review_required',
            'writeback_disabled',
          ],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'ollama',
        },
        generatedAt: requestedAt,
      });
    }
  }

  async generateGreeting(input: GreetingSuggestionRequest): Promise<GreetingSuggestionResponse> {
    return new MockAiProvider().generateGreeting({
      ...input,
      modelSelection: { provider: 'mock', model: 'mock-greeting-v1' },
    });
  }

  private readonly summaryPrompt: PromptTemplate = {
    id: 'ticket-summary',
    version: 'ollama-local-v1',
    purpose: 'Generate a structured summary from redacted local SupportPlane ticket context.',
  };

  async generateSummary(input: GenerateSummaryRequest): Promise<GenerateSummaryResponse> {
    const request = GenerateSummaryRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const selectedModel = selection.model === 'mock-support-note-v1' ? this.model : selection.model;
    const redactedContext = redactAiContext({
      session: request.session,
      ticketReferences: request.ticketReferences,
      contextPackets: request.contextPackets,
    });
    const contextHash = computeContextHash({ ...redactedContext, prompt: this.summaryPrompt });
    const requestedAt = new Date().toISOString();
    const start = Date.now();

    try {
      const summary = await this.client.generate({
        baseUrl: this.baseUrl,
        model: selectedModel,
        prompt: buildSummaryPrompt(redactedContext),
        timeoutMs: this.timeoutMs,
      });
      const lines = summary.split('\n').filter((l) => l.trim());
      return GenerateSummaryResponse.parse({
        summary: labelOllamaSummary(summary, false),
        keyPoints: lines.slice(0, 3),
        sentiment: 'neutral',
        provider: this.id,
        model: selectedModel,
        prompt: this.summaryPrompt,
        contextHash,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: false,
          providerMode: 'local',
          runtime: 'ollama',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: false,
          noCloudCall: true,
        },
        safety: {
          mockOnly: false,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: true,
          fallbackUsed: false,
          policyChecks: [
            'ollama_local_provider',
            'redaction_before_provider_call',
            'review_required',
          ],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'ollama',
        },
        generatedAt: requestedAt,
      });
    } catch (error) {
      if (!this.fallbackEnabled) {
        throw error;
      }
      return GenerateSummaryResponse.parse({
        summary: labelOllamaSummary(
          `[OLLAMA FALLBACK] Ticket summary unavailable. Fallback summary for session "${request.session.title}".`,
          true,
        ),
        keyPoints: ['Ollama was unavailable', 'Deterministic fallback used'],
        sentiment: 'unknown',
        provider: this.id,
        model: selectedModel,
        prompt: this.summaryPrompt,
        contextHash,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: true,
          providerMode: 'local',
          runtime: 'ollama',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: true,
          noCloudCall: true,
        },
        safety: {
          mockOnly: true,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: false,
          fallbackUsed: true,
          policyChecks: [
            'ollama_unavailable_deterministic_fallback',
            'redaction_before_provider_call',
            'review_required',
          ],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'ollama',
        },
        generatedAt: requestedAt,
      });
    }
  }

  async generateChat(input: GenerateChatRequest): Promise<GenerateChatResponse> {
    const request = GenerateChatRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const selectedModel = selection.model === 'mock-support-note-v1' ? this.model : selection.model;
    const lastMessage = request.messages[request.messages.length - 1]?.content ?? '';
    const start = Date.now();
    const requestedAt = new Date().toISOString();

    try {
      const content = await this.client.generate({
        baseUrl: this.baseUrl,
        model: selectedModel,
        prompt: buildChatPrompt(request.messages),
        timeoutMs: this.timeoutMs,
      });
      return GenerateChatResponse.parse({
        content: labelOllamaChat(content, false),
        provider: this.id,
        model: selectedModel,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: false,
          providerMode: 'local',
          runtime: 'ollama',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: false,
          noCloudCall: true,
        },
        safety: {
          mockOnly: false,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: true,
          fallbackUsed: false,
          policyChecks: ['ollama_local_provider', 'review_required'],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'ollama',
        },
        generatedAt: requestedAt,
      });
    } catch (error) {
      if (!this.fallbackEnabled) {
        throw error;
      }
      return GenerateChatResponse.parse({
        content: labelOllamaChat(
          `[OLLAMA FALLBACK] Local Ollama is unavailable.\n\nYour message: "${lastMessage}"`,
          true,
        ),
        provider: this.id,
        model: selectedModel,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: true,
          providerMode: 'local',
          runtime: 'ollama',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: true,
          noCloudCall: true,
        },
        safety: {
          mockOnly: true,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: false,
          fallbackUsed: true,
          policyChecks: ['ollama_unavailable_deterministic_fallback', 'review_required'],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'ollama',
        },
        generatedAt: requestedAt,
      });
    }
  }
}

class FetchOllamaClient implements OllamaClient {
  async generate(input: {
    baseUrl: string;
    model: string;
    prompt: string;
    timeoutMs: number;
  }): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
    try {
      const response = await fetch(`${input.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: input.model,
          prompt: input.prompt,
          stream: false,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`);
      }
      const data = (await response.json()) as { response?: string };
      if (!data.response?.trim()) {
        throw new Error('Ollama returned an empty response');
      }
      return data.response.trim();
    } finally {
      clearTimeout(timeout);
    }
  }
}

export interface LmStudioClient {
  generate(input: {
    baseUrl: string;
    model: string;
    prompt: string;
    timeoutMs: number;
  }): Promise<string>;
}

export interface LmStudioAiProviderOptions {
  baseUrl: string;
  model: string;
  timeoutMs?: number;
  fallbackEnabled?: boolean;
  client?: LmStudioClient;
}

class FetchLmStudioClient implements LmStudioClient {
  async generate(input: {
    baseUrl: string;
    model: string;
    prompt: string;
    timeoutMs: number;
  }): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
    try {
      const response = await fetch(`${input.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: input.model,
          messages: [
            {
              role: 'system',
              content: 'You are SupportPlane local AI. Draft concise internal support notes only.',
            },
            { role: 'user', content: input.prompt },
          ],
          stream: false,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`LM Studio HTTP ${response.status}`);
      }
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('LM Studio returned an empty response');
      }
      return content;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class LmStudioAiProvider implements AiProvider {
  readonly id = 'lmstudio' as const;
  private readonly prompt: PromptTemplate = {
    id: 'support-note-draft',
    version: 'lmstudio-local-v1',
    purpose:
      'Draft a reviewable internal support note from redacted local SupportPlane context via LM Studio.',
  };
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fallbackEnabled: boolean;
  private readonly client: LmStudioClient;

  constructor(options: LmStudioAiProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.model = options.model;
    this.timeoutMs = options.timeoutMs ?? 15000;
    this.fallbackEnabled = options.fallbackEnabled ?? true;
    this.client = options.client ?? new FetchLmStudioClient();
  }

  async generateDraft(input: GenerateDraftRequest): Promise<GenerateDraftResponse> {
    const request = GenerateDraftRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const selectedModel = selection.model === 'mock-support-note-v1' ? this.model : selection.model;
    const redactedContext = redactAiContext({
      session: request.session,
      ticketReferences: request.ticketReferences,
      contextPackets: request.contextPackets,
      operatorInstructions: request.operatorInstructions ?? '',
    });
    const contextHash = computeContextHash({ ...redactedContext, prompt: this.prompt });
    const requestedAt = new Date().toISOString();
    const start = Date.now();

    try {
      const draft = await this.client.generate({
        baseUrl: this.baseUrl,
        model: selectedModel,
        prompt: buildOllamaPrompt(redactedContext),
        timeoutMs: this.timeoutMs,
      });
      return GenerateDraftResponse.parse({
        draft: labelLmStudioDraft(draft, false),
        provider: this.id,
        model: selectedModel,
        prompt: this.prompt,
        contextHash,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: false,
          providerMode: 'local',
          runtime: 'lmstudio',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: false,
          noCloudCall: true,
        },
        safety: {
          mockOnly: false,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: true,
          fallbackUsed: false,
          policyChecks: [
            'lmstudio_local_provider',
            'redaction_before_provider_call',
            'review_required',
            'writeback_disabled',
          ],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'lmstudio',
        },
        generatedAt: requestedAt,
      });
    } catch (error) {
      if (!this.fallbackEnabled) {
        throw error;
      }
      return GenerateDraftResponse.parse({
        draft: labelLmStudioDraft(
          buildMockDraft(
            request.session,
            request.ticketReferences,
            request.contextPackets,
            request.operatorInstructions,
          ),
          true,
        ),
        provider: this.id,
        model: selectedModel,
        prompt: this.prompt,
        contextHash,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: true,
          providerMode: 'local',
          runtime: 'lmstudio',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: true,
          noCloudCall: true,
        },
        safety: {
          mockOnly: true,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: false,
          fallbackUsed: true,
          policyChecks: [
            'lmstudio_unavailable_deterministic_fallback',
            'redaction_before_provider_call',
            'review_required',
            'writeback_disabled',
          ],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'lmstudio',
        },
        generatedAt: requestedAt,
      });
    }
  }

  async generateGreeting(input: GreetingSuggestionRequest): Promise<GreetingSuggestionResponse> {
    return new MockAiProvider().generateGreeting({
      ...input,
      modelSelection: { provider: 'mock', model: 'mock-greeting-v1' },
    });
  }

  private readonly summaryPrompt: PromptTemplate = {
    id: 'ticket-summary',
    version: 'lmstudio-local-v1',
    purpose:
      'Generate a structured summary from redacted local SupportPlane ticket context via LM Studio.',
  };

  async generateSummary(input: GenerateSummaryRequest): Promise<GenerateSummaryResponse> {
    const request = GenerateSummaryRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const selectedModel = selection.model === 'mock-support-note-v1' ? this.model : selection.model;
    const redactedContext = redactAiContext({
      session: request.session,
      ticketReferences: request.ticketReferences,
      contextPackets: request.contextPackets,
    });
    const contextHash = computeContextHash({ ...redactedContext, prompt: this.summaryPrompt });
    const requestedAt = new Date().toISOString();
    const start = Date.now();

    try {
      const summary = await this.client.generate({
        baseUrl: this.baseUrl,
        model: selectedModel,
        prompt: buildSummaryPrompt(redactedContext),
        timeoutMs: this.timeoutMs,
      });
      const lines = summary.split('\n').filter((l) => l.trim());
      return GenerateSummaryResponse.parse({
        summary: labelLmStudioSummary(summary, false),
        keyPoints: lines.slice(0, 3),
        sentiment: 'neutral',
        provider: this.id,
        model: selectedModel,
        prompt: this.summaryPrompt,
        contextHash,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: false,
          providerMode: 'local',
          runtime: 'lmstudio',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: false,
          noCloudCall: true,
        },
        safety: {
          mockOnly: false,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: true,
          fallbackUsed: false,
          policyChecks: [
            'lmstudio_local_provider',
            'redaction_before_provider_call',
            'review_required',
          ],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'lmstudio',
        },
        generatedAt: requestedAt,
      });
    } catch (error) {
      if (!this.fallbackEnabled) {
        throw error;
      }
      return GenerateSummaryResponse.parse({
        summary: labelLmStudioSummary(
          `[LM STUDIO FALLBACK] Ticket summary unavailable. Fallback summary for session "${request.session.title}".`,
          true,
        ),
        keyPoints: ['LM Studio was unavailable', 'Deterministic fallback used'],
        sentiment: 'unknown',
        provider: this.id,
        model: selectedModel,
        prompt: this.summaryPrompt,
        contextHash,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: true,
          providerMode: 'local',
          runtime: 'lmstudio',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: true,
          noCloudCall: true,
        },
        safety: {
          mockOnly: true,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: false,
          fallbackUsed: true,
          policyChecks: [
            'lmstudio_unavailable_deterministic_fallback',
            'redaction_before_provider_call',
            'review_required',
          ],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'lmstudio',
        },
        generatedAt: requestedAt,
      });
    }
  }

  async generateChat(input: GenerateChatRequest): Promise<GenerateChatResponse> {
    const request = GenerateChatRequest.parse(input);
    const selection = ModelSelection.parse(request.modelSelection ?? {});
    const selectedModel = selection.model === 'mock-support-note-v1' ? this.model : selection.model;
    const lastMessage = request.messages[request.messages.length - 1]?.content ?? '';
    const start = Date.now();
    const requestedAt = new Date().toISOString();

    try {
      const content = await this.client.generate({
        baseUrl: this.baseUrl,
        model: selectedModel,
        prompt: buildChatPrompt(request.messages),
        timeoutMs: this.timeoutMs,
      });
      return GenerateChatResponse.parse({
        content: labelLmStudioChat(content, false),
        provider: this.id,
        model: selectedModel,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: false,
          providerMode: 'local',
          runtime: 'lmstudio',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: false,
          noCloudCall: true,
        },
        safety: {
          mockOnly: false,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: true,
          fallbackUsed: false,
          policyChecks: ['lmstudio_local_provider', 'review_required'],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'lmstudio',
        },
        generatedAt: requestedAt,
      });
    } catch (error) {
      if (!this.fallbackEnabled) {
        throw error;
      }
      return GenerateChatResponse.parse({
        content: labelLmStudioChat(
          `[LM STUDIO FALLBACK] Local LM Studio is unavailable.\n\nYour message: "${lastMessage}"`,
          true,
        ),
        provider: this.id,
        model: selectedModel,
        usage: {
          latencyMs: Date.now() - start,
          placeholder: true,
          providerMode: 'local',
          runtime: 'lmstudio',
          runtimeBaseUrlRedacted: redactBaseUrl(this.baseUrl),
          fallbackUsed: true,
          noCloudCall: true,
        },
        safety: {
          mockOnly: true,
          externalCallMade: false,
          cloudCallMade: false,
          localProviderCallMade: false,
          fallbackUsed: true,
          policyChecks: ['lmstudio_unavailable_deterministic_fallback', 'review_required'],
          reviewRequired: true,
          writebackAllowed: false,
          autonomousSend: false,
          redactionApplied: true,
          runtime: 'lmstudio',
        },
        generatedAt: requestedAt,
      });
    }
  }
}

import {
  registerAiProvider,
  getRegisteredAiProviderIds,
  getAiProvider,
  clearAiProviderRegistry,
} from './registry.js';

export {
  registerAiProvider,
  getAiProvider,
  getAiProviderRegistration,
  listAiProviders,
  clearAiProviderRegistry,
  getRegisteredAiProviderIds,
} from './registry.js';
export { getProviderReadiness } from './readiness.js';
export type { AiProviderRegistration, AiProviderSummary } from './registry.js';

function populateDefaultAiProviders(): void {
  clearAiProviderRegistry();
  registerAiProvider({
    id: 'mock',
    provider: new MockAiProvider(),
    metadata: { runtime: 'mock', providerMode: 'mock', noCloudCall: true, fallbackEnabled: false },
  });

  const providerEnv: string =
    process.env['SUPPORTPLANE_AI_PROVIDER'] ??
    (process.env['OLLAMA_ENABLED'] === 'true' ? 'ollama' : 'mock');
  const localRuntime: string = process.env['SUPPORTPLANE_AI_LOCAL_RUNTIME'] ?? providerEnv;

  if (localRuntime === 'ollama' || providerEnv === 'ollama') {
    const baseUrl = process.env['OLLAMA_BASE_URL'];
    const model = process.env['OLLAMA_MODEL'] ?? 'llama3.1:8b';
    if (baseUrl) {
      registerAiProvider({
        id: 'ollama',
        provider: new OllamaAiProvider({
          baseUrl,
          model,
          timeoutMs: Number(process.env['OLLAMA_TIMEOUT_MS'] ?? '15000'),
          fallbackEnabled: process.env['OLLAMA_FALLBACK_ENABLED'] !== 'false',
        }),
        metadata: {
          runtime: 'ollama',
          providerMode: 'local',
          noCloudCall: true,
          fallbackEnabled: process.env['OLLAMA_FALLBACK_ENABLED'] !== 'false',
        },
      });
    }
  }

  if (localRuntime === 'lmstudio' || providerEnv === 'lmstudio') {
    const baseUrl = process.env['LMSTUDIO_BASE_URL'];
    const model = process.env['LMSTUDIO_MODEL'] ?? 'local-model';
    if (baseUrl) {
      registerAiProvider({
        id: 'lmstudio',
        provider: new LmStudioAiProvider({
          baseUrl,
          model,
          timeoutMs: Number(process.env['LMSTUDIO_TIMEOUT_MS'] ?? '15000'),
          fallbackEnabled: process.env['LMSTUDIO_FALLBACK_ENABLED'] !== 'false',
        }),
        metadata: {
          runtime: 'lmstudio',
          providerMode: 'local',
          noCloudCall: true,
          fallbackEnabled: process.env['LMSTUDIO_FALLBACK_ENABLED'] !== 'false',
        },
      });
    }
  }
}

export function createDefaultModelGateway(): ModelGateway {
  populateDefaultAiProviders();
  const ids = getRegisteredAiProviderIds();
  if (ids.length === 0) {
    return new ModelGateway([new MockAiProvider()]);
  }
  const providers: AiProvider[] = ids.map((id) => getAiProvider(id)!).filter(Boolean);
  return new ModelGateway(providers);
}

/**
 * Create a ModelGateway from the AI provider registry (BL-126).
 * Falls back to a mock-only gateway if registry is empty.
 */
export function createModelGatewayFromRegistry(): ModelGateway {
  const ids = getRegisteredAiProviderIds();
  if (ids.length === 0) {
    populateDefaultAiProviders();
  }
  const finalIds = getRegisteredAiProviderIds();
  if (finalIds.length === 0) {
    return new ModelGateway([new MockAiProvider()]);
  }
  const providers: AiProvider[] = finalIds.map((id) => getAiProvider(id)!).filter(Boolean);
  return new ModelGateway(providers);
}

export function computeContextHash(value: unknown): ContextHash {
  return createHash('sha256').update(stableStringify(value)).digest('hex') as ContextHash;
}

function buildMockDraft(
  session: SupportSessionShape,
  tickets: TicketReferenceShape[],
  packets: AIContextPacketShape[],
  operatorInstructions?: string,
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

function buildOllamaPrompt(context: unknown): string {
  return [
    'You are SupportPlane local AI running through host-controlled Ollama.',
    'Draft a concise internal support note only. Do not claim the note was sent.',
    'Use only the redacted JSON context below.',
    stableStringify(context),
  ].join('\n\n');
}

function labelOllamaDraft(draft: string, fallbackUsed: boolean): string {
  const label = fallbackUsed
    ? '[OLLAMA LOCAL FALLBACK - deterministic mock/test fallback - review required before any writeback]'
    : '[OLLAMA LOCAL DRAFT - no cloud AI - review required before any writeback]';
  return `${label}\n${draft}`;
}

function buildSummaryPrompt(context: unknown): string {
  return [
    'You are SupportPlane local AI running through host-controlled Ollama.',
    'Generate a concise structured summary from the redacted ticket context below.',
    'Output format: first line is the summary, following lines are key points.',
    stableStringify(context),
  ].join('\n\n');
}

function labelOllamaSummary(summary: string, fallbackUsed: boolean): string {
  const label = fallbackUsed
    ? '[OLLAMA LOCAL FALLBACK SUMMARY - deterministic fallback - review required]'
    : '[OLLAMA LOCAL SUMMARY - no cloud AI - review required]';
  return `${label}\n${summary}`;
}

function buildChatPrompt(messages: Array<{ role: ChatRoleShape; content: string }>): string {
  const history = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  return [
    'You are SupportPlane local AI assistant running through host-controlled Ollama.',
    'Respond concisely and helpfully. Do not claim to have sent any messages or performed any actions.',
    'Conversation history:',
    history,
  ].join('\n\n');
}

function labelOllamaChat(content: string, fallbackUsed: boolean): string {
  const label = fallbackUsed
    ? '[OLLAMA LOCAL FALLBACK CHAT - deterministic fallback - review required]'
    : '[OLLAMA LOCAL CHAT - no cloud AI - review required]';
  return `${label}\n${content}`;
}

function labelLmStudioDraft(draft: string, fallbackUsed: boolean): string {
  const label = fallbackUsed
    ? '[LM STUDIO LOCAL FALLBACK - deterministic mock/test fallback - review required before any writeback]'
    : '[LM STUDIO LOCAL DRAFT - no cloud AI - review required before any writeback]';
  return `${label}\n${draft}`;
}

function labelLmStudioSummary(summary: string, fallbackUsed: boolean): string {
  const label = fallbackUsed
    ? '[LM STUDIO LOCAL FALLBACK SUMMARY - deterministic fallback - review required]'
    : '[LM STUDIO LOCAL SUMMARY - no cloud AI - review required]';
  return `${label}\n${summary}`;
}

function labelLmStudioChat(content: string, fallbackUsed: boolean): string {
  const label = fallbackUsed
    ? '[LM STUDIO LOCAL FALLBACK CHAT - deterministic fallback - review required]'
    : '[LM STUDIO LOCAL CHAT - no cloud AI - review required]';
  return `${label}\n${content}`;
}

function redactBaseUrl(baseUrl: string): string {
  try {
    const u = new URL(baseUrl);
    return `${u.protocol}//${u.hostname}/...`;
  } catch {
    return '[REDACTED_URL]';
  }
}

function redactAiContext<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'string') {
      return value.replace(
        /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
        '[REDACTED_EMAIL]',
      ) as T;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactAiContext(item)) as T;
  }
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (/(token|secret|password|apikey|api_key|credential|bearer)/i.test(key)) {
      output[key] = '[REDACTED]';
    } else {
      output[key] = redactAiContext(child);
    }
  }
  return output as T;
}

function buildMockGreeting(request: GreetingSuggestionRequestShape): string {
  const customer = request.matchedCustomerName ?? request.callerName ?? 'the caller';
  const tone = request.tone;

  if (tone === 'friendly') {
    return `Hi ${customer}! This is SupportPlane. I see you're calling in — thanks for reaching out. I'm here to help with whatever you need today.`;
  }

  if (tone === 'concise') {
    return `Good day, ${customer}. SupportPlane here. How can I assist?`;
  }

  // professional (default)
  const ticketHint =
    request.matchedTicketIds.length > 0
      ? ` I can see we have ${request.matchedTicketIds.length} open ticket(s) on file.`
      : '';

  return `Good day, ${customer}. Thank you for calling SupportPlane.${ticketHint} My name is the assigned support agent, and I'll be assisting you today. How may I help?`;
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
