import { Controller, Get, Patch, Post, Param, Req, Body, Inject, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import { ConnectorInstallationsService } from './connector-installations.service.js';

@Controller('connector-installations')
export class ConnectorInstallationsController {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store,
    @Inject(ConnectorInstallationsService)
    private readonly service: ConnectorInstallationsService
  ) {}

  @Get()
  async list(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'connector_installation:read');
    const installations = await this.store.listConnectorInstallations(identity.tenantId);
    return { installations };
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'connector_installation:read');
    const installation = await this.store.getConnectorInstallation(identity.tenantId, id);
    if (!installation) {
      throw new NotFoundException(`Connector installation ${id} not found`);
    }
    return { installation };
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { name?: string; config?: Record<string, unknown>; status?: string; safetyFlags?: Record<string, unknown> }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.updateInstallation(identity, id, body);
  }

  @Post(':id/validate')
  async validate(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.validateInstallation(identity, id);
  }

  @Post(':id/test')
  async test(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.testInstallation(identity, id);
  }
}
