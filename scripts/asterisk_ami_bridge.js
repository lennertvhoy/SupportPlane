#!/usr/bin/env node
/**
 * Asterisk AMI Bridge Script
 *
 * Connects to Asterisk Manager Interface (AMI) and forwards normalized
 * call events to the SupportPlane API.
 *
 * Usage:
 *   node scripts/asterisk_ami_bridge.js
 *
 * Environment:
 *   AMI_HOST            - Asterisk AMI host (default: asterisk.supportplane-integrations.svc.cluster.local)
 *   AMI_PORT            - Asterisk AMI port (default: 5038)
 *   AMI_USER            - AMI username (default: admin)
 *   AMI_SECRET          - AMI secret (default: local-sandbox-secret)
 *   API_BASE_URL        - SupportPlane API URL (default: http://supportplane-api.supportplane-app.svc.cluster.local:4110)
 *   SERVICE_TOKEN       - Internal service token for API auth
 *   TENANT_ID           - Target tenant (default: dev-tenant)
 *
 * Modes:
 *   --test-event        - Generate a single local AMI test event and exit
 *   --listen            - Continuously listen for AMI events (default)
 */

const net = require('net');
const http = require('http');
const url = require('url');

const AMI_HOST = process.env['AMI_HOST'] || 'asterisk.supportplane-integrations.svc.cluster.local';
const AMI_PORT = parseInt(process.env['AMI_PORT'] || '5038', 10);
const AMI_USER = process.env['AMI_USER'] || 'admin';
const AMI_SECRET = process.env['AMI_SECRET'] || 'local-sandbox-secret';
const API_BASE_URL = process.env['API_BASE_URL'] || 'http://supportplane-api.supportplane-app.svc.cluster.local:4110';
const SERVICE_TOKEN = process.env['SERVICE_TOKEN'] || '';
const TENANT_ID = process.env['TENANT_ID'] || 'dev-tenant';

const TEST_EVENT = process.argv.includes('--test-event');
const LISTEN = process.argv.includes('--listen') || !TEST_EVENT;

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

function postEventToApi(eventPayload) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(`${API_BASE_URL}/telephony/asterisk/events`);
    const postData = JSON.stringify(eventPayload);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-supportplane-service-token': SERVICE_TOKEN,
        'x-tenant-id': TENANT_ID,
        'x-service-actor': 'asterisk-ami-bridge',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body: data });
        } else {
          reject(new Error(`API returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function normalizeAmiEvent(amiEvent) {
  const eventType = amiEvent.Event || 'Unknown';
  const channel = amiEvent.Channel || '';
  const callerNum = amiEvent.CallerIDNum || amiEvent.CallerID || '+3223456789';
  const externalCallId = amiEvent.Uniqueid || amiEvent.Linkedid || `ami-${Date.now()}`;

  return {
    tenantId: TENANT_ID,
    externalCallId,
    eventType,
    callerNumber: callerNum,
    calleeNumber: amiEvent.Exten || amiEvent.DNID || undefined,
    direction: 'inbound',
    status: 'ringing',
    rawEvent: {
      ...amiEvent,
      Secret: '[REDACTED]',
      LocalTestEvent: true,
    },
    autoCreateSession: true,
  };
}

async function sendTestEvent() {
  log('Sending local AMI test event to API...');
  const payload = {
    tenantId: TENANT_ID,
    externalCallId: `ami-test-${Date.now()}`,
    eventType: 'Newchannel',
    callerNumber: '+3223456789',
    calleeNumber: 'test',
    direction: 'inbound',
    status: 'ringing',
    rawEvent: {
      Event: 'Newchannel',
      Channel: 'Local/test@default-00000001;1',
      CallerIDNum: '+3223456789',
      Exten: 'test',
      Context: 'default',
      Uniqueid: `ami-test-${Date.now()}`,
      LocalTestEvent: true,
    },
    autoCreateSession: true,
  };

  try {
    const result = await postEventToApi(payload);
    log('Test event accepted by API:', result.status);
    const body = JSON.parse(result.body);
    log('Call event ID:', body.callEvent?.id);
    log('Auto-create result:', body.autoCreateResult);
    log('Source:', body.source);
    log('Sandbox only:', body.sandboxOnly);
    log('PSTN:', body.pstn);
    log('Recording:', body.recording);
    return body;
  } catch (err) {
    log('Failed to send test event:', err.message);
    throw err;
  }
}

function connectAmi() {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let buffer = '';
    let loggedIn = false;

    client.connect(AMI_PORT, AMI_HOST, () => {
      log(`Connected to AMI at ${AMI_HOST}:${AMI_PORT}`);
      // Send login action
      const login = `Action: Login\r\nUsername: ${AMI_USER}\r\nSecret: ${AMI_SECRET}\r\n\r\n`;
      client.write(login);
    });

    client.on('data', (data) => {
      buffer += data.toString();
      let lines = buffer.split('\r\n');
      buffer = lines.pop() || '';

      while (lines.length > 0) {
        const block = [];
        while (lines.length > 0) {
          const line = lines.shift();
          if (line === '') break;
          block.push(line);
        }
        if (block.length === 0) continue;
        handleAmiBlock(block);
      }
    });

    client.on('close', () => {
      log('AMI connection closed');
      if (!loggedIn) reject(new Error('Connection closed before login'));
    });

    client.on('error', (err) => {
      log('AMI connection error:', err.message);
      reject(err);
    });

    function handleAmiBlock(block) {
      const parsed = {};
      for (const line of block) {
        const idx = line.indexOf(': ');
        if (idx > 0) {
          parsed[line.slice(0, idx)] = line.slice(idx + 2);
        }
      }

      if (parsed['Response'] === 'Success' && parsed['Message']?.includes('Authentication accepted')) {
        loggedIn = true;
        log('AMI authentication accepted');
        resolve(client);
        return;
      }

      if (parsed['Response'] === 'Error') {
        log('AMI error:', parsed['Message']);
        reject(new Error(`AMI error: ${parsed['Message']}`));
        return;
      }

      if (parsed['Event']) {
        log('AMI event:', parsed['Event'], parsed['Uniqueid'] || '');
        if (['Newchannel', 'Newstate', 'Hangup'].includes(parsed['Event'])) {
          const normalized = normalizeAmiEvent(parsed);
          postEventToApi(normalized)
            .then((res) => log('Event forwarded to API:', res.status))
            .catch((err) => log('Event forwarding failed:', err.message));
        }
      }
    }
  });
}

async function main() {
  if (TEST_EVENT) {
    await sendTestEvent();
    process.exit(0);
  }

  if (LISTEN) {
    try {
      const client = await connectAmi();
      log('Listening for AMI events...');
      // Keep process alive
      setInterval(() => {}, 60000);
    } catch (err) {
      log('Failed to connect to AMI:', err.message);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  log('Unhandled error:', err.message);
  process.exit(1);
});
