import { Controller, Get, Inject, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ConnectorsService } from './connectors.service.js';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';

@Controller('connectors')
export class ConnectorsController {
  constructor(@Inject(ConnectorsService) private readonly service: ConnectorsService) {}

  @Get('zammad/status')
  zammadStatus(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'connector:read');
    const status = this.service.getZammadStatus();
    return {
      ...status,
      _tenantId: identity.tenantId,
    };
  }

  @Post('zammad/test')
  async zammadTest(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'connector:read');
    const result = await this.service.testZammadConnection();
    return {
      ...result,
      _tenantId: identity.tenantId,
    };
  }

  @Get('registry')
  registryList(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'connector:read');
    return {
      adapters: this.service.getRegisteredAdapters(),
      _tenantId: identity.tenantId,
    };
  }
}
