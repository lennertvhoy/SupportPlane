import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for audit explorer');
  }
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export interface AuditExplorerQuery {
  tenantId: string;
  eventType?: string;
  actorId?: string;
  actorType?: string;
  resourceType?: string;
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface AuditExplorerResult {
  events: Array<{
    id: string;
    tenantId: string;
    sessionId?: string;
    eventType: string;
    actorType: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata: Record<string, unknown>;
    integrityHash?: string;
    createdAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class AuditExplorerService {
  private prismaClient?: PrismaClient;

  private get prisma(): PrismaClient {
    this.prismaClient ??= createPrismaClient();
    return this.prismaClient;
  }

  async queryAuditEvents(params: AuditExplorerQuery): Promise<AuditExplorerResult> {
    const where: Prisma.AuditEventWhereInput = {
      tenantId: params.tenantId,
      ...(params.eventType ? { eventType: params.eventType } : {}),
      ...(params.actorId ? { actorId: params.actorId } : {}),
      ...(params.actorType ? { actorType: params.actorType } : {}),
      ...(params.resourceType ? { resourceType: params.resourceType } : {}),
      ...(params.resourceId ? { resourceId: params.resourceId } : {}),
      ...(params.dateFrom || params.dateTo
        ? {
            createdAt: {
              ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
              ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
            },
          }
        : {}),
    };

    const limit = Math.min(params.limit ?? 50, 200);
    const offset = Math.max(params.offset ?? 0, 0);

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      events: events.map((event) => ({
        id: event.id,
        tenantId: event.tenantId,
        sessionId: event.sessionId ?? undefined,
        eventType: event.eventType,
        actorType: event.actorType,
        actorId: event.actorId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        metadata: event.metadata as Record<string, unknown>,
        integrityHash: event.integrityHash ?? undefined,
        createdAt: event.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
    };
  }
}
