import { Controller, Get, Param, Req, Query, Inject, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';

@Controller('tickets')
export class TicketsController {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store
  ) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('customerId') customerId?: string,
    @Query('email') email?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string
  ) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'ticket:read');
    let tickets = await this.store.listAllTicketReferences(identity.tenantId);
    if (customerId) {
      tickets = tickets.filter((t) => t.customerId === customerId);
    }
    if (email) {
      tickets = tickets.filter((t) => t.customerEmail?.toLowerCase() === email.toLowerCase());
    }
    if (status) {
      tickets = tickets.filter((t) => t.status === status);
    }
    if (priority) {
      tickets = tickets.filter((t) => t.priority === priority);
    }
    return { tickets };
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'ticket:read');
    const tickets = await this.store.listAllTicketReferences(identity.tenantId);
    const ticket = tickets.find((t) => t.id === id || t.externalTicketId === id);
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    return { ticket };
  }
}
