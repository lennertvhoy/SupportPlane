import { Body, Controller, Get, Headers, HttpCode, Inject, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { TelephonyService, type FakeProviderWebhookBody } from './telephony.service.js';

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
}
