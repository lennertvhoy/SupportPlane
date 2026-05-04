import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  ModelUsageLogEntry,
  ModelUsageQuery,
  ModelUsageSummary,
} from '@supportplane/contracts';

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for ModelUsageService');
  }
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function json<T extends Record<string, unknown>>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

@Injectable()
export class ModelUsageService {
  private prismaClient?: PrismaClient;
  private prismaInitError?: string;

  private get prisma(): PrismaClient | undefined {
    if (!process.env['DATABASE_URL']) return undefined;
    if (this.prismaInitError) return undefined;
    if (this.prismaClient) return this.prismaClient;
    try {
      this.prismaClient = createPrismaClient();
      return this.prismaClient;
    } catch (err) {
      this.prismaInitError = err instanceof Error ? err.message : String(err);
      return undefined;
    }
  }

  async logUsage(entry: ModelUsageLogEntry): Promise<void> {
    const p = this.prisma;
    if (!p) return; // Gracefully skip when DATABASE_URL is unavailable (e.g., in-memory test mode)
    await p.modelUsageLog.create({
      data: {
        id: entry.id,
        tenantId: entry.tenantId,
        actorId: entry.actorId,
        actorType: entry.actorType,
        sessionId: entry.sessionId ?? null,
        ticketId: entry.ticketId ?? null,
        feature: entry.feature,
        provider: entry.provider,
        model: entry.model,
        promptTokens: entry.promptTokens ?? null,
        completionTokens: entry.completionTokens ?? null,
        totalTokens: entry.totalTokens ?? null,
        latencyMs: entry.latencyMs,
        estimatedCostUsd: entry.estimatedCostUsd ?? null,
        status: entry.status,
        errorCode: entry.errorCode ?? null,
        metadata: json(entry.metadata),
        createdAt: new Date(entry.createdAt),
      },
    });
  }

  async list(query: ModelUsageQuery): Promise<{ logs: ModelUsageLogEntry[]; total: number }> {
    const p = this.prisma;
    if (!p) return { logs: [], total: 0 };
    const where: Prisma.ModelUsageLogWhereInput = {};
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.feature) where.feature = query.feature;
    if (query.provider) where.provider = query.provider;
    if (query.status) where.status = query.status;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [rows, total] = await Promise.all([
      p.modelUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      p.modelUsageLog.count({ where }),
    ]);

    const logs: ModelUsageLogEntry[] = rows.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      actorId: row.actorId,
      actorType: row.actorType,
      sessionId: row.sessionId ?? undefined,
      ticketId: row.ticketId ?? undefined,
      feature: row.feature as ModelUsageLogEntry['feature'],
      provider: row.provider,
      model: row.model,
      promptTokens: row.promptTokens ?? undefined,
      completionTokens: row.completionTokens ?? undefined,
      totalTokens: row.totalTokens ?? undefined,
      latencyMs: row.latencyMs,
      estimatedCostUsd: row.estimatedCostUsd ?? undefined,
      status: row.status as ModelUsageLogEntry['status'],
      errorCode: row.errorCode ?? undefined,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.createdAt.toISOString(),
    }));

    return { logs, total };
  }

  async summary(query: Omit<ModelUsageQuery, 'limit' | 'offset'>): Promise<ModelUsageSummary> {
    const p = this.prisma;
    if (!p) return { totalCalls: 0, byFeature: {}, byProvider: {}, byStatus: {} };
    const where: Prisma.ModelUsageLogWhereInput = {};
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.feature) where.feature = query.feature;
    if (query.provider) where.provider = query.provider;
    if (query.status) where.status = query.status;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const rows = await p.modelUsageLog.findMany({ where });

    const totalCalls = rows.length;
    let totalTokens = 0;
    let totalCostUsd = 0;
    let totalLatency = 0;

    const byFeature: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const row of rows) {
      if (row.totalTokens != null) totalTokens += row.totalTokens;
      if (row.estimatedCostUsd != null) totalCostUsd += row.estimatedCostUsd;
      totalLatency += row.latencyMs;

      byFeature[row.feature] = (byFeature[row.feature] ?? 0) + 1;
      byProvider[row.provider] = (byProvider[row.provider] ?? 0) + 1;
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    }

    return {
      totalCalls,
      totalTokens: totalTokens > 0 ? totalTokens : undefined,
      totalCostUsd: totalCostUsd > 0 ? totalCostUsd : undefined,
      avgLatencyMs: totalCalls > 0 ? Math.round(totalLatency / totalCalls) : undefined,
      byFeature,
      byProvider,
      byStatus,
    };
  }
}
