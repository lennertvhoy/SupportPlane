import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import {
  createDefaultModelGateway,
  ModelSelection,
  type GenerateChatResponse as GenerateChatResponseShape,
} from '@supportplane/ai';
import { AuditEventType, AuditActorType } from '@supportplane/contracts';
import type { DevIdentity } from '../auth/auth.types.js';
import { requirePermission } from '../auth/rbac.js';

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for AiChatService');
  }
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

@Injectable()
export class AiChatService {
  private prismaClient?: PrismaClient;
  private get prisma(): PrismaClient {
    if (!process.env['DATABASE_URL']) {
      throw new BadRequestException('Database unavailable: AI chat requires DATABASE_URL');
    }
    this.prismaClient ??= createPrismaClient();
    return this.prismaClient;
  }
  private readonly modelGateway = createDefaultModelGateway();

  async createChatSession(
    identity: DevIdentity,
    dto: { sessionId?: string; title?: string }
  ) {
    requirePermission(identity, 'ai:chat');
    const now = new Date();
    const chatSession = await this.prisma.aiChatSession.create({
      data: {
        id: randomUUID(),
        tenantId: identity.tenantId,
        sessionId: dto.sessionId ?? null,
        title: dto.title ?? 'AI Chat',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    });
    return this.mapChatSession(chatSession, []);
  }

  async getChatSession(identity: DevIdentity, id: string) {
    requirePermission(identity, 'ai:chat');
    const chatSession = await this.prisma.aiChatSession.findFirst({
      where: { id, tenantId: identity.tenantId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!chatSession) {
      throw new NotFoundException(`Chat session ${id} not found`);
    }
    return this.mapChatSession(
      chatSession,
      chatSession.messages.map((m) => this.mapChatMessage(m))
    );
  }

  async listChatSessions(identity: DevIdentity) {
    requirePermission(identity, 'ai:chat');
    const sessions = await this.prisma.aiChatSession.findMany({
      where: { tenantId: identity.tenantId },
      orderBy: { updatedAt: 'desc' },
    });
    return sessions.map((s) => this.mapChatSession(s, []));
  }

  private safeParseModelSelection(dtoModelSelection: unknown): import('@supportplane/ai').ModelSelection | undefined {
    if (!dtoModelSelection) return undefined;
    try {
      return ModelSelection.parse(dtoModelSelection);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid model selection';
      throw new BadRequestException(`Invalid model selection: ${message}`);
    }
  }

  private async getAiPolicy(tenantId: string): Promise<Record<string, unknown> | undefined> {
    const row = await this.prisma.tenantPolicy.findFirst({
      where: { tenantId, policyType: 'ai', scopeId: null },
    });
    if (!row) return undefined;
    return row.config as Record<string, unknown>;
  }

  private async getRetentionPolicy(tenantId: string): Promise<Record<string, unknown> | undefined> {
    const row = await this.prisma.tenantPolicy.findFirst({
      where: { tenantId, policyType: 'retention', scopeId: null },
    });
    if (!row) return undefined;
    return row.config as Record<string, unknown>;
  }

  private async checkAiPolicy(
    identity: DevIdentity,
    modelSelection?: import('@supportplane/ai').ModelSelection
  ): Promise<{ allowed: true } | { allowed: false; reason: string }> {
    const policy = await this.getAiPolicy(identity.tenantId);
    if (!policy) return { allowed: true };

    const allowChat = policy.allowChat !== false;
    if (!allowChat) {
      await this.logBlockedUsage(identity, modelSelection?.provider ?? 'mock', modelSelection?.model ?? 'mock-support-note-v1', 'chat_disabled_by_policy');
      return { allowed: false, reason: 'chat_disabled_by_policy' };
    }

    const allowedProviders = (policy.allowedProviders as string[]) ?? ['mock'];
    if (modelSelection?.provider && !allowedProviders.includes(modelSelection.provider)) {
      await this.logBlockedUsage(identity, modelSelection.provider, modelSelection.model ?? 'unknown', 'provider_not_allowed_by_policy');
      return { allowed: false, reason: 'provider_not_allowed_by_policy' };
    }

    return { allowed: true };
  }

  private computeRetentionDecision(retention: Record<string, unknown> | undefined): { storeOutput: boolean; metadataOnly: boolean } {
    if (!retention || !retention.enabled) return { storeOutput: true, metadataOnly: false };
    const mode = retention.outputRetentionMode as string | undefined;
    if (mode === 'none') return { storeOutput: false, metadataOnly: false };
    if (mode === 'metadata_only') return { storeOutput: true, metadataOnly: true };
    return { storeOutput: true, metadataOnly: false };
  }

  async sendMessage(
    identity: DevIdentity,
    chatSessionId: string,
    dto: {
      content: string;
      role?: string;
      modelSelection?: { provider?: string; model?: string };
    }
  ) {
    requirePermission(identity, 'ai:chat');
    const chatSession = await this.prisma.aiChatSession.findFirst({
      where: { id: chatSessionId, tenantId: identity.tenantId },
    });
    if (!chatSession) {
      throw new NotFoundException(`Chat session ${chatSessionId} not found`);
    }
    if (chatSession.status !== 'active') {
      throw new BadRequestException(`Chat session ${chatSessionId} is not active`);
    }

    const role = dto.role ?? 'user';
    if (!['user', 'assistant', 'system'].includes(role)) {
      throw new BadRequestException(`Invalid chat role: ${role}`);
    }

    const modelSelection = this.safeParseModelSelection(dto.modelSelection);

    // BL-027: Check tenant AI policy before calling model gateway
    const policyCheck = await this.checkAiPolicy(identity, modelSelection);
    if (!policyCheck.allowed) {
      throw new BadRequestException(`AI chat blocked: ${policyCheck.reason}`);
    }

    // Save user/system message
    await this.prisma.aiChatMessage.create({
      data: {
        id: randomUUID(),
        tenantId: identity.tenantId,
        chatSessionId,
        role,
        content: dto.content,
        createdAt: new Date(),
      },
    });

    // Only generate AI response for user messages
    let assistantMessage: {
      id: string;
      tenantId: string;
      chatSessionId: string;
      role: string;
      content: string;
      provider?: string;
      model?: string;
      usageMetadata?: Record<string, unknown>;
      createdAt: string;
    } | undefined;

    if (role === 'user') {
      const allMessages = await this.prisma.aiChatMessage.findMany({
        where: { chatSessionId },
        orderBy: { createdAt: 'asc' },
      });

      let aiResponse: GenerateChatResponseShape;
      try {
        aiResponse = await this.modelGateway.generateChat({
          tenantId: identity.tenantId,
          actorId: identity.userId,
          messages: allMessages.map((m) => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
          modelSelection,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Chat generation failed';
        if (message.includes('is not configured')) {
          throw new BadRequestException(`AI provider unavailable: ${message}`);
        }
        throw new BadRequestException(`Chat generation failed: ${message}`);
      }

      // BL-081: Apply retention policy to assistant output before storage
      const retention = await this.getRetentionPolicy(identity.tenantId);
      const retentionDecision = this.computeRetentionDecision(retention);
      let storedContent = aiResponse.content;
      if (!retentionDecision.storeOutput) {
        storedContent = '[REDACTED — output retention disabled]';
      } else if (retentionDecision.metadataOnly) {
        storedContent = '[REDACTED — metadata only retention]';
      }

      assistantMessage = await this.prisma.aiChatMessage.create({
        data: {
          id: randomUUID(),
          tenantId: identity.tenantId,
          chatSessionId,
          role: 'assistant',
          content: storedContent,
          provider: aiResponse.provider,
          model: aiResponse.model,
          usageMetadata: {
            latencyMs: aiResponse.usage.latencyMs,
            providerMode: aiResponse.usage.providerMode,
            runtime: aiResponse.usage.runtime,
            fallbackUsed: aiResponse.usage.fallbackUsed,
            noCloudCall: aiResponse.usage.noCloudCall,
            originalContentLength: aiResponse.content.length,
            retentionApplied: retentionDecision.metadataOnly || !retentionDecision.storeOutput,
          } as unknown as Prisma.InputJsonValue,
          createdAt: new Date(),
        },
      }).then((m) => this.mapChatMessage(m));

      await this.logModelUsage(
        identity,
        chatSessionId,
        'chat',
        aiResponse.provider,
        aiResponse.model,
        aiResponse.usage.latencyMs ?? 0,
        aiResponse.usage.fallbackUsed ? 'fallback_mock' : 'succeeded'
      );

      // Write audit event for chat message generation
      await this.prisma.auditEvent.create({
        data: {
          id: randomUUID(),
          tenantId: identity.tenantId,
          sessionId: chatSession.sessionId ?? chatSessionId,
          eventType: AuditEventType.enum.ai_chat_message_generated,
          actorType: AuditActorType.enum.ai,
          actorId: identity.userId,
          action: 'AI chat message generated',
          resourceType: 'ai_chat_session',
          resourceId: chatSessionId,
          metadata: {
            provider: aiResponse.provider,
            model: aiResponse.model,
            fallbackUsed: aiResponse.usage.fallbackUsed,
            noCloudCall: aiResponse.usage.noCloudCall,
            retentionMode: retention?.outputRetentionMode ?? 'full',
          } as unknown as Prisma.InputJsonValue,
          createdAt: new Date(),
        },
      });
    }

    await this.prisma.aiChatSession.update({
      where: { id: chatSessionId },
      data: { updatedAt: new Date() },
    });

    const updatedSession = await this.prisma.aiChatSession.findFirst({
      where: { id: chatSessionId, tenantId: identity.tenantId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!updatedSession) {
      throw new NotFoundException(`Chat session ${chatSessionId} not found`);
    }

    return {
      session: this.mapChatSession(
        updatedSession,
        updatedSession.messages.map((m) => this.mapChatMessage(m))
      ),
      assistantMessage,
    };
  }

  private async logModelUsage(
    identity: DevIdentity,
    chatSessionId: string,
    feature: 'chat' | 'summary' | 'draft' | 'greeting' | 'retrieval' | 'other',
    provider: string,
    model: string,
    latencyMs: number,
    status: 'succeeded' | 'failed' | 'blocked_by_policy' | 'fallback_mock'
  ): Promise<void> {
    try {
      await this.prisma.modelUsageLog.create({
        data: {
          id: randomUUID(),
          tenantId: identity.tenantId,
          actorId: identity.userId,
          actorType: 'user',
          sessionId: chatSessionId,
          feature,
          provider,
          model,
          latencyMs,
          status,
          metadata: { source: 'ai-chat.service' } as unknown as Prisma.InputJsonValue,
          createdAt: new Date(),
        },
      });
    } catch {
      // Best-effort logging; do not fail the request if logging fails
    }
  }

  private async logBlockedUsage(
    identity: DevIdentity,
    provider: string,
    model: string,
    errorCode: string
  ): Promise<void> {
    try {
      await this.prisma.modelUsageLog.create({
        data: {
          id: randomUUID(),
          tenantId: identity.tenantId,
          actorId: identity.userId,
          actorType: 'user',
          sessionId: undefined,
          feature: 'chat',
          provider,
          model,
          latencyMs: 0,
          status: 'blocked_by_policy',
          errorCode,
          metadata: { source: 'ai-chat.service', blockedByPolicy: true } as unknown as Prisma.InputJsonValue,
          createdAt: new Date(),
        },
      });
    } catch {
      // Best-effort logging
    }
  }

  private mapChatSession(
    session: {
      id: string;
      tenantId: string;
      sessionId: string | null;
      title: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    },
    messages: Array<{
      id: string;
      tenantId: string;
      chatSessionId: string;
      role: string;
      content: string;
      provider?: string;
      model?: string;
      usageMetadata?: Record<string, unknown>;
      createdAt: string;
    }>
  ) {
    return {
      id: session.id,
      tenantId: session.tenantId,
      sessionId: session.sessionId ?? undefined,
      title: session.title ?? undefined,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messages,
    };
  }

  private mapChatMessage(m: {
    id: string;
    tenantId: string;
    chatSessionId: string;
    role: string;
    content: string;
    provider: string | null;
    model: string | null;
    usageMetadata: unknown;
    createdAt: Date;
  }) {
    return {
      id: m.id,
      tenantId: m.tenantId,
      chatSessionId: m.chatSessionId,
      role: m.role,
      content: m.content,
      provider: m.provider ?? undefined,
      model: m.model ?? undefined,
      usageMetadata:
        typeof m.usageMetadata === 'object' && m.usageMetadata !== null
          ? (m.usageMetadata as Record<string, unknown>)
          : undefined,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
