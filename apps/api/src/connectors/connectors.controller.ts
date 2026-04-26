import { Controller, Get, Inject, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ConnectorsService } from './connectors.service.js';
import { getDevIdentity } from '../common/dev-identity.middleware.js';

@Controller('connectors')
export class ConnectorsController {
  constructor(@Inject(ConnectorsService) private readonly service: ConnectorsService) {}

  @Get('zammad/status')
  zammadStatus(@Req() req: Request) {
    const identity = getDevIdentity(req);
    const status = this.service.getZammadStatus();
    return {
      ...status,
      _tenantId: identity.tenantId,
    };
  }

  @Post('zammad/test')
  async zammadTest(@Req() req: Request) {
    const identity = getDevIdentity(req);
    const result = await this.service.testZammadConnection();
    return {
      ...result,
      _tenantId: identity.tenantId,
    };
  }
}
