import { Controller, Get, Put, Param, Body, Req, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import { AdminPolicyService } from './admin-policy.service.js';

@Controller('admin/policies')
export class AdminPolicyController {
  constructor(@Inject(AdminPolicyService) private readonly service: AdminPolicyService) {}

  @Get()
  async list(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:read');
    return this.service.listPolicies(identity);
  }

  @Get('audit-preview')
  async auditPreview(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:read');
    return this.service.auditPreview(identity);
  }

  @Put('delivery/:id')
  async updateDelivery(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:write');
    return this.service.updateDeliveryPolicy(identity, id, body);
  }

  @Get('connectors/:installationId')
  async getConnector(@Req() req: Request, @Param('installationId') installationId: string) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:read');
    return this.service.getConnectorPolicy(identity, installationId);
  }

  @Put('connectors/:installationId')
  async updateConnector(
    @Req() req: Request,
    @Param('installationId') installationId: string,
    @Body() body: unknown,
  ) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:write');
    return this.service.updateConnectorPolicy(identity, installationId, body);
  }

  @Get('ai')
  async getAi(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:read');
    return this.service.getAiPolicy(identity);
  }

  @Put('ai')
  async updateAi(@Req() req: Request, @Body() body: unknown) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:write');
    return this.service.updateAiPolicy(identity, body);
  }

  @Get('retention')
  async getRetention(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:read');
    return this.service.getRetentionPolicy(identity);
  }

  @Put('retention')
  async updateRetention(@Req() req: Request, @Body() body: unknown) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'delivery_policy:write');
    return this.service.updateRetentionPolicy(identity, body);
  }
}
