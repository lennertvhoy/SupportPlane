#!/usr/bin/env node
/**
 * SupportPlane baseline health/version contract.
 * Exits 0 with JSON when healthy; exits 1 when degraded/down.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function getGitHead() {
  try {
    const head = fs.readFileSync(path.join(root, '.git', 'HEAD'), 'utf8').trim();
    if (head.startsWith('ref: ')) {
      const refPath = head.slice(5);
      return fs.readFileSync(path.join(root, '.git', refPath), 'utf8').trim();
    }
    return head;
  } catch {
    return null;
  }
}

function getBranch() {
  try {
    const head = fs.readFileSync(path.join(root, '.git', 'HEAD'), 'utf8').trim();
    if (head.startsWith('ref: ')) {
      return head.slice(5).replace('refs/heads/', '');
    }
    return 'detached';
  } catch {
    return null;
  }
}

const health = {
  service: pkg.name,
  version: pkg.version,
  status: 'ok',
  branch: getBranch(),
  head: getGitHead(),
  timestamp: new Date().toISOString(),
  note: 'Scaffold-only; no product runtime is started yet.',
};

console.log(JSON.stringify(health, null, 2));
process.exit(health.status === 'ok' ? 0 : 1);
