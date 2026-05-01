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
  private readonly prisma = createPrismaClient();
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

      const modelSelection = dto.modelSelection
        ? ModelSelection.parse(dto.modelSelection)
        : undefined;

      const aiResponse: GenerateChatResponseShape =
        await this.modelGateway.generateChat({
          tenantId: identity.tenantId,
          actorId: identity.userId,
          messages: allMessages.map((m) => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
          modelSelection,
        });

      assistantMessage = await this.prisma.aiChatMessage.create({
        data: {
          id: randomUUID(),
          tenantId: identity.tenantId,
          chatSessionId,
          role: 'assistant',
          content: aiResponse.content,
          provider: aiResponse.provider,
          model: aiResponse.model,
          usageMetadata: {
            latencyMs: aiResponse.usage.latencyMs,
            providerMode: aiResponse.usage.providerMode,
            runtime: aiResponse.usage.runtime,
            fallbackUsed: aiResponse.usage.fallbackUsed,
            noCloudCall: aiResponse.usage.noCloudCall,
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
