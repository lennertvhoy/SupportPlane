import {
  Controller,
  Get,
  Post,
  HttpCode,
  Inject,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CallsService } from './calls.service.js';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { CallStatus } from '@supportplane/contracts';

@Controller('calls')
export class CallsController {
  constructor(
    @Inject(CallsService)
    private readonly service: CallsService
  ) {}

  @Post('fake-incoming')
  createFakeIncoming(
    @Req() req: Request,
    @Body() body: {
      externalCallId: string;
      rawCallerNumber: string;
      callerDisplayName?: string;
      autoCreateSession?: boolean;
      preferredSessionTitle?: string;
      preferredPriority?: string;
    }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.createFakeIncomingCall(identity, body);
  }

  @Get('recent')
  listRecent(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    return this.service.listRecentCalls(identity);
  }

  @Get(':id')
  getOne(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.getCall(identity, id);
  }

  @Post(':id/link-session')
  linkSession(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { sessionId: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.linkCallToSession(identity, id, body);
  }

  @Post(':id/link-ticket')
  linkTicket(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { ticketReferenceId: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.linkTicketToCall(identity, id, body);
  }

  @Post(':id/unlink-ticket')
  unlinkTicket(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { ticketReferenceId: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.unlinkTicketFromCall(identity, id, body);
  }

  @Post(':id/status')
  @HttpCode(200)
  updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string }
  ) {
    const identity = getCurrentIdentity(req);
    const parsed = CallStatus.safeParse(body.status);
    if (!parsed.success) {
      return { statusCode: 400, error: 'Bad Request', message: `Invalid call status: ${body.status}. Allowed: ${CallStatus.options.join(', ')}` };
    }
    return this.service.updateCallStatus(identity, id, { status: parsed.data, reason: body.reason });
  }

  @Get(':id/timeline')
  async getTimeline(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    const { timelineItems, generatedAt } = await this.service.getCallTimeline(identity, id);
    return { callEventId: id, timelineItems, generatedAt, mockDevOnly: true };
  }

  @Post(':id/recordings/mock')
  attachMockRecording(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { source?: string; durationSeconds?: number }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.attachMockRecording(identity, id, body);
  }

  @Get(':id/recordings')
  listRecordings(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.listCallRecordings(identity, id);
  }

  @Post(':id/recordings/:recordingId/review')
  reviewRecording(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('recordingId') recordingId: string
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.reviewCallRecording(identity, id, recordingId);
  }

  @Post(':id/recordings/:recordingId/playback')
  recordPlayback(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('recordingId') recordingId: string
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.recordPlaybackOpened(identity, id, recordingId);
  }
}
