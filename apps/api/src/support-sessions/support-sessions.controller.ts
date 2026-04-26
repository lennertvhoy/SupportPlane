import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupportSessionsService } from './support-sessions.service.js';
import { getDevIdentity } from '../common/dev-identity.middleware.js';

@Controller('support-sessions')
export class SupportSessionsController {
  constructor(private readonly service: SupportSessionsService) {}

  @Get()
  list(@Req() req: Request) {
    const identity = getDevIdentity(req);
    return this.service.listSessions(identity);
  }

  @Post()
  create(
    @Req() req: Request,
    @Body() body: { title: string; description?: string; priority?: string }
  ) {
    const identity = getDevIdentity(req);
    return this.service.createSession(identity, body);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const identity = getDevIdentity(req);
    return this.service.getSession(identity, id);
  }

  @Post(':id/ticket-context')
  async loadTicketContext(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { externalTicketId: string }
  ) {
    const identity = getDevIdentity(req);
    return this.service.loadTicketContext(identity, id, body.externalTicketId);
  }

  @Post(':id/context-packets')
  createContextPacket(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { provenance: string; payload: Record<string, unknown> }
  ) {
    const identity = getDevIdentity(req);
    return this.service.createContextPacket(identity, id, body);
  }

  @Get(':id/context-packets')
  getContextPackets(@Req() req: Request, @Param('id') id: string) {
    const identity = getDevIdentity(req);
    return this.service.getContextPackets(identity, id);
  }

  @Get(':id/audit-events')
  getAuditEvents(@Req() req: Request, @Param('id') id: string) {
    const identity = getDevIdentity(req);
    return this.service.getAuditEvents(identity, id);
  }
}
