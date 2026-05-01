import { Controller, Get, Param, Inject } from '@nestjs/common';
import { ToolRegistryService } from './tool-registry.service.js';

@Controller('admin/tools')
export class ToolRegistryController {
  constructor(@Inject(ToolRegistryService) private readonly registry: ToolRegistryService) {}

  @Get()
  async listTools() {
    const tools = await this.registry.listTools({ enabled: undefined });
    return { tools };
  }

  @Get(':id')
  async getTool(@Param('id') id: string) {
    const tool = await this.registry.getToolDefinition(id);
    if (!tool) return { tool: null };
    return { tool };
  }
}
