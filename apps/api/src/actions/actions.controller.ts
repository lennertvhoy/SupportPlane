import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { ActionsService } from './actions.service.js';
import { BodyLimitGuard } from '../common/body-limit.guard.js';
import { UnsafeFieldGuard } from '../common/unsafe-field.guard.js';
import { ValidateTenantContextGuard } from '../common/validation.guard.js';

@Controller()
export class ActionsController {
  constructor(@Inject(ActionsService) private readonly service: ActionsService) {}

  @Get('support-sessions/:id/actions')
  listSessionActions(@Req() req: Request, @Param('id') sessionId: string) {
    return this.service.listSessionActions(getCurrentIdentity(req), sessionId);
  }

  @Post('support-sessions/:id/actions')
  @UseGuards(BodyLimitGuard, UnsafeFieldGuard, ValidateTenantContextGuard)
  createAction(@Req() req: Request, @Param('id') sessionId: string, @Body() body: unknown) {
    return this.service.createAction(getCurrentIdentity(req), sessionId, body);
  }

  @Get('actions/:id')
  getAction(@Req() req: Request, @Param('id') id: string) {
    return this.service.getAction(getCurrentIdentity(req), id);
  }

  @Post('actions/:id/submit-for-review')
  submitForReview(@Req() req: Request, @Param('id') id: string) {
    return this.service.submitForReview(getCurrentIdentity(req), id);
  }

  @Post('actions/:id/approve')
  approve(@Req() req: Request, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.approve(getCurrentIdentity(req), id, body);
  }

  @Post('actions/:id/reject')
  reject(@Req() req: Request, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.reject(getCurrentIdentity(req), id, body);
  }

  @Post('actions/:id/queue')
  queue(@Req() req: Request, @Param('id') id: string) {
    return this.service.queue(getCurrentIdentity(req), id);
  }

  @Post('actions/:id/mock-deliver')
  mockDeliverAction(@Req() req: Request, @Param('id') id: string) {
    return this.service.mockDeliverAction(getCurrentIdentity(req), id);
  }

  @Post('actions/:id/cancel')
  cancel(@Req() req: Request, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.cancel(getCurrentIdentity(req), id, body);
  }

  @Get('outbox')
  listOutbox(@Req() req: Request) {
    return this.service.listOutbox(getCurrentIdentity(req));
  }

  @Get('outbox/worker/status')
  workerStatus(@Req() req: Request) {
    return this.service.getWorkerStatus(getCurrentIdentity(req));
  }

  @Get('outbox/:id')
  getOutbox(@Req() req: Request, @Param('id') id: string) {
    return this.service.getOutbox(getCurrentIdentity(req), id);
  }

  @Post('outbox/:id/retry')
  retry(@Req() req: Request, @Param('id') id: string) {
    return this.service.retryOutbox(getCurrentIdentity(req), id);
  }

  @Post('outbox/:id/cancel')
  cancelOutbox(@Req() req: Request, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.cancelOutbox(getCurrentIdentity(req), id, body);
  }

  @Post('outbox/:id/dead-letter')
  deadLetterOutbox(@Req() req: Request, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.deadLetterOutbox(getCurrentIdentity(req), id, body);
  }

  @Post('outbox/process-once')
  processOnce(@Req() req: Request, @Body() body: { outboxItemId?: string; workerId?: string }) {
    return this.service.processOutboxOnce(getCurrentIdentity(req), body);
  }

  @Post('outbox/:id/mock-deliver')
  mockDeliverOutbox(@Req() req: Request, @Param('id') id: string) {
    return this.service.mockDeliverOutbox(getCurrentIdentity(req), id);
  }
}
