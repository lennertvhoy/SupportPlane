import { Controller, Get, Param, Req, Inject, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';

@Controller('connector-installations')
export class ConnectorInstallationsController {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store
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
}
