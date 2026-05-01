import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { KnowledgeService } from './knowledge.service.js';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { requirePermission } from '../auth/rbac.js';
import {
  CreateKnowledgeSourceRequest,
  CreateKnowledgeArticleRequest,
  KnowledgeRetrievalRequest,
} from '@supportplane/contracts';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('sources')
  async createSource(@Body() body: CreateKnowledgeSourceRequest, @Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'knowledge:write');
    return this.knowledgeService.createSource(identity.tenantId, identity.userId, body);
  }

  @Get('sources')
  async listSources(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'knowledge:read');
    return this.knowledgeService.listSources(identity.tenantId);
  }

  @Get('sources/:id')
  async getSource(@Param('id') id: string, @Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'knowledge:read');
    return this.knowledgeService.getSource(identity.tenantId, id);
  }

  @Post('articles')
  async createArticle(@Body() body: CreateKnowledgeArticleRequest, @Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'knowledge:write');
    return this.knowledgeService.createArticle(identity.tenantId, identity.userId, body);
  }

  @Get('articles')
  async listArticles(
    @Query('sourceId') sourceId: string | undefined,
    @Query('status') status: string | undefined,
    @Req() req: Request,
  ) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'knowledge:read');
    return this.knowledgeService.listArticles(identity.tenantId, { sourceId, status });
  }

  @Get('articles/:id')
  async getArticle(@Param('id') id: string, @Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'knowledge:read');
    return this.knowledgeService.getArticle(identity.tenantId, id);
  }

  @Post('retrieve')
  async retrieve(@Body() body: KnowledgeRetrievalRequest, @Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'knowledge:read');
    return this.knowledgeService.retrieve(identity.tenantId, identity.userId, body);
  }
}
