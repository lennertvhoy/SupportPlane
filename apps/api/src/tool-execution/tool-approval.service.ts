import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ToolApprovalStatus,
  type ToolApproval as ToolApprovalShape,
  type ToolInvocation as ToolInvocationShape,
} from '@supportplane/contracts';
import type { Store } from '../store/store.interface.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { CurrentIdentity } from '../auth/auth.types.js';

@Injectable()
export class ToolApprovalService {
  constructor(@Inject(InMemoryStore) private readonly store: Store) {}

  async createApproval(
    invocation: ToolInvocationShape,
  ): Promise<ToolApprovalShape> {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
    const approval: ToolApprovalShape = {
      id: randomUUID() as ToolApprovalShape['id'],
      tenantId: invocation.tenantId,
      invocationId: invocation.id,
      requestedByUserId: invocation.requestedByUserId,
      status: ToolApprovalStatus.enum.requested,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.saveToolApproval(approval);
    return approval;
  }

  async approveOrDeny(
    identity: CurrentIdentity,
    approvalId: string,
    decision: 'approve' | 'deny',
    reason?: string,
  ): Promise<ToolApprovalShape> {
    const approval = await this.store.getToolApproval(identity.tenantId, approvalId);
    if (!approval) throw new NotFoundException('Approval request not found.');

    // Authorized approver roles
    const allowedApproverRoles = ['admin', 'owner'];
    const canApprove = identity.roles.some((r) => allowedApproverRoles.includes(r)) || identity.permissions.includes('*');
    if (!canApprove) {
      throw new ForbiddenException('Only admin or owner roles can approve tool executions.');
    }

    const now = new Date().toISOString();

    if (approval.status !== 'requested') {
      throw new BadRequestException(`Approval is already ${approval.status}.`);
    }

    if (Date.parse(approval.expiresAt) <= Date.now()) {
      const expired: ToolApprovalShape = { ...approval, status: ToolApprovalStatus.enum.expired, updatedAt: now };
      await this.store.saveToolApproval(expired);
      throw new BadRequestException('Approval request has expired.');
    }

    const updated: ToolApprovalShape = {
      ...approval,
      approvedByUserId: identity.userId,
      status: decision === 'approve' ? ToolApprovalStatus.enum.approved : ToolApprovalStatus.enum.denied,
      reason: decision === 'deny' ? (reason ?? 'No reason provided') : reason,
      decidedAt: now,
      updatedAt: now,
    };
    await this.store.saveToolApproval(updated);
    return updated;
  }

  async getApproval(tenantId: string, id: string): Promise<ToolApprovalShape | undefined> {
    return this.store.getToolApproval(tenantId, id);
  }

  async listApprovals(tenantId: string, options?: { status?: string }): Promise<ToolApprovalShape[]> {
    return this.store.listToolApprovals(tenantId, options);
  }

  async checkApprovalValid(approval: ToolApprovalShape): Promise<{ valid: boolean; reason?: string }> {
    if (approval.status !== 'approved') {
      return { valid: false, reason: `Approval status is ${approval.status}` };
    }
    if (Date.parse(approval.expiresAt) <= Date.now()) {
      return { valid: false, reason: 'Approval has expired.' };
    }
    return { valid: true };
  }

  async markConsumed(approval: ToolApprovalShape): Promise<void> {
    const updated: ToolApprovalShape = {
      ...approval,
      status: ToolApprovalStatus.enum.consumed,
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveToolApproval(updated);
  }
}
