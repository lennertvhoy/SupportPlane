import { Controller, Post, Get, Param, Body, Req, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { ToolApprovalService } from './tool-approval.service.js';
import { ToolExecutionGatewayService } from './tool-execution-gateway.service.js';
import { requirePermission } from '../auth/rbac.js';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';

@Controller('admin/tool-approvals')
export class ToolApprovalController {
  constructor(
    @Inject(ToolApprovalService) private readonly approvalService: ToolApprovalService,
    @Inject(ToolExecutionGatewayService) private readonly gateway: ToolExecutionGatewayService,
  ) {}

  @Get()
  async listApprovals(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'endpoint_command:read');
    const approvals = await this.approvalService.listApprovals(identity.tenantId, {});
    return { approvals };
  }

  @Post(':id/approve')
  async approve(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'endpoint_command:create');
    const approval = await this.approvalService.approveOrDeny(identity, id, 'approve', body.reason);

    // Dispatch the associated invocation
    const invocation = await this.gateway['store'].getToolInvocation(identity.tenantId, approval.invocationId);
    if (invocation) {
      await this.gateway.dispatchAfterApproval(identity, invocation.id);
    }

    return { approval };
  }

  @Post(':id/deny')
  async deny(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'endpoint_command:create');
    const approval = await this.approvalService.approveOrDeny(identity, id, 'deny', body.reason);
    return { approval };
  }
}
