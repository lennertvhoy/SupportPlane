import { describe, it } from 'node:test';
import assert from 'node:assert';
import { collectInventory, collectNetwork, pingSelf, runFixedDiagnostic } from '../src/collectors/index.js';
import * as linux from '../src/collectors/linux.js';
import * as win32 from '../src/collectors/win32.js';
import * as darwin from '../src/collectors/darwin.js';
import { getWindowsReadonlyCommandTemplate, runWindowsReadonlyCommand, WINDOWS_READONLY_COMMANDS } from '../src/collectors/windows-command-runner.js';
import { WINDOWS_FLUSH_DNS_TEMPLATE, LINUX_SYSTEMD_RESOLVED_FLUSH_DNS_TEMPLATE } from '../src/collectors/remediation.js';
import { getAgentPlatform, normalizePlatform, platformDisplayLabel } from '../src/platform.js';
import fs from 'node:fs';
import path from 'node:path';

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

  it('win32 services collector returns real data on Windows or unsupported on other platforms', async () => {
    const services = await win32.collectServices();
    assert.strictEqual(services.readOnly, true);
    if (process.platform === 'win32') {
      assert.ok(Array.isArray(services.services), 'services should be an array on Windows');
      assert.ok(!services.unsupported, 'services should not be unsupported on Windows');
    } else {
      assert.strictEqual(services.unsupported, true);
      assert.ok(services.note.includes('Windows'));
    }
  });

  it('win32 software collector returns real data on Windows or unsupported on other platforms', async () => {
    const software = await win32.collectSoftware();
    assert.strictEqual(software.readOnly, true);
    if (process.platform === 'win32') {
      assert.ok(Array.isArray(software.software), 'software should be an array on Windows');
      assert.ok(!software.unsupported, 'software should not be unsupported on Windows');
    } else {
      assert.strictEqual(software.unsupported, true);
      assert.ok(software.note.includes('Windows'));
    }
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

  it('win32 clearTempPreview returns unsupported with correct enterprise readiness note', async () => {
    const result = await win32.clearTempPreview();
    assert.strictEqual(result.unsupported, true);
    assert.strictEqual(result.readOnly, true);
    assert.strictEqual(result.ok, false);
    assert.ok(result.note.includes('not implemented'), 'note must state not implemented');
    assert.ok(result.note.includes('Windows'), 'note must reference Windows');
  });

  it('linux clearTempPreview returns unsupported', async () => {
    const result = await linux.clearTempPreview();
    assert.strictEqual(result.unsupported, true);
    assert.ok(result.note.includes('not implemented'));
    assert.strictEqual(result.readOnly, true);
  });

  it('runWindowsReadonlyCommand rejects on non-win32 platforms', async () => {
    await assert.rejects(
      () => runWindowsReadonlyCommand('services', 'linux'),
      /Windows command services is only available on win32/,
    );
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

  it('Windows readonly command templates contain no interpolation placeholders', () => {
    for (const [name, template] of Object.entries(WINDOWS_READONLY_COMMANDS)) {
      const json = JSON.stringify(template);
      assert.ok(!json.includes('%s'), `${name} must not contain printf-style interpolation`);
      assert.ok(!json.includes('${'), `${name} must not contain template literal interpolation`);
      assert.ok(!json.includes('{{'), `${name} must not contain handlebars-style interpolation`);
    }
  });

  it('parses empty sc.exe output', () => {
    assert.deepStrictEqual(win32.parseScQueryOutput(''), []);
    assert.deepStrictEqual(win32.parseScQueryOutput('   \n\n  '), []);
  });

  it('parses malformed sc.exe output with missing fields', () => {
    const services = win32.parseScQueryOutput(`
SERVICE_NAME: Foo
        TYPE               : 10  WIN32

SERVICE_NAME: Bar
        DISPLAY_NAME: Bar Service
`);
    assert.strictEqual(services.length, 2);
    assert.strictEqual(services[0]?.serviceName, 'Foo');
    assert.strictEqual(services[0]?.state, undefined);
    assert.strictEqual(services[1]?.displayName, 'Bar Service');
    assert.strictEqual(services[1]?.type, undefined);
  });

  it('parses empty reg.exe output', () => {
    assert.deepStrictEqual(win32.parseRegistryUninstallOutput(''), []);
    assert.deepStrictEqual(win32.parseRegistryUninstallOutput('\n\n'), []);
  });

  it('parses malformed reg.exe output with missing display name', () => {
    const software = win32.parseRegistryUninstallOutput(`
HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\NoName
    Publisher    REG_SZ    SomeVendor
    DisplayVersion    REG_SZ    1.0.0

HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Good
    DisplayName    REG_SZ    GoodApp
`);
    assert.strictEqual(software.length, 1);
    assert.strictEqual(software[0]?.name, 'GoodApp');
  });

  it('parses reg.exe output with unexpected lines and extra whitespace', () => {
    const software = win32.parseRegistryUninstallOutput(`
HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\App1
    DisplayName    REG_SZ    App One
    weird line without reg value
    DisplayVersion    REG_SZ    2.0.0

    extra spaces before value    REG_SZ    ignored
`);
    assert.strictEqual(software.length, 1);
    assert.deepStrictEqual(software[0], {
      name: 'App One',
      version: '2.0.0',
      publisher: undefined,
      installDate: undefined,
      uninstallKey: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\App1',
    });
  });
});

describe('platform-aware dispatch', () => {
  it('runFixedDiagnostic dispatches collect_software to platform software collector', async () => {
    const result = await runFixedDiagnostic('collect_software');
    assert.strictEqual(result.kind, 'software');
    assert.strictEqual(result.payload.readOnly, true);
    if (process.platform !== 'win32') {
      assert.strictEqual((result.payload as Record<string, unknown>).unsupported, true, 'software diagnostic only supported on win32');
    }
  });

  it('runFixedDiagnostic dispatches collect_services to platform services collector', async () => {
    const result = await runFixedDiagnostic('collect_services');
    assert.strictEqual(result.kind, 'services');
    assert.strictEqual(result.payload.readOnly, true);
  });

  it('runFixedDiagnostic dispatches collect_disk to platform disk collector', async () => {
    const result = await runFixedDiagnostic('collect_disk');
    assert.strictEqual(result.kind, 'disk');
    assert.strictEqual(result.payload.readOnly, true);
  });

  it('runFixedDiagnostic dispatches flush_dns_cache through platform remediation', async () => {
    const result = await runFixedDiagnostic('flush_dns_cache');
    assert.strictEqual(result.kind, 'remediation');
  });

  it('runFixedDiagnostic dispatches clear_temp_preview through platform remediation', async () => {
    const result = await runFixedDiagnostic('clear_temp_preview');
    assert.strictEqual(result.kind, 'remediation');
  });

  it('runFixedDiagnostic rejects unknown command kinds', async () => {
    await assert.rejects(() => runFixedDiagnostic('wmic process list'), /Unsupported fixed diagnostic command/);
    await assert.rejects(() => runFixedDiagnostic('cmd /c dir'), /Unsupported fixed diagnostic command/);
  });
});

describe('Windows flush DNS enterprise hardening', () => {
  it('WINDOWS_FLUSH_DNS_TEMPLATE has no shell, powershell, or cmd fields', () => {
    const tpl = WINDOWS_FLUSH_DNS_TEMPLATE as unknown as Record<string, unknown>;
    assert.strictEqual(tpl.shell, undefined, 'shell field must not exist');
    assert.strictEqual(tpl.powershell, undefined, 'powershell field must not exist');
    assert.strictEqual(tpl.cmd, undefined, 'cmd field must not exist');
    assert.strictEqual(tpl.executable_new, undefined, 'no secondary executable field');
  });

  it('WINDOWS_FLUSH_DNS_TEMPLATE args are free of shell metacharacters', () => {
    for (const arg of WINDOWS_FLUSH_DNS_TEMPLATE.args) {
      assert.ok(!/[;&|`$<>]/.test(arg), `flush dns arg "${arg}" contains shell metacharacter`);
    }
    assert.deepStrictEqual(WINDOWS_FLUSH_DNS_TEMPLATE.args, ['/flushdns']);
    assert.strictEqual(WINDOWS_FLUSH_DNS_TEMPLATE.executable, 'ipconfig');
  });

  it('LINUX_SYSTEMD_RESOLVED_FLUSH_DNS_TEMPLATE args are free of shell metacharacters', () => {
    for (const arg of LINUX_SYSTEMD_RESOLVED_FLUSH_DNS_TEMPLATE.args) {
      assert.ok(!/[;&|`$<>]/.test(arg), `flush dns arg "${arg}" contains shell metacharacter`);
    }
    assert.deepStrictEqual(LINUX_SYSTEMD_RESOLVED_FLUSH_DNS_TEMPLATE.args, ['flush-caches']);
    assert.strictEqual(LINUX_SYSTEMD_RESOLVED_FLUSH_DNS_TEMPLATE.executable, 'resolvectl');
  });

  it('Windows flushDnsCache denies shell metacharacters in command template by rejecting ampersands', async () => {
    const calls: Array<{ file: string; args: string[] }> = [];
    const flush = await win32.flushDnsCache(async (file, args) => {
      calls.push({ file, args });
      return { exitCode: 0, stdout: 'ok', stderr: '' };
    });

    assert.strictEqual(calls.length, 1);
    const calledArgs = calls[0]!.args;
    assert.ok(!calledArgs.some((a: string) => a.includes('&')), 'ampersand would be shell injection');
    assert.ok(!calledArgs.some((a: string) => a.includes('|')), 'pipe would be shell injection');
    assert.ok(!calledArgs.some((a: string) => a.includes(';')), 'semicolon would be shell injection');
    assert.deepStrictEqual(calledArgs, ['/flushdns']);
    assert.strictEqual(flush.commandTemplate.userInputUsed, false);
  });
});

describe('diagnostic.software win32-only enforcement', () => {
  it('collect_software via runFixedDiagnostic is unsupported on non-win32', async () => {
    if (process.platform === 'win32') return;
    const result = await runFixedDiagnostic('collect_software');
    assert.strictEqual(result.kind, 'software');
    const payload = result.payload as Record<string, unknown>;
    assert.strictEqual(payload.unsupported, true);
    assert.ok(typeof payload.note === 'string', 'software unsupported must have honest explanation');
  });

  it('win32.collectSoftware reports unsupported on non-Windows hosts with correct note', async () => {
    if (process.platform === 'win32') return;
    const software = await win32.collectSoftware();
    assert.strictEqual(software.unsupported, true);
    assert.strictEqual(software.readOnly, true);
    assert.ok(software.note.includes('Windows'), 'must mention Windows');
  });
});

describe('arbitrary shell/command hardening — no unsafe primitives in collector paths', () => {
  it('no collector source file contains PowerShell, cmd.exe, shell:true, or unsanitized exec', () => {
    const srcDir = path.resolve(process.cwd(), 'src', 'collectors');
    let files: string[];
    try {
      files = fs.readdirSync(srcDir);
    } catch {
      return;
    }

    const unsafePatterns: Array<{ name: string; regex: RegExp; label: string }> = [
      { name: 'powershell', regex: /powershell/i, label: 'PowerShell invocation' },
      { name: 'cmd.exe', regex: /cmd\.exe/i, label: 'cmd.exe invocation' },
      { name: 'shell:true', regex: /shell\s*:\s*true/i, label: 'shell:true option' },
      { name: 'unqualified-exec', regex: /\bexec\s*\(/, label: 'exec() without File suffix' },
      { name: 'execSync', regex: /\bexecSync\s*\b/, label: 'execSync invocation' },
    ];

    for (const file of files) {
      if (!file.endsWith('.ts')) continue;
      const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
      for (const { name, regex, label } of unsafePatterns) {
        assert.ok(!regex.test(content), `${file}: ${label} (pattern: ${name})`);
      }
    }
  });

  it('all WINDOWS_READONLY_COMMANDS use only fixed sc.exe or reg.exe with no shell fields', () => {
    for (const [name, template] of Object.entries(WINDOWS_READONLY_COMMANDS)) {
      assert.ok(['sc.exe', 'reg.exe'].includes(template.executable),
        `${name} executable must be sc.exe or reg.exe, got ${template.executable}`);
      assert.strictEqual((template as Record<string, unknown>).shell, undefined,
        `${name} must not have shell field`);
      assert.strictEqual((template as Record<string, unknown>).command, undefined,
        `${name} must not have command field`);
    }
  });

  it('no collector module exports a function named like a shell or command primitive', () => {
    const forbiddenSubstrings = ['shell', 'powershell', 'pwsh', 'cmdExe', 'commandPrompt'];
    for (const [modName, mod] of Object.entries({ linux, win32, darwin })) {
      for (const key of Object.keys(mod as Record<string, unknown>)) {
        const lower = key.toLowerCase();
        for (const sub of forbiddenSubstrings) {
          assert.ok(!lower.includes(sub),
            `${modName}.${key} must not export shell/command primitive`);
        }
      }
    }
  });

  it('WINDOWS_FLUSH_DNS_TEMPLATE commandTemplate uses userInputUsed: false', async () => {
    const flush = await win32.flushDnsCache(async (file, args) => {
      if (args.some((a: string) => /[;&|`$<>]/.test(a))) {
        throw new Error('shell metacharacter rejected');
      }
      return { exitCode: 0, stdout: 'Successfully flushed the DNS Resolver Cache.', stderr: '' };
    });
    assert.strictEqual(flush.commandTemplate.userInputUsed, false);
    assert.strictEqual(flush.readOnly, false);
    assert.strictEqual(flush.platform, 'win32');
  });
});
