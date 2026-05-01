import { Injectable, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type ToolManifestRecord as ToolManifestRecordShape,
  type ToolDefinition as ToolDefinitionShape,
  validateLocalManifest,
} from '@supportplane/contracts';
import type { Store } from '../store/store.interface.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ToolRegistryService implements OnModuleInit {
  constructor(@Inject(InMemoryStore) private readonly store: Store) {}

  async onModuleInit() {
    await this.loadLocalManifest();
  }

  private loadLocalManifestJson(): unknown {
    const candidates = [
      join(process.cwd(), 'src', 'tool-execution', 'local-tool-manifest.json'),
      join(process.cwd(), 'apps', 'api', 'src', 'tool-execution', 'local-tool-manifest.json'),
      join(__dirname, 'local-tool-manifest.json'),
    ];
    for (const path of candidates) {
      try {
        const content = readFileSync(path, 'utf8');
        return JSON.parse(content);
      } catch {
        // try next candidate
      }
    }
    throw new Error('local-tool-manifest.json not found in any candidate path');
  }

  async loadLocalManifest(): Promise<{ record: ToolManifestRecordShape; tools: ToolDefinitionShape[] }> {
    const manifest = this.loadLocalManifestJson();
    const validation = validateLocalManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Local tool manifest rejected: ${validation.errors.join('; ')}`);
    }
    const data = validation.data;

    // Idempotent load: if a manifest with this integrity hash already exists, reuse it,
    // but still upsert definitions so a partial prior load can self-heal.
    const existingManifests = await this.store.listToolManifestRecords();
    const existing = existingManifests.find(m => m.integrityHash === data.integrityHash);

    const now = new Date().toISOString();
    const record: ToolManifestRecordShape = existing ?? {
      id: randomUUID() as ToolManifestRecordShape['id'],
      manifestVersion: data.manifestVersion,
      registryVersion: data.registryVersion,
      source: data.source,
      integrityHash: data.integrityHash,
      status: 'active',
      loadedAt: now,
      metadata: { toolCount: data.tools.length, source: 'local-seed', validatedAt: now },
      createdAt: now,
      updatedAt: now,
    };

    if (!existing) {
      await this.store.saveToolManifestRecord(record);
    }

    const tools: ToolDefinitionShape[] = [];
    for (const tool of data.tools) {
      const def: ToolDefinitionShape = {
        id: randomUUID() as ToolDefinitionShape['id'],
        manifestId: record.id,
        toolKey: tool.toolKey,
        displayName: tool.displayName,
        description: tool.description,
        category: tool.category,
        riskLevel: tool.riskLevel,
        implementationId: tool.implementationId,
        readOnly: tool.readOnly,
        remediation: tool.remediation,
        approvalRequired: tool.approvalRequired,
        requiredPermission: tool.requiredPermission,
        requiredPrivilege: tool.requiredPrivilege,
        dryRunCapable: tool.dryRunCapable,
        commandTemplateId: tool.commandTemplateId,
        supportedPlatforms: tool.supportedPlatforms,
        inputSchema: tool.inputSchema ?? {},
        outputSchema: tool.outputSchema ?? {},
        enabled: tool.enabled,
        createdAt: now,
        updatedAt: now,
      };
      await this.store.saveToolDefinition(def);
      tools.push(def);
    }

    return { record, tools };
  }

  async getManifest(id: string): Promise<ToolManifestRecordShape | undefined> {
    return this.store.getToolManifestRecord(id);
  }

  async listManifests(): Promise<ToolManifestRecordShape[]> {
    return this.store.listToolManifestRecords();
  }

  async getToolDefinition(id: string): Promise<ToolDefinitionShape | undefined> {
    return this.store.getToolDefinition(id);
  }

  async getToolByKey(toolKey: string): Promise<ToolDefinitionShape | undefined> {
    return this.store.getToolDefinitionByKey(toolKey);
  }

  async listTools(options?: { manifestId?: string; enabled?: boolean; category?: string }): Promise<ToolDefinitionShape[]> {
    return this.store.listToolDefinitions(options);
  }
}
