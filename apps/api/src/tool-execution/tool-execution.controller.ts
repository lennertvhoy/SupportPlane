import { Controller, Post, Get, Param, Body, Req, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { ToolExecutionGatewayService } from './tool-execution-gateway.service.js';
import { ToolResultNoteDraftService } from './tool-result-note-draft.service.js';
import { ToolRegistryService } from './tool-registry.service.js';
import { requirePermission } from '../auth/rbac.js';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';

@Controller('admin')
export class ToolExecutionController {
  constructor(
    @Inject(ToolExecutionGatewayService) private readonly gateway: ToolExecutionGatewayService,
    @Inject(ToolResultNoteDraftService) private readonly draftService: ToolResultNoteDraftService,
    @Inject(ToolRegistryService) private readonly registry: ToolRegistryService,
  ) {}

  @Post('devices/:deviceId/tools/:toolKey/invoke')
  async invokeTool(
    @Req() req: Request,
    @Param('deviceId') deviceId: string,
    @Param('toolKey') toolKey: string,
    @Body() body: { requestedInput?: Record<string, unknown>; idempotencyKey?: string },
  ) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'endpoint_command:create');

    const result = await this.gateway.requestToolInvocation(identity, deviceId, {
      toolKey,
      requestedInput: body.requestedInput,
      idempotencyKey: body.idempotencyKey,
    });

    return {
      invocation: result.invocation,
      policyDecision: result.policyDecision,
    };
  }

  @Get('tool-invocations')
  async listInvocations(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'endpoint_command:read');
    const invocations = await this.gateway['store'].listToolInvocations(identity.tenantId, {});
    return { invocations };
  }

  @Get('tool-invocations/:id')
  async getInvocation(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'endpoint_command:read');
    const invocation = await this.gateway['store'].getToolInvocation(identity.tenantId, id);
    return { invocation: invocation ?? null };
  }

  @Post('tool-invocations/:id/note-draft')
  async createNoteDraft(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { ticketId?: string; title?: string },
  ) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'endpoint_command:create');
    const draft = await this.draftService.createDraftFromResult(identity, id, body);
    return { draft };
  }
}
