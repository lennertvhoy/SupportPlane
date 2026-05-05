import { Controller, Get, Param, Req, Query, Inject, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';

@Controller('customers')
export class CustomersController {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store,
  ) {}

  @Get()
  async list(@Req() req: Request, @Query('email') email?: string, @Query('phone') phone?: string) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'customer:read');
    const customers = await this.store.listCustomerReferences(identity.tenantId, { email, phone });
    return { customers };
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'customer:read');
    const customer = await this.store.getCustomerReference(identity.tenantId, id);
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return { customer };
  }
}
