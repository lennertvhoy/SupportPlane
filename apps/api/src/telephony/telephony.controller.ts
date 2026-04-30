import { Body, Controller, Get, Headers, HttpCode, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import { TelephonyService, type FakeProviderWebhookBody } from './telephony.service.js';
import { listTelephonyAdapters } from '@supportplane/connectors';
import { ValidateTelephonyEventGuard } from '../common/validation.guard.js';

@Controller('telephony')
export class TelephonyController {
  constructor(
    @Inject(TelephonyService)
    private readonly service: TelephonyService
  ) {}

  @Get('status')
  getStatus(@Req() req: Request) {
    return this.service.getStatus(getCurrentIdentity(req));
  }

  @Post('test')
  test(@Req() req: Request) {
    return this.service.test(getCurrentIdentity(req));
  }

  @Post('webhooks/fake-provider')
  receiveFakeProviderWebhook(
    @Req() req: Request,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: FakeProviderWebhookBody
  ) {
    return this.service.receiveFakeProviderWebhook(getCurrentIdentity(req), body, headers);
  }

  @Post('calls/:id/control')
  @HttpCode(200)
  controlCall(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { action: string; reason?: string; target?: string }
  ) {
    return this.service.controlCall(getCurrentIdentity(req), id, body);
  }

  @Post('asterisk/events')
  @HttpCode(200)
  @UseGuards(ValidateTelephonyEventGuard)
  receiveAsteriskAmiEvent(
    @Req() req: Request,
    @Body() body: {
      tenantId?: string;
      externalCallId: string;
      eventType: string;
      callerNumber: string;
      calleeNumber?: string;
      direction?: string;
      status?: string;
      rawEvent?: Record<string, unknown>;
      autoCreateSession?: boolean;
      preferredSessionTitle?: string;
      preferredPriority?: string;
    }
  ) {
    return this.service.receiveAsteriskAmiEvent(getCurrentIdentity(req), body);
  }

  @Get('registry')
  getRegistry(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'telephony:read');
    return {
      adapters: listTelephonyAdapters().map((a) => ({
        adapterType: a.adapterType,
        capabilities: a.capabilities,
      })),
    };
  }
}
