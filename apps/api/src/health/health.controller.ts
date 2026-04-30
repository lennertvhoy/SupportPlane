import { Controller, Get } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function findGitDir(): string | null {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const gitPath = resolve(dir, '.git');
    if (existsSync(gitPath)) return gitPath;
    dir = resolve(dir, '..');
  }
  return null;
}

function getGitHead(): string | null {
  const envHead = process.env['GIT_HEAD'];
  if (envHead) return envHead;
  try {
    const gitDir = findGitDir();
    if (!gitDir) return null;
    const head = readFileSync(resolve(gitDir, 'HEAD'), 'utf8').trim();
    if (head.startsWith('ref: ')) {
      const refPath = head.slice(5);
      return readFileSync(resolve(gitDir, refPath), 'utf8').trim();
    }
    return head;
  } catch {
    return null;
  }
}

function getBranch(): string | null {
  const envBranch = process.env['GIT_BRANCH'];
  if (envBranch) return envBranch;
  try {
    const gitDir = findGitDir();
    if (!gitDir) return null;
    const head = readFileSync(resolve(gitDir, 'HEAD'), 'utf8').trim();
    if (head.startsWith('ref: ')) {
      return head.slice(5).replace('refs/heads/', '');
    }
    return 'detached';
  } catch {
    return null;
  }
}

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      service: 'supportplane-api',
      version: '0.1.0',
      status: 'ok',
      branch: getBranch(),
      head: getGitHead(),
      timestamp: new Date().toISOString(),
      runtime: 'NestJS',
      storeMode: process.env['SUPPORTPLANE_STORE'] || 'memory',
      authMode: process.env['SUPPORTPLANE_AUTH_MODE'] || 'dev',
      note: 'Mock-first ticket-aware API slice (BL-003)',
    };
  }
}
