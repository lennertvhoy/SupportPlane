import { Controller, Get, Query, Req, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import { ModelUsageService } from './model-usage.service.js';
import { ModelUsageQuery } from '@supportplane/contracts';
import { ZodError } from 'zod';

function parseModelUsageQuery(query: unknown) {
  try {
    return ModelUsageQuery.parse(query);
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new BadRequestException(`Invalid query parameters: ${issues}`);
    }
    throw err;
  }
}

@Controller('model-usage')
export class ModelUsageController {
  constructor(private readonly service: ModelUsageService) {}

  @Get()
  async list(@Req() req: Request, @Query() query: unknown) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:read');
    const parsed = parseModelUsageQuery(query);
    const q = { ...parsed, tenantId: identity.tenantId };
    return this.service.list(q);
  }

  @Get('summary')
  async summary(@Req() req: Request, @Query() query: unknown) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:read');
    const parsed = parseModelUsageQuery(query);
    const q = { ...parsed, tenantId: identity.tenantId };
    return this.service.summary(q);
  }
}
