import { Controller, Get, Patch, Post, Param, Req, Body, Inject, HttpCode, Query } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import { ConnectorInstallationsService } from './connector-installations.service.js';
import { ConnectorRuntimeService } from './connector-runtime.service.js';

@Controller('connector-installations')
export class ConnectorInstallationsController {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store,
    @Inject(ConnectorInstallationsService)
    private readonly service: ConnectorInstallationsService,
    @Inject(ConnectorRuntimeService)
    private readonly runtimeService: ConnectorRuntimeService
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() body: { name: string; adapterType: string; config?: Record<string, unknown>; safetyFlags?: Record<string, unknown> }) {
    const identity = getCurrentIdentity(req);
    return this.service.createInstallation(identity, body);
  }

  @Get()
  async list(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    const installations = await this.service.listConnectorInstallations(identity);
    return { installations };
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    const installation = await this.service.getConnectorInstallation(identity, id);
    return { installation };
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      displayName?: string;
      description?: string;
      config?: Record<string, unknown>;
      status?: string;
      mockMode?: boolean;
      enabled?: boolean;
      capabilities?: string[];
      safetyFlags?: Record<string, unknown>;
      timeoutMs?: number;
    }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.updateInstallation(identity, id, body);
  }

  @Post(':id/validate')
  @HttpCode(200)
  async validate(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.validateInstallation(identity, id);
  }

  @Post(':id/test')
  @HttpCode(200)
  async test(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.testInstallation(identity, id);
  }

  @Post(':id/link-credential')
  @HttpCode(200)
  async linkCredential(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { credentialReferenceId: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.linkCredentialReference(identity, id, body.credentialReferenceId);
  }

  @Post(':id/unlink-credential')
  @HttpCode(200)
  async unlinkCredential(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { credentialReferenceId: string }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.unlinkCredentialReference(identity, id, body.credentialReferenceId);
  }

  @Get(':id/config-schema')
  @HttpCode(200)
  async getConfigSchema(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.runtimeService.getConfigSchema(identity, id);
  }

  @Post(':id/validate-config')
  @HttpCode(200)
  async validateConfig(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { config: Record<string, unknown> }
  ) {
    const identity = getCurrentIdentity(req);
    return this.runtimeService.validateConfig(identity, id, body.config);
  }

  @Post(':id/runtime-readiness')
  @HttpCode(200)
  async runtimeReadiness(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.runtimeService.checkRuntimeReadiness(identity, id);
  }

  @Get('runtime/resolve')
  @HttpCode(200)
  async resolveRuntime(@Req() req: Request, @Query('connectorType') connectorType: string) {
    const identity = getCurrentIdentity(req);
    if (!connectorType) {
      return { error: 'connectorType query parameter is required' };
    }
    return this.runtimeService.resolveRuntime(identity, connectorType);
  }

  // BL-124: Dynamic adapter schema discovery endpoints
  @Get('runtime/adapters')
  @HttpCode(200)
  async listAdapters(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    return this.runtimeService.listRegisteredAdapters(identity);
  }

  @Get('runtime/adapters/:adapterType/schema')
  @HttpCode(200)
  async getAdapterSchema(@Req() req: Request, @Param('adapterType') adapterType: string) {
    const identity = getCurrentIdentity(req);
    return this.runtimeService.getAdapterSchema(identity, adapterType);
  }
}
