import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { redactSecrets } from '../evidence-bundle/redaction.js';
import type { CurrentIdentity } from '../auth/auth.types.js';

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for GDPR service');
  }
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function nowIso(): string {
  return new Date().toISOString();
}

@Injectable()
export class GdprService {
  private prismaClient?: PrismaClient;
  private get prisma(): PrismaClient {
    this.prismaClient ??= createPrismaClient();
    return this.prismaClient;
  }

  // ─── Export preview ───────────────────────────────────────────────────────
  async exportPreview(identity: CurrentIdentity, subjectType: string, subjectId: string) {
    const tenantId = identity.tenantId;
    const records = await this.gatherSubjectRecords(tenantId, subjectType, subjectId);
    const redacted = redactSecrets(records as Record<string, unknown>);

    return {
      subjectType,
      subjectId,
      dryRun: true,
      recordCounts: this.countRecords(records),
      records: redacted as Record<string, unknown[]>,
      redacted: true,
      generatedAt: nowIso(),
      warning: 'This is a preview. No data has been exported yet.',
    };
  }

  // ─── Delete preview (dry-run only) ────────────────────────────────────────
  async deletePreview(identity: CurrentIdentity, subjectType: string, subjectId: string) {
    const tenantId = identity.tenantId;
    const records = await this.gatherSubjectRecords(tenantId, subjectType, subjectId);
    const details: Array<{
      entity: string;
      id: string;
      action: 'delete' | 'anonymize' | 'retain';
      reason: string;
    }> = [];

    for (const [entity, items] of Object.entries(records)) {
      for (const item of items as Array<{ id: string }>) {
        if (entity === 'auditEvents') {
          details.push({
            entity,
            id: item.id,
            action: 'retain',
            reason:
              'Audit events are retained for compliance; only metadata anonymization would occur',
          });
        } else if (entity === 'callRecordings') {
          details.push({
            entity,
            id: item.id,
            action: 'anonymize',
            reason: 'Recording metadata retained; media references removed',
          });
        } else {
          details.push({
            entity,
            id: item.id,
            action: 'delete',
            reason: 'Subject-scoped record would be deleted in real execution',
          });
        }
      }
    }

    return {
      subjectType,
      subjectId,
      dryRun: true,
      wouldDeleteCounts: this.countByAction(details, 'delete'),
      wouldAnonymizeCounts: this.countByAction(details, 'anonymize'),
      details,
      generatedAt: nowIso(),
      warning:
        'DRY-RUN ONLY. No records were actually deleted or anonymized. Real deletion is not yet implemented.',
    };
  }

  // ─── Export (marks as completed) ──────────────────────────────────────────
  async export(identity: CurrentIdentity, subjectType: string, subjectId: string) {
    const tenantId = identity.tenantId;
    const records = await this.gatherSubjectRecords(tenantId, subjectType, subjectId);
    const redacted = redactSecrets(records as Record<string, unknown>);

    await this.prisma.dataSubjectRequest.create({
      data: {
        tenantId,
        requestType: 'export',
        subjectType,
        subjectId,
        status: 'completed',
        dryRun: true,
        resultCount: Object.values(records).flat().length,
        metadata: {
          generatedAt: nowIso(),
          redacted: true,
          requestedBy: identity.userId,
        } as Prisma.InputJsonValue,
        requestedBy: identity.userId,
      },
    });

    return {
      subjectType,
      subjectId,
      dryRun: true,
      recordCounts: this.countRecords(records),
      records: redacted as Record<string, unknown[]>,
      redacted: true,
      generatedAt: nowIso(),
      status: 'completed',
      warning:
        'Export marked as completed, but this remains a dry-run implementation. Real data export delivery is not yet implemented.',
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private async gatherSubjectRecords(
    tenantId: string,
    subjectType: string,
    subjectId: string,
  ): Promise<Record<string, unknown[]>> {
    const records: Record<string, unknown[]> = {
      sessions: [],
      tickets: [],
      auditEvents: [],
      modelUsageLogs: [],
      chatMessages: [],
      callEvents: [],
      screenObservations: [],
      internalNoteDrafts: [],
      supportActions: [],
      actionOutboxItems: [],
    };

    if (subjectType === 'user') {
      records.sessions = await this.prisma.supportSession.findMany({
        where: { tenantId, assignedUserId: subjectId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      records.auditEvents = await this.prisma.auditEvent.findMany({
        where: { tenantId, actorId: subjectId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      records.modelUsageLogs = await this.prisma.modelUsageLog.findMany({
        where: { tenantId, actorId: subjectId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
    } else if (subjectType === 'customer') {
      records.tickets = await this.prisma.ticketReference.findMany({
        where: { tenantId, customerId: subjectId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      const customerSessions = await this.prisma.supportSession.findMany({
        where: {
          tenantId,
          linkedTicketIds: { hasSome: (records.tickets as Array<{ id: string }>).map((t) => t.id) },
        },
        select: { id: true },
        take: 500,
      });
      const customerSessionIds = customerSessions.map((s) => s.id);
      if (customerSessionIds.length > 0) {
        records.callEvents = await this.prisma.callEvent.findMany({
          where: { tenantId, sessionId: { in: customerSessionIds } },
          orderBy: { createdAt: 'desc' },
          take: 500,
        });
      }
    } else if (subjectType === 'tenant') {
      records.sessions = await this.prisma.supportSession.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      records.tickets = await this.prisma.ticketReference.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      records.auditEvents = await this.prisma.auditEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      records.modelUsageLogs = await this.prisma.modelUsageLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
    }

    // Collect chat messages scoped to sessions found above
    const sessionIds = (records.sessions as Array<{ id: string }>).map((s) => s.id);
    if (sessionIds.length > 0) {
      const chatSessions = await this.prisma.aiChatSession.findMany({
        where: { tenantId, sessionId: { in: sessionIds } },
        select: { id: true },
        take: 500,
      });
      const chatSessionIds = chatSessions.map((c) => c.id);
      if (chatSessionIds.length > 0) {
        records.chatMessages = await this.prisma.aiChatMessage.findMany({
          where: { tenantId, chatSessionId: { in: chatSessionIds } },
          orderBy: { createdAt: 'desc' },
          take: 500,
        });
      }
    }

    // Screen observations scoped to sessions
    if (sessionIds.length > 0) {
      records.screenObservations = await this.prisma.screenObservation.findMany({
        where: { tenantId, sessionId: { in: sessionIds } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      records.internalNoteDrafts = await this.prisma.internalNoteDraft.findMany({
        where: { tenantId, sessionId: { in: sessionIds } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      records.supportActions = await this.prisma.supportAction.findMany({
        where: { tenantId, sessionId: { in: sessionIds } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      records.actionOutboxItems = await this.prisma.actionOutboxItem.findMany({
        where: { tenantId, sessionId: { in: sessionIds } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
    }

    return records;
  }

  private countRecords(records: Record<string, unknown[]>): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [key, items] of Object.entries(records)) {
      counts[key] = items.length;
    }
    return counts;
  }

  private countByAction(
    details: Array<{ entity: string; action: string }>,
    action: string,
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const d of details) {
      if (d.action === action) {
        counts[d.entity] = (counts[d.entity] ?? 0) + 1;
      }
    }
    return counts;
  }
}
