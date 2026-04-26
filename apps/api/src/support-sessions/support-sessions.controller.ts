import {
  Controller,
  Get,
  Inject,
  Post,
  Param,
  Body,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SupportSessionsService } from './support-sessions.service.js';
import { getDevIdentity } from '../common/dev-identity.middleware.js';
import { EvidenceBundleFormat } from '@supportplane/contracts';

@Controller('support-sessions')
export class SupportSessionsController {
  constructor(
    @Inject(SupportSessionsService)
    private readonly service: SupportSessionsService
  ) {}

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

  @Post(':id/zammad/ticket-context')
  async loadZammadTicketContext(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { externalTicketId: string }
  ) {
    const identity = getDevIdentity(req);
    return this.service.loadTicketContext(identity, id, body.externalTicketId);
  }

  @Post(':id/zammad/internal-note-draft')
  createInternalNoteDraft(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { externalTicketId: string; body: string; subject?: string }
  ) {
    const identity = getDevIdentity(req);
    return this.service.createInternalNoteDraft(identity, id, body);
  }

  @Post(':id/zammad/internal-note-writeback')
  async writebackInternalNote(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { draftId: string; externalTicketId: string; body: string }
  ) {
    const identity = getDevIdentity(req);
    return this.service.writebackInternalNote(identity, id, body);
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

  @Post(':id/draft-suggestion')
  generateDraftSuggestion(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      operatorInstructions?: string;
      modelSelection?: { provider?: string; model?: string };
    }
  ) {
    const identity = getDevIdentity(req);
    return this.service.generateDraftSuggestion(identity, id, body);
  }

  @Post(':id/greeting-suggestion')
  generateGreetingSuggestion(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      callEventId?: string;
      tone?: string;
      modelSelection?: { provider?: string; model?: string };
    }
  ) {
    const identity = getDevIdentity(req);
    return this.service.generateGreetingSuggestion(identity, id, body);
  }

  @Get(':id/audit-events')
  getAuditEvents(@Req() req: Request, @Param('id') id: string) {
    const identity = getDevIdentity(req);
    return this.service.getAuditEvents(identity, id);
  }

  @Get(':id/evidence-bundle')
  getEvidenceBundle(@Req() req: Request, @Param('id') id: string) {
    const identity = getDevIdentity(req);
    return this.service.generateEvidenceBundle(identity, id, EvidenceBundleFormat.enum.json);
  }

  @Get(':id/evidence-bundle.json')
  getEvidenceBundleJson(@Req() req: Request, @Param('id') id: string) {
    const identity = getDevIdentity(req);
    return this.service.generateEvidenceBundle(identity, id, EvidenceBundleFormat.enum.json);
  }

  @Get(':id/evidence-bundle.md')
  getEvidenceBundleMarkdown(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string
  ) {
    const identity = getDevIdentity(req);
    const result = this.service.generateEvidenceBundle(identity, id, EvidenceBundleFormat.enum.markdown);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(result.markdown);
    return;
  }
}
