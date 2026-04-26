import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { NestFactory } from '@nestjs/core';
import supertest from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';


describe('SupportPlane API', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  before(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
    server = app.getHttpServer();
  });

  it('GET /health returns ok with runtime info', async () => {
    const res = await supertest(server).get('/health').expect(200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.runtime, 'NestJS');
    assert.strictEqual(res.body.service, 'supportplane-api');
    assert.ok(res.body.branch);
    assert.ok(res.body.head);
    assert.ok(res.body.timestamp);
  });

  it('POST /support-sessions rejects missing x-tenant-id', async () => {
    const res = await supertest(server)
      .post('/support-sessions')
      .send({ title: 'Test' })
      .expect(400);
    assert.ok(res.body.error.includes('x-tenant-id'));
  });

  it('POST /support-sessions rejects missing x-user-id', async () => {
    const res = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .send({ title: 'Test' })
      .expect(400);
    assert.ok(res.body.error.includes('x-user-id'));
  });

  it('POST /support-sessions/:id/draft-suggestion rejects missing tenant context', async () => {
    const res = await supertest(server)
      .post('/support-sessions/session-1/draft-suggestion')
      .set('x-user-id', 'user-1')
      .send({})
      .expect(400);

    assert.ok(res.body.error.includes('x-tenant-id'));
  });

  it('POST /support-sessions creates a session', async () => {
    const res = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Printer not working', priority: 'high' })
      .expect(201);

    assert.strictEqual(res.body.tenantId, 'tenant-a');
    assert.strictEqual(res.body.title, 'Printer not working');
    assert.strictEqual(res.body.priority, 'high');
    assert.strictEqual(res.body.status, 'open');
    assert.ok(res.body.id);
    assert.ok(res.body.createdAt);
  });

  it('GET /support-sessions/:id returns the session', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'VPN down' })
      .expect(201);

    const res = await supertest(server)
      .get(`/support-sessions/${created.body.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.strictEqual(res.body.id, created.body.id);
    assert.strictEqual(res.body.title, 'VPN down');
  });

  it('GET /support-sessions/:id enforces tenant isolation', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Isolated session' })
      .expect(201);

    await supertest(server)
      .get(`/support-sessions/${created.body.id}`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .expect(404);
  });

  it('POST /support-sessions/:id/ticket-context loads ticket context', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Ticket context test' })
      .expect(201);

    const res = await supertest(server)
      .post(`/support-sessions/${created.body.id}/ticket-context`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalTicketId: 'TICKET-42' })
      .expect(201);

    assert.strictEqual(res.body.ticketReference.externalTicketId, 'TICKET-42');
    assert.strictEqual(res.body.contextPacket.provenance, 'ticket');
    assert.strictEqual(res.body.contextPacket.sessionId, created.body.id);
    assert.ok(res.body.contextPacket.id);
    assert.strictEqual(res.body.session.linkedTicketIds.length, 1);
  });

  it('POST /support-sessions/:id/context-packets creates a packet', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Packet test' })
      .expect(201);

    const res = await supertest(server)
      .post(`/support-sessions/${created.body.id}/context-packets`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ provenance: 'manual', payload: { note: 'operator observation' } })
      .expect(201);

    assert.strictEqual(res.body.provenance, 'manual');
    assert.deepStrictEqual(res.body.payload, { note: 'operator observation' });
    assert.strictEqual(res.body.sessionId, created.body.id);
  });

  it('GET /support-sessions/:id/context-packets lists packets', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'List packets test' })
      .expect(201);

    await supertest(server)
      .post(`/support-sessions/${created.body.id}/ticket-context`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalTicketId: 'T-1' })
      .expect(201);

    await supertest(server)
      .post(`/support-sessions/${created.body.id}/context-packets`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ provenance: 'manual', payload: { key: 'value' } })
      .expect(201);

    const res = await supertest(server)
      .get(`/support-sessions/${created.body.id}/context-packets`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.strictEqual(res.body.length, 2);
    const provenances = res.body.map((p: { provenance: string }) => p.provenance).sort();
    assert.deepStrictEqual(provenances, ['manual', 'ticket']);
  });

  it('GET /support-sessions/:id/audit-events lists audit events', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Audit test' })
      .expect(201);

    const res = await supertest(server)
      .get(`/support-sessions/${created.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.ok(res.body.length >= 1);
    const event = res.body[0];
    assert.strictEqual(event.tenantId, 'tenant-a');
    assert.strictEqual(event.actorId, 'user-1');
    assert.strictEqual(event.eventType, 'session_created');
    assert.ok(event.integrityHash);
  });

  it('tenant isolation holds for context-packets and audit-events', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Isolation test' })
      .expect(201);

    await supertest(server)
      .get(`/support-sessions/${created.body.id}/context-packets`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .expect(404);

    await supertest(server)
      .get(`/support-sessions/${created.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .expect(404);
  });

  it('POST /support-sessions/:id/draft-suggestion rejects unknown session', async () => {
    await supertest(server)
      .post('/support-sessions/not-a-session/draft-suggestion')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({})
      .expect(404);
  });

  it('POST /support-sessions/:id/draft-suggestion returns mock model metadata and appends audit event', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Draft suggestion test' })
      .expect(201);

    await supertest(server)
      .post(`/support-sessions/${created.body.id}/ticket-context`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalTicketId: 'TICKET-101' })
      .expect(201);

    const draft = await supertest(server)
      .post(`/support-sessions/${created.body.id}/draft-suggestion`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({
        operatorInstructions: 'Mention VPN troubleshooting.',
        modelSelection: { provider: 'mock', model: 'mock-support-note-v1' },
      })
      .expect(201);

    assert.match(draft.body.draft, /MOCK AI DRAFT/);
    assert.equal(draft.body.provider, 'mock');
    assert.equal(draft.body.model, 'mock-support-note-v1');
    assert.equal(draft.body.prompt.version, 'mock-v1');
    assert.ok(draft.body.contextHash);
    assert.equal(draft.body.safety.mockOnly, true);
    assert.equal(draft.body.safety.externalCallMade, false);
    assert.equal(draft.body.safety.writebackAllowed, false);

    const audit = await supertest(server)
      .get(`/support-sessions/${created.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const modelEvent = audit.body.find(
      (event: { eventType: string }) => event.eventType === 'ai_draft_generated'
    );
    assert.ok(modelEvent);
    assert.equal(modelEvent.metadata.provider, 'mock');
    assert.equal(modelEvent.metadata.model, 'mock-support-note-v1');
    assert.equal(modelEvent.metadata.promptVersion, 'mock-v1');
    assert.equal(modelEvent.metadata.contextHash, draft.body.contextHash);
  });
});

