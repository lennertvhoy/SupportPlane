import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import { ModelUsageService } from './model-usage.service.js';
import { ModelUsageQuery } from '@supportplane/contracts';

@Controller('model-usage')
export class ModelUsageController {
  constructor(private readonly service: ModelUsageService) {}

  @Get()
  async list(@Req() req: Request, @Query() query: unknown) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:read');
    const parsed = ModelUsageQuery.parse(query);
    const q = { ...parsed, tenantId: identity.tenantId };
    return this.service.list(q);
  }

  @Get('summary')
  async summary(@Req() req: Request, @Query() query: unknown) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:read');
    const parsed = ModelUsageQuery.parse(query);
    const q = { ...parsed, tenantId: identity.tenantId };
    return this.service.summary(q);
  }
}
