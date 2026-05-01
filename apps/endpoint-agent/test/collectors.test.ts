import { describe, it } from 'node:test';
import assert from 'node:assert';
import { collectInventory, collectNetwork, pingSelf, runFixedDiagnostic } from '../src/collectors/index.js';
import * as linux from '../src/collectors/linux.js';
import * as win32 from '../src/collectors/win32.js';
import * as darwin from '../src/collectors/darwin.js';
import { getAgentPlatform, normalizePlatform, platformDisplayLabel } from '../src/platform.js';

describe('endpoint-agent read-only collectors', () => {
  it('collects inventory without mutation', async () => {
    const inventory = await collectInventory();
    assert.strictEqual(inventory.readOnly, true);
    assert.ok(inventory.hostname);
    assert.ok(inventory.agentVersion);
  });

  it('collects network summary', async () => {
    const network = await collectNetwork();
    assert.strictEqual(network.readOnly, true);
    assert.ok(Array.isArray(network.interfaces));
  });

  it('dispatches only fixed diagnostic commands', async () => {
    assert.strictEqual((await runFixedDiagnostic('ping_self')).kind, 'status');
    assert.strictEqual((await pingSelf()).readOnly, true);
    await assert.rejects(() => runFixedDiagnostic('rm -rf /'), /Unsupported fixed diagnostic command/);
  });
});

describe('platform provider', () => {
  it('returns a recognized platform or unknown', () => {
    const platform = getAgentPlatform();
    assert.ok(['linux', 'win32', 'darwin', 'unknown'].includes(platform));
  });

  it('normalizes platform strings correctly', () => {
    assert.strictEqual(normalizePlatform('linux'), 'linux');
    assert.strictEqual(normalizePlatform('Linux'), 'linux');
    assert.strictEqual(normalizePlatform('win32'), 'win32');
    assert.strictEqual(normalizePlatform('Windows'), 'win32');
    assert.strictEqual(normalizePlatform('darwin'), 'darwin');
    assert.strictEqual(normalizePlatform('macOS'), 'darwin');
    assert.strictEqual(normalizePlatform('MacOS'), 'darwin');
    assert.strictEqual(normalizePlatform('freebsd'), 'unknown');
  });

  it('returns display labels', () => {
    assert.strictEqual(platformDisplayLabel('linux'), 'Linux');
    assert.strictEqual(platformDisplayLabel('win32'), 'Windows');
    assert.strictEqual(platformDisplayLabel('darwin'), 'macOS');
    assert.strictEqual(platformDisplayLabel('unknown'), 'Unknown');
  });
});

describe('platform-specific collectors', () => {
  it('linux disk collector returns volumes', async () => {
    const disk = await linux.collectDisk();
    assert.strictEqual(disk.readOnly, true);
    assert.ok(Array.isArray(disk.volumes));
  });

  it('linux services collector returns processes array', async () => {
    const services = await linux.collectServices();
    assert.strictEqual(services.readOnly, true);
    assert.ok(Array.isArray(services.processes));
  });

  it('win32 disk collector returns volumes', async () => {
    const disk = await win32.collectDisk();
    assert.strictEqual(disk.readOnly, true);
    assert.ok(Array.isArray(disk.volumes));
  });

  it('win32 services collector reports unsupported', async () => {
    const services = await win32.collectServices();
    assert.strictEqual(services.unsupported, true);
    assert.ok(services.note.includes('Windows'));
  });

  it('darwin services collector reports unsupported', async () => {
    const services = await darwin.collectServices();
    assert.strictEqual(services.unsupported, true);
    assert.ok(services.note.includes('macOS'));
  });

  it('all remediation collectors return unsupported with honest notes', async () => {
    for (const [name, mod] of Object.entries({ linux, win32, darwin })) {
      const flush = await mod.flushDnsCache();
      const clear = await mod.clearTempPreview();
      assert.strictEqual(flush.unsupported, true, `${name} flushDnsCache should be unsupported`);
      assert.strictEqual(clear.unsupported, true, `${name} clearTempPreview should be unsupported`);
    }
  });
});
