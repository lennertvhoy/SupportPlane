import { Controller, Post, Body, Req, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import { GdprService } from './gdpr.service.js';

@Controller('gdpr')
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  @Post('export-preview')
  async exportPreview(@Req() req: Request, @Body() body: { subjectType?: string; subjectId?: string }) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:read');
    if (!body.subjectType || !body.subjectId) {
      throw new BadRequestException('subjectType and subjectId are required');
    }
    return this.gdprService.exportPreview(identity, body.subjectType, body.subjectId);
  }

  @Post('delete-preview')
  async deletePreview(@Req() req: Request, @Body() body: { subjectType?: string; subjectId?: string }) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:write');
    if (!body.subjectType || !body.subjectId) {
      throw new BadRequestException('subjectType and subjectId are required');
    }
    return this.gdprService.deletePreview(identity, body.subjectType, body.subjectId);
  }

  @Post('export')
  async export(@Req() req: Request, @Body() body: { subjectType?: string; subjectId?: string }) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:read');
    if (!body.subjectType || !body.subjectId) {
      throw new BadRequestException('subjectType and subjectId are required');
    }
    return this.gdprService.export(identity, body.subjectType, body.subjectId);
  }
}
