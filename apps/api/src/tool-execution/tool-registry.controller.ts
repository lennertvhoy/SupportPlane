import { Controller, Get, Param, Inject, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ToolRegistryService } from './tool-registry.service.js';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';

@Controller('admin/tools')
export class ToolRegistryController {
  constructor(@Inject(ToolRegistryService) private readonly registry: ToolRegistryService) {}

  @Get()
  async listTools(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'tool:read');
    const tools = await this.registry.listTools({ enabled: undefined });
    return { tools };
  }

  @Get(':id')
  async getTool(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'tool:read');
    const tool = await this.registry.getToolDefinition(id);
    if (!tool) return { tool: null };
    return { tool };
  }
}
