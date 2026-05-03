import {
  Controller,
  Get,
  Inject,
  Post,
  Param,
  Body,
  Req,
  Res,
  Query,
  NotImplementedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SupportSessionsService } from './support-sessions.service.js';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { EvidenceBundleFormat } from '@supportplane/contracts';
import type {
  ScreenObservationCaptureRequest,
  ScreenObservationReviewRequest,
  ScreenObservationContextPacketRequest,
  ActiveWindowMetadataCaptureRequest,
  ManualScreenshotMetadataRequest,
  StructuredScreenObservationUploadRequest,
  ScreenObservationSharingStateRequest,
} from '@supportplane/contracts';
import { AuditExplorerService } from '../audit-explorer/audit-explorer.service.js';
import { EvidencePdfService } from '../evidence-bundle/evidence-pdf.service.js';
import { AiChatService } from '../ai-chat/ai-chat.service.js';

@Controller('support-sessions')
export class SupportSessionsController {
  constructor(
    @Inject(SupportSessionsService)
    private readonly service: SupportSessionsService,
    @Inject(AiChatService)
    private readonly aiChatService: AiChatService
  ) {}

  @Get()
  list(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    return this.service.listSessions(identity);
  }

  @Post()
  create(
    @Req() req: Request,
    @Body() body: { title: string; description?: string; priority?: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.createSession(identity, body);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.getSession(identity, id);
  }

  @Post(':id/link-ticket')
  linkTicket(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { ticketReferenceId: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.linkTicketToSession(identity, id, body);
  }

  @Post(':id/unlink-ticket')
  unlinkTicket(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { ticketReferenceId: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.unlinkTicketFromSession(identity, id, body);
  }

  @Get(':id/customer-references')
  getCustomerReferences(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.getCustomerReferencesForSession(identity, id);
  }

  @Get(':id/case-timeline')
  getCaseTimeline(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.getCaseTimeline(identity, id);
  }

  @Post(':id/ticket-context')
  async loadTicketContext(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { externalTicketId: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.loadTicketContext(identity, id, body.externalTicketId);
  }

  @Post(':id/zammad/ticket-context')
  async loadZammadTicketContext(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { externalTicketId: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.loadTicketContext(identity, id, body.externalTicketId);
  }

  @Post(':id/glpi/ticket-context')
  async loadGlpiTicketContext(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { externalTicketId: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.loadGlpiTicketContext(identity, id, body.externalTicketId);
  }

  @Post(':id/zammad/internal-note-draft')
  createInternalNoteDraft(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { externalTicketId: string; body: string; subject?: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.createInternalNoteDraft(identity, id, body);
  }

  @Post(':id/zammad/internal-note-writeback')
  async writebackInternalNote(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { draftId: string; externalTicketId: string; body: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.writebackInternalNote(identity, id, body);
  }

  @Post(':id/context-packets')
  createContextPacket(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { provenance: string; payload: Record<string, unknown> }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.createContextPacket(identity, id, body);
  }

  @Get(':id/context-packets')
  getContextPackets(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
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
    const identity = getCurrentIdentity(req);
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
    const identity = getCurrentIdentity(req);
    return this.service.generateGreetingSuggestion(identity, id, body);
  }

  @Post(':id/support-note-drafts')
  createSupportNoteDraft(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { externalTicketId: string; operatorNotes?: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.createSupportNoteDraft(identity, id, body);
  }

  @Get(':id/audit-events')
  getAuditEvents(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.getAuditEvents(identity, id);
  }

  @Get(':id/evidence-bundle')
  getEvidenceBundle(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.generateEvidenceBundle(identity, id, EvidenceBundleFormat.enum.json);
  }

  @Get(':id/evidence-bundle.json')
  getEvidenceBundleJson(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.generateEvidenceBundle(identity, id, EvidenceBundleFormat.enum.json);
  }

  @Get(':id/evidence-bundle.md')
  async getEvidenceBundleMarkdown(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string
  ) {
    const identity = getCurrentIdentity(req);
    const result = await this.service.generateEvidenceBundle(identity, id, EvidenceBundleFormat.enum.markdown);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(result.markdown);
    return;
  }

  @Get(':id/evidence-bundle.pdf')
  async getEvidenceBundlePdf(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string
  ) {
    const identity = getCurrentIdentity(req);
    const result = await this.service.generateEvidenceBundle(identity, id, EvidenceBundleFormat.enum.json);
    const pdfService = new EvidencePdfService();
    try {
      const pdfBuffer = await pdfService.generatePdf(result.bundle);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="evidence-bundle-${id}.pdf"`);
      res.send(pdfBuffer);
      return;
    } catch {
      throw new NotImplementedException('PDF generation is not available — pdfmake or fonts failed to load. Use .json or .md export instead.');
    }
  }

  @Get('audit-events')
  async auditEvents(
    @Req() req: Request,
    @Query() query: Record<string, string>
  ) {
    const identity = getCurrentIdentity(req);
    const auditService = new AuditExplorerService();
    return auditService.queryAuditEvents({
      tenantId: identity.tenantId,
      eventType: query.eventType,
      actorId: query.actorId,
      actorType: query.actorType,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
    });
  }

  @Post(':id/screen-observations/mock')
  async captureMockScreenObservation(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: ScreenObservationCaptureRequest
  ) {
    const identity = getCurrentIdentity(req);
    const observation = await this.service.captureMockScreenObservation(identity, id, body);
    return {
      observation,
      redactedSummary: observation.redactedSummary ?? '[REDACTED]',
      mockDevOnly: true,
    };
  }

  @Post(':id/screen-observations/active-window/mock')
  captureActiveWindowMockMetadata(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: ActiveWindowMetadataCaptureRequest
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.captureActiveWindowMockMetadata(identity, id, body);
  }

  @Post(':id/screen-observations/manual-screenshot')
  attachManualScreenshotMetadata(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: ManualScreenshotMetadataRequest
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.attachManualScreenshotMetadata(identity, id, body);
  }

  @Post(':id/screen-observations/structured-upload')
  uploadStructuredScreenObservation(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: StructuredScreenObservationUploadRequest
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.uploadStructuredScreenObservation(identity, id, body);
  }

  @Get(':id/screen-observations/sharing-state')
  getSharingState(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.getSharingState(identity, id);
  }

  @Post(':id/screen-observations/sharing-state')
  updateSharingState(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: ScreenObservationSharingStateRequest
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.updateSharingState(identity, id, body);
  }

  @Get(':id/screen-observations')
  listScreenObservations(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.listScreenObservations(identity, id);
  }

  @Post(':id/screen-observations/:observationId/review')
  reviewScreenObservation(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('observationId') observationId: string,
    @Body() body: ScreenObservationReviewRequest
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.reviewScreenObservation(identity, id, observationId, body);
  }

  @Post(':id/screen-observations/:observationId/context-packet')
  createContextPacketFromObservation(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('observationId') observationId: string,
    @Body() body: ScreenObservationContextPacketRequest
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.createContextPacketFromObservation(identity, id, observationId, body);
  }

  @Post(':id/ticket-summary')
  generateTicketSummary(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      ticketReferenceId?: string;
      modelSelection?: { provider?: string; model?: string };
    } = {}
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.generateTicketSummary(identity, id, body);
  }

  @Post(':id/ai-chat')
  createAiChatSession(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { title?: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.aiChatService.createChatSession(identity, { sessionId: id, title: body.title });
  }

  @Get(':id/ai-chat')
  listAiChatSessions(@Req() req: Request, @Param('id') _id: string) {
    const identity = getCurrentIdentity(req);
    return this.aiChatService.listChatSessions(identity);
  }

  @Get(':id/ai-chat/:chatId')
  getAiChatSession(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('chatId') chatId: string
  ) {
    const identity = getCurrentIdentity(req);
    return this.aiChatService.getChatSession(identity, chatId);
  }

  @Post(':id/ai-chat/:chatId/messages')
  sendAiChatMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('chatId') chatId: string,
    @Body()
    body: {
      content: string;
      role?: string;
      modelSelection?: { provider?: string; model?: string };
    }
  ) {
    const identity = getCurrentIdentity(req);
    return this.aiChatService.sendMessage(identity, chatId, body);
  }
}
