import { Controller, Get, Post, Param, Body, Inject, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AiChatService } from './ai-chat.service.js';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';

@Controller('ai-chat')
export class AiChatController {
  constructor(
    @Inject(AiChatService)
    private readonly service: AiChatService,
  ) {}

  @Post('sessions')
  createSession(@Req() req: Request, @Body() body: { sessionId?: string; title?: string }) {
    const identity = getCurrentIdentity(req);
    return this.service.createChatSession(identity, body);
  }

  @Get('sessions')
  listSessions(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    return this.service.listChatSessions(identity);
  }

  @Get('sessions/:id')
  getSession(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.getChatSession(identity, id);
  }

  @Post('sessions/:id/messages')
  sendMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      content: string;
      role?: string;
      modelSelection?: { provider?: string; model?: string };
    },
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.sendMessage(identity, id, body);
  }
}