describe('Zammad connector endpoints', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  before(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
    server = app.getHttpServer();
  });

  it('GET /connectors/zammad/status requires tenant identity', async () => {
    const res = await supertest(server)
      .get('/connectors/zammad/status')
      .expect(400);
    assert.ok(res.body.error.includes('x-tenant-id'));
  });

  it('GET /connectors/zammad/status returns mock mode by default', async () => {
    const res = await supertest(server)
      .get('/connectors/zammad/status')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.strictEqual(res.body.mode, 'mock');
    assert.strictEqual(res.body.adapterType, 'zammad');
    assert.strictEqual(res.body.connected, true);
    assert.ok(Array.isArray(res.body.capabilities));
    assert.ok(res.body.capabilities.includes('read_tickets'));
  });

  it('POST /connectors/zammad/test returns success in mock mode', async () => {
    const res = await supertest(server)
      .post('/connectors/zammad/test')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(201);

    assert.strictEqual(res.body.mode, 'mock');
    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.latencyMs === 'number');
  });

  it('POST /support-sessions/:id/zammad/ticket-context loads ticket with connector audit', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Zammad connector test' })
      .expect(201);

    const res = await supertest(server)
      .post(`/support-sessions/${created.body.id}/zammad/ticket-context`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalTicketId: 'ZAMMAD-99' })
      .expect(201);

    assert.strictEqual(res.body.ticketReference.externalTicketId, 'ZAMMAD-99');
    assert.ok(res.body.ticketReference.id.startsWith('zammad-tr-'));

    const audit = await supertest(server)
      .get(`/support-sessions/${created.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const connectorEvent = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'zammad_ticket_loaded'
    );
    assert.ok(connectorEvent, 'zammad_ticket_loaded audit event should exist');
    assert.strictEqual(connectorEvent.metadata.externalTicketId, 'ZAMMAD-99');
    assert.strictEqual(connectorEvent.metadata.connectorMode, 'mock');
  });

  it('POST /support-sessions/:id/zammad/internal-note-draft creates a draft and audits', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Draft test' })
      .expect(201);

    const res = await supertest(server)
      .post(`/support-sessions/${created.body.id}/zammad/internal-note-draft`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalTicketId: 'Z-1', body: 'Test draft body', subject: 'Test subject' })
      .expect(201);

    assert.strictEqual(res.body.externalTicketId, 'Z-1');
    assert.strictEqual(res.body.body, 'Test draft body');
    assert.strictEqual(res.body.reviewed, false);

    const audit = await supertest(server)
      .get(`/support-sessions/${created.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const draftEvent = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'internal_note_drafted'
    );
    assert.ok(draftEvent, 'internal_note_drafted audit event should exist');
    assert.strictEqual(draftEvent.metadata.externalTicketId, 'Z-1');
  });

  it('POST /support-sessions/:id/zammad/internal-note-writeback is mock-safe by default', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Writeback test' })
      .expect(201);

    const draft = await supertest(server)
      .post(`/support-sessions/${created.body.id}/zammad/internal-note-draft`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalTicketId: 'Z-2', body: 'Draft for writeback' })
      .expect(201);

    const res = await supertest(server)
      .post(`/support-sessions/${created.body.id}/zammad/internal-note-writeback`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ draftId: draft.body.id, externalTicketId: 'Z-2', body: 'Draft for writeback' })
      .expect(201);

    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.externalArticleId);

    const audit = await supertest(server)
      .get(`/support-sessions/${created.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const attemptEvent = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'internal_note_writeback_attempted'
    );
    assert.ok(attemptEvent, 'writeback attempted audit event should exist');

    const successEvent = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'internal_note_writeback_succeeded'
    );
    assert.ok(successEvent, 'writeback succeeded audit event should exist');
  });

  it('connector endpoints enforce tenant isolation', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Isolation test' })
      .expect(201);

    await supertest(server)
      .post(`/support-sessions/${created.body.id}/zammad/ticket-context`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .send({ externalTicketId: 'Z-1' })
      .expect(404);
  });

  it('secrets are not exposed in connector status or errors', async () => {
    const res = await supertest(server)
      .get('/connectors/zammad/status')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const bodyStr = JSON.stringify(res.body);
    assert.ok(!bodyStr.includes('apiToken'), 'apiToken must not be exposed');
    assert.ok(!bodyStr.includes('secret'), 'secret must not be exposed');
    assert.ok(!bodyStr.includes('token='), 'token must not be exposed');
  });
});

describe('Evidence bundle endpoints', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  before(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
    server = app.getHttpServer();
  });

  it('GET /support-sessions/:id/evidence-bundle requires tenant identity', async () => {
    const res = await supertest(server)
      .get('/support-sessions/session-1/evidence-bundle')
      .expect(400);
    assert.ok(res.body.error.includes('x-tenant-id'));
  });

  it('GET /support-sessions/:id/evidence-bundle returns JSON bundle', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Evidence bundle test' })
      .expect(201);

    const res = await supertest(server)
      .get(`/support-sessions/${created.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.strictEqual(res.body.bundle.tenantId, 'tenant-a');
    assert.strictEqual(res.body.bundle.sessionId, created.body.id);
    assert.strictEqual(res.body.bundle.exportFormat, 'json');
    assert.strictEqual(res.body.bundle.version, '1.0.0-mvp');
    assert.ok(res.body.bundle.bundleId);
    assert.ok(Array.isArray(res.body.bundle.mockDevOnlyDisclaimers));
    assert.ok(Array.isArray(res.body.bundle.limitations));
    assert.strictEqual(res.body.bundle.sourceProvenance.storeType, 'in-memory');
    assert.strictEqual(res.body.bundle.sourceProvenance.persistenceClaimed, false);
  });

  it('GET /support-sessions/:id/evidence-bundle.md returns markdown', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Markdown bundle test' })
      .expect(201);

    await supertest(server)
      .post(`/support-sessions/${created.body.id}/ticket-context`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalTicketId: 'TICKET-MD' })
      .expect(201);

    const res = await supertest(server)
      .get(`/support-sessions/${created.body.id}/evidence-bundle.md`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200)
      .expect('Content-Type', /text\/markdown/);

    assert.match(res.text, /SupportPlane Evidence Bundle/);
    assert.match(res.text, /Session Summary/);
    assert.match(res.text, /Linked Tickets/);
    assert.match(res.text, /AI Context Packets/);
    assert.match(res.text, /Audit Timeline/);
    assert.match(res.text, /Mock \/ Dev-Only Disclaimers/);
    assert.match(res.text, /Limitations/);
  });

  it('evidence bundle enforces tenant isolation', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Isolation bundle test' })
      .expect(201);

    await supertest(server)
      .get(`/support-sessions/${created.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .expect(404);
  });

  it('evidence bundle generation appends audit events', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Audit bundle test' })
      .expect(201);

    await supertest(server)
      .get(`/support-sessions/${created.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const audit = await supertest(server)
      .get(`/support-sessions/${created.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const generatedEvent = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'evidence_bundle_generated'
    );
    assert.ok(generatedEvent, 'evidence_bundle_generated audit event should exist');
    assert.strictEqual(generatedEvent.metadata.format, 'json');

    const exportedEvent = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'evidence_bundle_exported'
    );
    assert.ok(exportedEvent, 'evidence_bundle_exported audit event should exist');
    assert.strictEqual(exportedEvent.metadata.format, 'json');
  });

  it('evidence bundle does not expose secrets', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Secret redaction test' })
      .expect(201);

    await supertest(server)
      .post(`/support-sessions/${created.body.id}/ticket-context`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalTicketId: 'TICKET-SECRET' })
      .expect(201);

    const res = await supertest(server)
      .get(`/support-sessions/${created.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const bodyStr = JSON.stringify(res.body);
    assert.ok(!bodyStr.includes('apiToken'), 'apiToken must not be in bundle');
    assert.ok(!bodyStr.includes('ZAMMAD_API_TOKEN'), 'ZAMMAD_API_TOKEN must not be in bundle');
    assert.ok(!bodyStr.includes('secret'), 'secret must not be in bundle');
    assert.ok(!bodyStr.includes('token='), 'token= must not be in bundle');
    assert.ok(!bodyStr.includes('Bearer '), 'Bearer token must not be in bundle');
  });
});

describe('Call simulator endpoints', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  before(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
    server = app.getHttpServer();
  });

  it('POST /calls/fake-incoming requires tenant identity', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .send({ externalCallId: 'FAKE-1', rawCallerNumber: '03 555 01 01' })
      .expect(400);
    assert.ok(res.body.error.includes('x-tenant-id'));
  });

  it('POST /calls/fake-incoming creates a fake incoming call with normalized number', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-1', rawCallerNumber: '03 555 01 01', callerDisplayName: 'Test' })
      .expect(201);

    assert.strictEqual(res.body.provider, 'fake_webhook');
    assert.strictEqual(res.body.direction, 'inbound');
    assert.strictEqual(res.body.status, 'ringing');
    assert.strictEqual(res.body.caller.rawNumber, '03 555 01 01');
    assert.strictEqual(res.body.caller.normalizedNumber, '+32 3 555 01 01');
    assert.strictEqual(res.body.mockDevOnly, true);
    assert.ok(res.body.callerMatch);
  });

  it('POST /calls/fake-incoming returns matched fixture customer', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-2', rawCallerNumber: '+32 3 555 01 01' })
      .expect(201);

    assert.strictEqual(res.body.callerMatch.status, 'matched');
    assert.strictEqual(res.body.callerMatch.customerName, 'Acme BVBA');
    assert.deepStrictEqual(res.body.callerMatch.matchedTicketIds, ['TICKET-101', 'TICKET-102']);
  });

  it('GET /calls/recent lists recent calls', async () => {
    await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-3', rawCallerNumber: '02 555 0202' })
      .expect(201);

    const res = await supertest(server)
      .get('/calls/recent')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 1);
    assert.strictEqual(res.body[0].tenantId, 'tenant-a');
  });

  it('GET /calls/:id returns a specific call', async () => {
    const created = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-4', rawCallerNumber: '0495 12 34 56' })
      .expect(201);

    const res = await supertest(server)
      .get(`/calls/${created.body.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.strictEqual(res.body.id, created.body.id);
    assert.strictEqual(res.body.externalCallId, 'FAKE-4');
  });

  it('POST /calls/:id/link-session links call to session', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Call link test' })
      .expect(201);

    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-5', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const res = await supertest(server)
      .post(`/calls/${call.body.id}/link-session`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ sessionId: session.body.id })
      .expect(201);

    assert.strictEqual(res.body.callEvent.sessionId, session.body.id);
    assert.strictEqual(res.body.callEvent.status, 'answered');
    assert.ok(res.body.linkedAt);
  });

  it('call endpoints enforce tenant isolation', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-6', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .get(`/calls/${call.body.id}`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .expect(404);
  });

  it('call link appends call_linked_to_session audit event', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Audit call test' })
      .expect(201);

    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-7', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.id}/link-session`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ sessionId: session.body.id })
      .expect(201);

    const audit = await supertest(server)
      .get(`/support-sessions/${session.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const linkedEvent = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'call_linked_to_session'
    );
    assert.ok(linkedEvent, 'call_linked_to_session audit event should exist');
    assert.strictEqual(linkedEvent.metadata.sessionId, session.body.id);
    assert.strictEqual(linkedEvent.metadata.mockDevOnly, true);
  });

  it('evidence bundle includes linked call events', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Evidence call test' })
      .expect(201);

    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-8', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.id}/link-session`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ sessionId: session.body.id })
      .expect(201);

    const res = await supertest(server)
      .get(`/support-sessions/${session.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.ok(Array.isArray(res.body.bundle.callEvents));
    assert.strictEqual(res.body.bundle.callEvents.length, 1);
    assert.strictEqual(res.body.bundle.callEvents[0].externalCallId, 'FAKE-8');
    assert.strictEqual(res.body.bundle.callEvents[0].matchStatus, 'matched');
    assert.strictEqual(res.body.bundle.callEvents[0].mockDevOnly, true);
  });
});
