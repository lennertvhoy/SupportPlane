import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuditExplorerService } from './audit-explorer.service.js';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';

@Controller('audit-events')
export class AuditExplorerController {
  constructor(private readonly service: AuditExplorerService) {}

  @Get()
  async list(@Req() req: Request, @Query() query: Record<string, string>) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:read');
    return this.service.queryAuditEvents({
      tenantId: identity.tenantId,
      eventType: query.eventType,
      actorId: query.actorId,
      actorType: query.actorType,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
    });
  }
}
