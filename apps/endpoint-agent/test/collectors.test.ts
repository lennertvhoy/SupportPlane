import { describe, it } from 'node:test';
import assert from 'node:assert';
import { collectInventory, collectNetwork, pingSelf, runFixedDiagnostic } from '../src/collectors/index.js';
import * as linux from '../src/collectors/linux.js';
import * as win32 from '../src/collectors/win32.js';
import * as darwin from '../src/collectors/darwin.js';
import { getWindowsReadonlyCommandTemplate, WINDOWS_READONLY_COMMANDS } from '../src/collectors/windows-command-runner.js';
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
    assert.strictEqual((await runFixedDiagnostic('collect_software')).kind, 'software');
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

  it('win32 services collector reports unsupported on non-Windows hosts', async () => {
    const services = await win32.collectServices();
    assert.strictEqual(services.unsupported, true);
    assert.ok(services.note.includes('Windows'));
  });

  it('win32 software collector reports unsupported on non-Windows hosts', async () => {
    const software = await win32.collectSoftware();
    assert.strictEqual(software.unsupported, true);
    assert.ok(software.note.includes('Windows'));
  });

  it('linux and darwin software collectors return honest unsupported responses', async () => {
    for (const [name, mod] of Object.entries({ linux, darwin })) {
      const software = await mod.collectSoftware();
      assert.strictEqual(software.unsupported, true, `${name} collectSoftware should be unsupported`);
      assert.strictEqual(software.readOnly, true);
    }
  });

  it('darwin services collector reports unsupported', async () => {
    const services = await darwin.collectServices();
    assert.strictEqual(services.unsupported, true);
    assert.ok(services.note.includes('macOS'));
  });

  it('Windows flush DNS uses only the fixed command template and records output summaries', async () => {
    const calls: Array<{ file: string; args: string[] }> = [];
    const flush = await win32.flushDnsCache(async (file, args) => {
      calls.push({ file, args });
      return { exitCode: 0, stdout: 'Successfully flushed the DNS Resolver Cache.', stderr: '' };
    });

    assert.deepStrictEqual(calls, [{ file: 'ipconfig', args: ['/flushdns'] }]);
    assert.strictEqual(flush.commandTemplateId, 'windows.ipconfig.flushdns.v1');
    assert.deepStrictEqual(flush.commandTemplate, { executable: 'ipconfig', args: ['/flushdns'], userInputUsed: false });
    assert.strictEqual(flush.exitCode, 0);
    assert.strictEqual(flush.resultStatus, 'succeeded');
    assert.ok(String(flush.stdoutSummary).includes('Successfully flushed'));
    assert.strictEqual(flush.stderrSummary, '');
    assert.strictEqual(flush.readOnly, false);
  });

  it('Linux flush DNS is unsupported when systemd-resolved tooling is not available', async () => {
    const originalPath = process.env['PATH'];
    process.env['PATH'] = '';
    try {
      const flush = await linux.flushDnsCache();
      assert.strictEqual(flush.unsupported, true);
      assert.strictEqual(flush.resultStatus, 'unsupported');
      assert.strictEqual(flush.commandTemplateId, 'linux.systemd-resolved.resolvectl-flush-caches.v1');
    } finally {
      process.env['PATH'] = originalPath;
    }
  });

  it('macOS remediation remains unsupported in this architecture slice', async () => {
    const flush = await darwin.flushDnsCache();
    const clear = await darwin.clearTempPreview();
    assert.strictEqual(flush.unsupported, true);
    assert.strictEqual(clear.unsupported, true);
  });
});

describe('win32 parser fixtures and command templates', () => {
  it('parses sc.exe service query output', () => {
    const services = win32.parseScQueryOutput(`
SERVICE_NAME: EventLog
DISPLAY_NAME: Windows Event Log
        TYPE               : 30  WIN32
        STATE              : 4  RUNNING

SERVICE_NAME: Spooler
DISPLAY_NAME: Print Spooler
        TYPE               : 110  WIN32_OWN_PROCESS
        STATE              : 1  STOPPED
`);

    assert.deepStrictEqual(services, [
      { serviceName: 'EventLog', displayName: 'Windows Event Log', type: '30  WIN32', state: 'RUNNING' },
      { serviceName: 'Spooler', displayName: 'Print Spooler', type: '110  WIN32_OWN_PROCESS', state: 'STOPPED' },
    ]);
  });

  it('parses reg.exe uninstall output into installed software entries', () => {
    const software = win32.parseRegistryUninstallOutput(`
HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SupportPlane
    DisplayName    REG_SZ    SupportPlane Agent
    DisplayVersion    REG_SZ    0.1.0
    Publisher    REG_SZ    SupportPlane
    InstallDate    REG_SZ    20260501

HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\NoDisplayName
    Publisher    REG_SZ    Ignored Vendor

HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Node
    DisplayName    REG_SZ    Node.js
    DisplayVersion    REG_SZ    22.0.0
`);

    assert.strictEqual(software.length, 2);
    assert.deepStrictEqual(software[0], {
      name: 'SupportPlane Agent',
      version: '0.1.0',
      publisher: 'SupportPlane',
      installDate: '20260501',
      uninstallKey: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SupportPlane',
    });
    assert.strictEqual(software[1]?.name, 'Node.js');
  });

  it('uses fixed Windows command templates without shell interpolation fields', () => {
    for (const [name, template] of Object.entries(WINDOWS_READONLY_COMMANDS)) {
      assert.ok(['sc.exe', 'reg.exe'].includes(template.executable), `${name} executable is fixed`);
      assert.ok(Object.isFrozen(template.args) === false || Array.isArray(template.args));
      assert.ok(!template.args.some((arg) => /[;&|`$<>]/.test(arg)), `${name} args contain no shell metacharacters`);
      assert.strictEqual((template as Record<string, unknown>).shell, undefined);
    }

    const services = getWindowsReadonlyCommandTemplate('services');
    assert.deepStrictEqual(services.args, ['query', 'type=', 'service', 'state=', 'all']);
  });
});
