import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ConnectorRuntimeConfigSchema,
  ConnectorRuntimeConfigValidationResult,
  ConnectorRuntimeReadinessResult,
  ConnectorRuntimeCredentialReferenceMetadata,
  ConnectorRuntimeResolverResult,
  ConnectorConfigSchemaResponse,
} from '../src/connector-runtime.js';

describe('connector runtime contracts', () => {
  it('accepts safe mock-only config schema', () => {
    const parsed = ConnectorRuntimeConfigSchema.safeParse({
      mockMode: true,
      enabled: true,
      validateBeforeWrite: true,
      timeoutMs: 5000,
      capabilities: ['read_tickets'],
      baseUrlPlaceholder: 'mock-zammad',
    });
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.mockMode, true);
      assert.strictEqual(parsed.data.enabled, true);
      assert.deepStrictEqual(parsed.data.capabilities, ['read_tickets']);
    }
  });

  it('accepts mockMode false for real sandbox mode', () => {
    const parsed = ConnectorRuntimeConfigSchema.safeParse({
      mockMode: false,
      enabled: true,
      baseUrl: 'http://zammad.local:3000',
      apiToken: 'test-token',
    });
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.mockMode, false);
    }
  });

  it('accepts a valid mock config validation result', () => {
    const result = ConnectorRuntimeConfigValidationResult.parse({
      valid: true,
      mockMode: true,
      realNetwork: false,
      writebackEnabled: false,
      issues: [],
      warnings: ['All good'],
      timestamp: new Date().toISOString(),
    });
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.realNetwork, false);
    assert.strictEqual(result.writebackEnabled, false);
  });

  it('accepts config validation result with realNetwork true in sandbox mode', () => {
    const parsed = ConnectorRuntimeConfigValidationResult.safeParse({
      valid: true,
      mockMode: false,
      realNetwork: true,
      writebackEnabled: false,
      issues: [],
      warnings: [],
      timestamp: new Date().toISOString(),
    });
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.realNetwork, true);
      assert.strictEqual(parsed.data.writebackEnabled, false);
    }
  });

  it('accepts config validation result with writebackEnabled true at schema level (service layer blocks writeback)', () => {
    const parsed = ConnectorRuntimeConfigValidationResult.safeParse({
      valid: true,
      mockMode: false,
      realNetwork: true,
      writebackEnabled: true,
      issues: [],
      warnings: [],
      timestamp: new Date().toISOString(),
    });
    // Schema allows boolean for forward compatibility; service layer enforces false for BL-107
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.writebackEnabled, true);
    }
  });

  it('accepts a mock-only readiness result', () => {
    const result = ConnectorRuntimeReadinessResult.parse({
      mockReady: true,
      realReady: false,
      sandboxWritebackReady: false,
      productionWritebackReady: false,
      publicReplyEnabled: false,
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
      warnings: ['Mock only'],
      credentialReferencesLinked: true,
      linkedCredentialReferenceCount: 1,
      timestamp: new Date().toISOString(),
    });
    assert.strictEqual(result.mockReady, true);
    assert.strictEqual(result.realReady, false);
    assert.strictEqual(result.sandboxWritebackReady, false);
    assert.strictEqual(result.productionWritebackReady, false);
    assert.strictEqual(result.credentialReferencesLinked, true);
  });

  it('accepts readiness result with sandbox writeback ready', () => {
    const parsed = ConnectorRuntimeReadinessResult.safeParse({
      mockReady: false,
      realReady: true,
      sandboxWritebackReady: true,
      productionWritebackReady: false,
      publicReplyEnabled: false,
      realNetwork: true,
      writebackEnabled: true,
      externalWriteAttempted: false,
      warnings: ['Sandbox real mode'],
      credentialReferencesLinked: false,
      linkedCredentialReferenceCount: 0,
      timestamp: new Date().toISOString(),
    });
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.realReady, true);
      assert.strictEqual(parsed.data.sandboxWritebackReady, true);
      assert.strictEqual(parsed.data.productionWritebackReady, false);
      assert.strictEqual(parsed.data.publicReplyEnabled, false);
      assert.strictEqual(parsed.data.realNetwork, true);
      assert.strictEqual(parsed.data.writebackEnabled, true);
    }
  });

  it('accepts credential reference metadata without secretRef', () => {
    const result = ConnectorRuntimeCredentialReferenceMetadata.parse({
      id: 'cred-1',
      displayName: 'Test Credential',
      kind: 'api_token',
      status: 'active',
      lastValidatedAt: new Date().toISOString(),
      secretResolutionImplemented: false,
    });
    assert.strictEqual(result.secretResolutionImplemented, false);
    assert.strictEqual(result.displayName, 'Test Credential');
  });

  it('accepts credential metadata with secretResolutionImplemented true for future resolver', () => {
    const parsed = ConnectorRuntimeCredentialReferenceMetadata.safeParse({
      id: 'cred-1',
      displayName: 'Test',
      kind: 'api_token',
      status: 'active',
      secretResolutionImplemented: true,
    });
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.secretResolutionImplemented, true);
    }
  });

  it('accepts a mock-only runtime resolver result', () => {
    const result = ConnectorRuntimeResolverResult.parse({
      tenantId: 'tenant-a',
      connectorType: 'zammad',
      installationId: 'inst-1',
      installationDisplayName: 'Zammad Mock',
      capabilities: ['read_tickets'],
      credentialReferences: [
        {
          id: 'cred-1',
          displayName: 'Test Credential',
          kind: 'api_token',
          status: 'active',
          secretResolutionImplemented: false,
        },
      ],
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      sandboxWritebackReady: false,
      productionWritebackReady: false,
      publicReplyEnabled: false,
      externalWriteAttempted: false,
      readiness: {
        mockReady: true,
        realReady: false,
        sandboxWritebackReady: false,
        productionWritebackReady: false,
        publicReplyEnabled: false,
        realNetwork: false,
        writebackEnabled: false,
        externalWriteAttempted: false,
        warnings: [],
        credentialReferencesLinked: true,
        linkedCredentialReferenceCount: 1,
        timestamp: new Date().toISOString(),
      },
    });
    assert.strictEqual(result.mode, 'mock');
    assert.strictEqual(result.credentialReferences.length, 1);
  });

  it('accepts runtime resolver result with mode sandbox for sandbox writeback', () => {
    const parsed = ConnectorRuntimeResolverResult.safeParse({
      tenantId: 'tenant-a',
      connectorType: 'zammad',
      installationId: 'inst-1',
      installationDisplayName: 'Zammad Sandbox',
      capabilities: [],
      credentialReferences: [],
      mode: 'sandbox',
      realNetwork: true,
      writebackEnabled: true,
      sandboxWritebackReady: true,
      productionWritebackReady: false,
      publicReplyEnabled: false,
      externalWriteAttempted: false,
      readiness: {
        mockReady: false,
        realReady: true,
        sandboxWritebackReady: true,
        productionWritebackReady: false,
        publicReplyEnabled: false,
        realNetwork: true,
        writebackEnabled: true,
        externalWriteAttempted: false,
        warnings: [],
        credentialReferencesLinked: false,
        linkedCredentialReferenceCount: 0,
        timestamp: new Date().toISOString(),
      },
    });
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.mode, 'sandbox');
      assert.strictEqual(parsed.data.realNetwork, true);
      assert.strictEqual(parsed.data.writebackEnabled, true);
      assert.strictEqual(parsed.data.sandboxWritebackReady, true);
      assert.strictEqual(parsed.data.productionWritebackReady, false);
    }
  });

  it('accepts config schema response with mockOnly true', () => {
    const result = ConnectorConfigSchemaResponse.parse({
      installationId: 'inst-1',
      schema: {
        type: 'object',
        properties: {},
        required: ['mockMode'],
        additionalProperties: false,
      },
      safeFields: ['mockMode', 'enabled'],
      rejectedFields: ['apiToken', 'password'],
      mockOnly: true,
    });
    assert.strictEqual(result.mockOnly, true);
    assert.deepStrictEqual(result.safeFields, ['mockMode', 'enabled']);
  });

  it('accepts config schema response with mockOnly false for real sandbox', () => {
    const parsed = ConnectorConfigSchemaResponse.safeParse({
      installationId: 'inst-1',
      schema: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
      safeFields: [],
      rejectedFields: [],
      mockOnly: false,
    });
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.mockOnly, false);
    }
  });

  it('evidence bundle connector summary remains secret-free', () => {
    const parsed = ConnectorRuntimeResolverResult.safeParse({
      tenantId: 'tenant-a',
      connectorType: 'zammad',
      installationId: 'inst-1',
      installationDisplayName: 'Zammad',
      capabilities: [],
      credentialReferences: [
        {
          id: 'cred-1',
          displayName: 'Test',
          kind: 'api_token',
          status: 'active',
          secretResolutionImplemented: false,
          secretRef: 'should-not-be-here',
        },
      ],
      mode: 'mock',
      realNetwork: false,
      writebackEnabled: false,
      sandboxWritebackReady: false,
      productionWritebackReady: false,
      publicReplyEnabled: false,
      externalWriteAttempted: false,
      readiness: {
        mockReady: true,
        realReady: false,
        sandboxWritebackReady: false,
        productionWritebackReady: false,
        publicReplyEnabled: false,
        realNetwork: false,
        writebackEnabled: false,
        externalWriteAttempted: false,
        warnings: [],
        credentialReferencesLinked: false,
        linkedCredentialReferenceCount: 0,
        timestamp: new Date().toISOString(),
      },
    });
    // Zod should reject extra properties by default if strict() is used,
    // but the current schema uses plain z.object() which allows extra keys
    // during parsing (they are stripped). We verify stripping behavior:
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(
        (parsed.data.credentialReferences[0] as Record<string, unknown>).secretRef,
        undefined,
        'secretRef must be stripped or undefined'
      );
    }
  });
});
