import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import { getProviderReadiness } from '@supportplane/ai';

@Controller('admin')
export class AiGatewayController {
  @Get('ai-provider-readiness')
  async aiProviderReadiness(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:read');
    return { providers: getProviderReadiness(), checkedAt: new Date().toISOString() };
  }
}
