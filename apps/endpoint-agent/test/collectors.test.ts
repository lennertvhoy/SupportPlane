import { describe, it } from 'node:test';
import assert from 'node:assert';
import { collectDisk, collectInventory, collectNetwork, pingSelf, runFixedDiagnostic } from '../src/collectors.js';

describe('endpoint-agent read-only collectors', () => {
  it('collects inventory without mutation', async () => {
    const inventory = await collectInventory();
    assert.strictEqual(inventory.readOnly, true);
    assert.ok(inventory.hostname);
    assert.ok(inventory.agentVersion);
  });

  it('collects disk and network summaries', async () => {
    const disk = await collectDisk();
    const network = await collectNetwork();
    assert.strictEqual(disk.readOnly, true);
    assert.strictEqual(network.readOnly, true);
    assert.ok(Array.isArray(disk.volumes));
    assert.ok(Array.isArray(network.interfaces));
  });

  it('dispatches only fixed diagnostic commands', async () => {
    assert.strictEqual((await runFixedDiagnostic('ping_self')).kind, 'status');
    assert.strictEqual((await pingSelf()).readOnly, true);
    await assert.rejects(() => runFixedDiagnostic('rm -rf /'), /Unsupported fixed diagnostic command/);
  });
});
