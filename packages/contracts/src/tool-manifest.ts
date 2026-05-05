import { z } from 'zod';
import { EntityId, Timestamp, JsonValue } from './base.js';
import { EndpointPlatform } from './endpoint-agent.js';

export const ToolManifestRecordId = EntityId.brand<'ToolManifestRecordId'>();
export type ToolManifestRecordId = z.infer<typeof ToolManifestRecordId>;

export const ToolDefinitionId = EntityId.brand<'ToolDefinitionId'>();
export type ToolDefinitionId = z.infer<typeof ToolDefinitionId>;

export const ToolManifestStatus = z.enum(['active', 'rejected', 'disabled']);
export type ToolManifestStatus = z.infer<typeof ToolManifestStatus>;

export const ToolRiskLevel = z.enum([
  'read_only',
  'low_risk_remediation',
  'elevated_remediation',
  'blocked',
  'unsupported',
]);
export type ToolRiskLevel = z.infer<typeof ToolRiskLevel>;

export const ToolCategory = z.enum([
  'diagnostics',
  'network',
  'service',
  'cache',
  'ticket_note',
  'system',
]);
export type ToolCategory = z.infer<typeof ToolCategory>;

export const ToolManifestRecord = z.object({
  id: ToolManifestRecordId,
  manifestVersion: z.string().min(1).max(80),
  registryVersion: z.string().min(1).max(80),
  source: z.string().min(1).max(512),
  integrityHash: z.string().min(1).max(512),
  status: ToolManifestStatus,
  loadedAt: Timestamp,
  metadata: z.record(JsonValue).default({}),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type ToolManifestRecord = z.infer<typeof ToolManifestRecord>;

export const ToolDefinition = z.object({
  id: ToolDefinitionId,
  manifestId: ToolManifestRecordId,
  toolKey: z.string().min(1).max(128),
  displayName: z.string().min(1).max(160),
  description: z.string().max(1024).optional(),
  category: ToolCategory,
  riskLevel: ToolRiskLevel,
  implementationId: z.string().min(1).max(128),
  readOnly: z.boolean().default(true),
  remediation: z.boolean().default(false),
  approvalRequired: z.boolean().default(false),
  requiredPermission: z.string().min(1).max(128).default('endpoint_command:create'),
  requiredPrivilege: z.enum(['user', 'local_admin', 'system']).default('user'),
  dryRunCapable: z.boolean().default(false),
  commandTemplateId: z.string().min(1).max(128).optional(),
  supportedPlatforms: z.array(EndpointPlatform).default([]),
  inputSchema: z.record(JsonValue).default({}),
  outputSchema: z.record(JsonValue).default({}),
  enabled: z.boolean().default(true),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type ToolDefinition = z.infer<typeof ToolDefinition>;

// Local seed manifest for dev/sandbox
export const LocalToolManifest = z.object({
  manifestVersion: z.string(),
  registryVersion: z.string(),
  source: z.string(),
  integrityHash: z.string(),
  tools: z.array(
    z.object({
      toolKey: z.string(),
      displayName: z.string(),
      description: z.string().optional(),
      category: ToolCategory,
      riskLevel: ToolRiskLevel,
      implementationId: z.string(),
      readOnly: z.boolean(),
      remediation: z.boolean(),
      approvalRequired: z.boolean(),
      requiredPermission: z.string(),
      requiredPrivilege: z.enum(['user', 'local_admin', 'system']).default('user'),
      dryRunCapable: z.boolean().default(false),
      commandTemplateId: z.string().optional(),
      supportedPlatforms: z.array(EndpointPlatform),
      inputSchema: z.record(JsonValue).optional(),
      outputSchema: z.record(JsonValue).optional(),
      enabled: z.boolean(),
    }),
  ),
});
export type LocalToolManifest = z.infer<typeof LocalToolManifest>;

// Validation rules
export const FORBIDDEN_MANIFEST_FIELDS = [
  'command',
  'shell',
  'script',
  'argv',
  'executable',
  'program',
  'body',
  'exec',
];

export function filterToolsByPlatform<T extends { supportedPlatforms: EndpointPlatform[] }>(
  tools: readonly T[],
  platform: EndpointPlatform,
): T[] {
  if (platform === 'unknown') return [];
  return tools.filter(
    (tool) => tool.supportedPlatforms.length === 0 || tool.supportedPlatforms.includes(platform),
  );
}

export function computeManifestIntegrityHash(
  manifest: Omit<LocalToolManifest, 'integrityHash'>,
): string {
  const copy = { ...manifest };
  delete (copy as Partial<LocalToolManifest>).integrityHash;
  const canonical = JSON.stringify(copy, Object.keys(copy).sort());
  let hash = 0;
  for (let i = 0; i < canonical.length; i++) {
    const char = canonical.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `local-hash-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export function validateLocalManifest(
  manifest: unknown,
): { valid: true; data: LocalToolManifest } | { valid: false; errors: string[] } {
  const parsed = LocalToolManifest.safeParse(manifest);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  }
  const data = parsed.data;
  const errors: string[] = [];

  // Reject manifests containing executable/script fields anywhere
  const manifestStr = JSON.stringify(data);
  for (const field of FORBIDDEN_MANIFEST_FIELDS) {
    if (manifestStr.includes(`"${field}"`)) {
      errors.push(`Manifest contains forbidden field: ${field}`);
    }
  }

  // Validate integrity hash
  const computed = computeManifestIntegrityHash(data);
  if (data.integrityHash !== computed) {
    errors.push(`Integrity hash mismatch: expected ${computed}, got ${data.integrityHash}`);
  }

  // Check duplicate tool keys
  const keys = data.tools.map((t) => t.toolKey);
  const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (duplicates.length > 0) {
    errors.push(`Duplicate tool keys: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Validate risk levels and approval requirements
  for (const tool of data.tools) {
    if (!ToolRiskLevel.options.includes(tool.riskLevel)) {
      errors.push(`Unknown risk level for ${tool.toolKey}: ${tool.riskLevel}`);
    }
    if (tool.remediation && tool.approvalRequired === false) {
      errors.push(
        `Remediation tool ${tool.toolKey} must require approval unless explicitly exempted`,
      );
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, data };
}
