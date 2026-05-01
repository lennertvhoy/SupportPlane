import { z } from 'zod';

export const ChatRole = z.enum(['user', 'assistant', 'system']);
export type ChatRole = z.infer<typeof ChatRole>;

export const AiChatMessage = z.object({
  id: z.string(),
  tenantId: z.string(),
  chatSessionId: z.string(),
  role: ChatRole,
  content: z.string(),
  provider: z.string().optional(),
  model: z.string().optional(),
  usageMetadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
});
export type AiChatMessage = z.infer<typeof AiChatMessage>;

export const AiChatSession = z.object({
  id: z.string(),
  tenantId: z.string(),
  sessionId: z.string().optional(),
  title: z.string().optional(),
  status: z.enum(['active', 'closed']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  messages: z.array(AiChatMessage).default([]),
});
export type AiChatSession = z.infer<typeof AiChatSession>;

export const CreateChatMessageRequest = z.object({
  content: z.string().min(1).max(8000),
  role: ChatRole.default('user'),
  modelSelection: z.object({
    provider: z.enum(['mock', 'ollama', 'lmstudio']).optional(),
    model: z.string().optional(),
  }).optional(),
});
export type CreateChatMessageRequest = z.infer<typeof CreateChatMessageRequest>;

export const CreateChatSessionRequest = z.object({
  sessionId: z.string().optional(),
  title: z.string().optional(),
});
export type CreateChatSessionRequest = z.infer<typeof CreateChatSessionRequest>;
