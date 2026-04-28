import { Controller, Get, Post, Patch, Param, Req, Body, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import { CredentialReferencesService } from './credential-references.service.js';

@Controller('credential-references')
export class CredentialReferencesController {
  constructor(
    @Inject(InMemoryStore)
    private readonly store: Store,
    @Inject(CredentialReferencesService)
    private readonly service: CredentialReferencesService
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() body: {
    connectorType: string;
    displayName: string;
    description?: string;
    status?: string;
    secretKind?: string;
  }) {
    const identity = getCurrentIdentity(req);
    return this.service.createCredentialReference(identity, body);
  }

  @Get()
  async list(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    return this.service.listCredentialReferences(identity);
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const identity = getCurrentIdentity(req);
    return this.service.getCredentialReference(identity, id);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: {
      displayName?: string;
      description?: string;
      status?: string;
      secretKind?: string;
    }
  ) {
    const identity = getCurrentIdentity(req);
    return this.service.updateCredentialReference(identity, id, body);
  }
}
