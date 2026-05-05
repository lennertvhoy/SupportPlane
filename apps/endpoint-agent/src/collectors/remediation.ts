import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface CommandExecutionResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export type CommandRunner = (file: string, args: string[]) => Promise<CommandExecutionResult>;

interface FixedCommandTemplate {
  commandTemplateId: string;
  platform: 'linux' | 'win32';
  executable: string;
  args: string[];
}

const SUMMARY_LIMIT = 1200;

export const WINDOWS_FLUSH_DNS_TEMPLATE: FixedCommandTemplate = {
  commandTemplateId: 'windows.ipconfig.flushdns.v1',
  platform: 'win32',
  executable: 'ipconfig',
  args: ['/flushdns'],
};

export const LINUX_SYSTEMD_RESOLVED_FLUSH_DNS_TEMPLATE: FixedCommandTemplate = {
  commandTemplateId: 'linux.systemd-resolved.resolvectl-flush-caches.v1',
  platform: 'linux',
  executable: 'resolvectl',
  args: ['flush-caches'],
};

export const defaultCommandRunner: CommandRunner = (file, args) =>
  new Promise((resolve) => {
    execFile(
      file,
      args,
      { windowsHide: true, timeout: 30_000, maxBuffer: 64 * 1024 },
      (error, stdout, stderr) => {
        const code = (error as NodeJS.ErrnoException | null)?.code;
        const exitCode = typeof code === 'number' ? code : error ? 1 : 0;
        resolve({ exitCode, stdout, stderr });
      },
    );
  });

export function summarizeOutput(value: string): string {
  const normalized = value.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= SUMMARY_LIMIT) return normalized;
  return `${normalized.slice(0, SUMMARY_LIMIT)}... [truncated ${normalized.length - SUMMARY_LIMIT} chars]`;
}

function formatResult(template: FixedCommandTemplate, result: CommandExecutionResult) {
  const exitCode = result.exitCode ?? 1;
  return {
    ok: exitCode === 0,
    resultStatus: exitCode === 0 ? 'succeeded' : 'failed',
    platform: template.platform,
    commandTemplateId: template.commandTemplateId,
    commandTemplate: {
      executable: template.executable,
      args: template.args,
      userInputUsed: false,
    },
    exitCode,
    stdoutSummary: summarizeOutput(result.stdout),
    stderrSummary: summarizeOutput(result.stderr),
    stdoutBytes: Buffer.byteLength(result.stdout),
    stderrBytes: Buffer.byteLength(result.stderr),
    readOnly: false,
    unsupported: false,
  };
}

export async function executeFixedTemplate(
  template: FixedCommandTemplate,
  runner: CommandRunner = defaultCommandRunner,
) {
  const result = await runner(template.executable, [...template.args]);
  return formatResult(template, result);
}

async function findExecutable(name: string): Promise<string | undefined> {
  const pathValue = process.env['PATH'] ?? '';
  for (const entry of pathValue.split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(entry, name);
    try {
      await fs.access(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // keep scanning PATH
    }
  }
  return undefined;
}

export async function executeLinuxSystemdResolvedFlushDns(
  runner: CommandRunner = defaultCommandRunner,
) {
  const resolvectl = await findExecutable(LINUX_SYSTEMD_RESOLVED_FLUSH_DNS_TEMPLATE.executable);
  if (!resolvectl) {
    return {
      ok: false,
      resultStatus: 'unsupported',
      platform: 'linux',
      commandTemplateId: LINUX_SYSTEMD_RESOLVED_FLUSH_DNS_TEMPLATE.commandTemplateId,
      note: 'systemd-resolved flush is unsupported because resolvectl is not available on PATH.',
      unsupported: true,
      readOnly: false,
    };
  }
  return executeFixedTemplate(
    { ...LINUX_SYSTEMD_RESOLVED_FLUSH_DNS_TEMPLATE, executable: resolvectl },
    runner,
  );
}
