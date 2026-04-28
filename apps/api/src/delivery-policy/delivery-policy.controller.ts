import { Controller, Get, HttpCode, Param, Patch, Post, Req, Body, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import { DeliveryPolicyService } from './delivery-policy.service.js';

@Controller()
export class DeliveryPolicyController {
  constructor(@Inject(DeliveryPolicyService) private readonly service: DeliveryPolicyService) {}

  @Get('delivery-policies')
  async list(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:read');
    return this.service.listPolicies(identity);
  }

  @Get('delivery-policies/:id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:read');
    return this.service.getPolicy(identity, id);
  }

  @Patch('delivery-policies/:id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:write');
    return this.service.updatePolicy(identity, id, body);
  }

  @Post('delivery-policies/:id/validate')
  @HttpCode(200)
  async validate(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:read');
    return this.service.validatePolicy(identity, id);
  }

  @Post('connector-installations/:id/readiness')
  @HttpCode(200)
  async readiness(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'connector_installation:read');
    return this.service.checkConnectorReadiness(identity, id);
  }
}
