import {
  Controller,
  Get,
  Post,
  Inject,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CallsService } from './calls.service.js';
import { getDevIdentity } from '../common/dev-identity.middleware.js';

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
    const identity = getDevIdentity(req);
    return this.service.createFakeIncomingCall(identity, body);
  }

  @Get('recent')
  listRecent(@Req() req: Request) {
    const identity = getDevIdentity(req);
    return this.service.listRecentCalls(identity);
  }

  @Get(':id')
  getOne(@Req() req: Request, @Param('id') id: string) {
    const identity = getDevIdentity(req);
    return this.service.getCall(identity, id);
  }

  @Post(':id/link-session')
  linkSession(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { sessionId: string }
  ) {
    const identity = getDevIdentity(req);
    return this.service.linkCallToSession(identity, id, body);
  }
}
