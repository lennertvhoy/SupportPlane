import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  computeManifestIntegrityHash,
  filterToolsByPlatform,
  validateLocalManifest,
  type LocalToolManifest,
  type ToolDefinition,
} from '../src/index.js';

function makeTool(
  toolKey: string,
  supportedPlatforms: ToolDefinition['supportedPlatforms'],
): Pick<ToolDefinition, 'toolKey' | 'supportedPlatforms'> {
  return { toolKey, supportedPlatforms };
}

describe('tool manifest compatibility metadata', () => {
  it('filters tools by normalized platform compatibility', () => {
    const tools = [
      makeTool('diagnostic.status', ['linux', 'win32', 'darwin']),
      makeTool('diagnostic.software', ['win32']),
      makeTool('diagnostic.experimental', []),
    ];

    assert.deepStrictEqual(
      filterToolsByPlatform(tools, 'win32').map((tool) => tool.toolKey),
      ['diagnostic.status', 'diagnostic.software', 'diagnostic.experimental'],
    );
    assert.deepStrictEqual(
      filterToolsByPlatform(tools, 'linux').map((tool) => tool.toolKey),
      ['diagnostic.status', 'diagnostic.experimental'],
    );
    assert.deepStrictEqual(filterToolsByPlatform(tools, 'unknown'), []);
  });

  it('rejects manifest executable fields instead of accepting command interpolation', () => {
    const manifest: LocalToolManifest = {
      manifestVersion: '1.0.0',
      registryVersion: 'test',
      source: 'test',
      integrityHash: 'placeholder',
      tools: [
        {
          toolKey: 'diagnostic.bad',
          displayName: 'Bad Diagnostic',
          category: 'diagnostics',
          riskLevel: 'read_only',
          implementationId: 'collect_inventory',
          readOnly: true,
          remediation: false,
          approvalRequired: false,
          requiredPermission: 'endpoint_command:create',
          supportedPlatforms: ['win32'],
          inputSchema: { shell: 'powershell whoami' },
          outputSchema: {},
          enabled: true,
        },
      ],
    };
    manifest.integrityHash = computeManifestIntegrityHash(manifest);

    const result = validateLocalManifest(manifest);
    assert.strictEqual(result.valid, false);
    if (!result.valid) {
      assert.ok(result.errors.some((error) => error.includes('forbidden field: shell')));
    }
  });
});
