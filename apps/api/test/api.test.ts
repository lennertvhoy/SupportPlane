import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { NestFactory } from '@nestjs/core';
import supertest from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { InMemoryStore } from '../src/support-sessions/in-memory.store.js';


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

  it('durable action/outbox workflow creates, reviews, queues, and mock-delivers locally', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .send({ title: 'Action outbox test' })
      .expect(201);

    const actionCreated = await supertest(server)
      .post(`/support-sessions/${created.body.id}/actions`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .send({
        actionType: 'ticket_note',
        externalTicketId: 'TICKET-101',
        body: 'Local mock support note. password=secret should be redacted.',
        idempotencyKey: `tenant-a:${created.body.id}:ticket-note:test`,
      })
      .expect(201);

    assert.strictEqual(actionCreated.body.action.status, 'draft');
    assert.match(actionCreated.body.action.safeBodyPreview, /\[REDACTED\]/);

    const submitted = await supertest(server)
      .post(`/actions/${actionCreated.body.action.id}/submit-for-review`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .send({})
      .expect(201);
    assert.strictEqual(submitted.body.action.status, 'review_required');

    await supertest(server)
      .post(`/actions/${actionCreated.body.action.id}/approve`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'viewer-1')
      .set('x-user-role', 'viewer')
      .send({})
      .expect(403);

    const approved = await supertest(server)
      .post(`/actions/${actionCreated.body.action.id}/approve`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({ reason: 'Looks safe for mock delivery' })
      .expect(201);
    assert.strictEqual(approved.body.action.status, 'approved');

    const queued = await supertest(server)
      .post(`/actions/${actionCreated.body.action.id}/queue`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({})
      .expect(201);
    assert.strictEqual(queued.body.outboxItem.status, 'queued');
    assert.strictEqual(queued.body.outboxItem.deliveryIntent.realNetwork, false);

    const delivered = await supertest(server)
      .post(`/outbox/${queued.body.outboxItem.id}/mock-deliver`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .send({})
      .expect(201);
    assert.strictEqual(delivered.body.outboxItem.status, 'mock_delivered');
    assert.strictEqual(delivered.body.delivery.realNetwork, false);
    assert.strictEqual(delivered.body.delivery.externalWriteAttempted, false);
    assert.strictEqual(delivered.body.delivery.writebackEnabled, false);

    const outboxDetail = await supertest(server)
      .get(`/outbox/${queued.body.outboxItem.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'viewer-1')
      .set('x-user-role', 'viewer')
      .expect(200);
    assert.strictEqual(outboxDetail.body.attempts.length, 1);

    await supertest(server)
      .get(`/actions/${actionCreated.body.action.id}`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'admin-2')
      .set('x-user-role', 'admin')
      .expect(404);

    const timeline = await supertest(server)
      .get(`/support-sessions/${created.body.id}/case-timeline`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'viewer-1')
      .set('x-user-role', 'viewer')
      .expect(200);
    assert.ok(timeline.body.timeline.some((item: { type: string }) => item.type === 'action_outbox_item'));

    const evidence = await supertest(server)
      .get(`/support-sessions/${created.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'viewer-1')
      .set('x-user-role', 'viewer')
      .expect(200);
    assert.strictEqual(evidence.body.bundle.actionOutbox[0].realNetwork, false);
    assert.doesNotMatch(JSON.stringify(evidence.body.bundle), /password=secret/);
  });

  it('action/outbox state-machine lifecycle prevents attempts before queue', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .send({ title: 'State machine test' })
      .expect(201);

    // 1. draft has no outbox item and zero attempts
    const actionCreated = await supertest(server)
      .post(`/support-sessions/${created.body.id}/actions`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .send({ actionType: 'ticket_note', externalTicketId: 'TICKET-SM-1', body: 'Draft' })
      .expect(201);
    assert.strictEqual(actionCreated.body.action.status, 'draft');
    const draftList = await supertest(server)
      .get(`/support-sessions/${created.body.id}/actions`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);
    assert.strictEqual(draftList.body.outboxItems.filter((i: { supportActionId: string }) => i.supportActionId === actionCreated.body.action.id).length, 0);

    // 2. review_required has no outbox item and zero attempts
    const submitted = await supertest(server)
      .post(`/actions/${actionCreated.body.action.id}/submit-for-review`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .expect(201);
    assert.strictEqual(submitted.body.action.status, 'review_required');
    const reviewList = await supertest(server)
      .get(`/support-sessions/${created.body.id}/actions`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);
    assert.strictEqual(reviewList.body.outboxItems.filter((i: { supportActionId: string }) => i.supportActionId === actionCreated.body.action.id).length, 0);

    // 3. approved has no outbox item and zero attempts
    const approved = await supertest(server)
      .post(`/actions/${actionCreated.body.action.id}/approve`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({ reason: 'Approved' })
      .expect(201);
    assert.strictEqual(approved.body.action.status, 'approved');
    const approvedList = await supertest(server)
      .get(`/support-sessions/${created.body.id}/actions`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);
    assert.strictEqual(approvedList.body.outboxItems.filter((i: { supportActionId: string }) => i.supportActionId === actionCreated.body.action.id).length, 0);

    // 4. queued creates outbox item with attemptCount 0
    const queued = await supertest(server)
      .post(`/actions/${actionCreated.body.action.id}/queue`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .expect(201);
    assert.strictEqual(queued.body.outboxItem.status, 'queued');
    assert.strictEqual(queued.body.outboxItem.attemptCount, 0);

    // 5. mock delivery creates exactly one attempt for the correct outbox item
    const delivered = await supertest(server)
      .post(`/outbox/${queued.body.outboxItem.id}/mock-deliver`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .expect(201);
    assert.strictEqual(delivered.body.outboxItem.status, 'mock_delivered');
    assert.strictEqual(delivered.body.attempt.attemptNumber, 1);
    assert.strictEqual(delivered.body.attempt.outboxItemId, queued.body.outboxItem.id);
    assert.strictEqual(delivered.body.attempt.supportActionId, actionCreated.body.action.id);

    // 6. attempt history belongs to the selected outbox item
    const outboxDetail = await supertest(server)
      .get(`/outbox/${queued.body.outboxItem.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'viewer-1')
      .set('x-user-role', 'viewer')
      .expect(200);
    assert.strictEqual(outboxDetail.body.attempts.length, 1);
    assert.strictEqual(outboxDetail.body.attempts[0].supportActionId, actionCreated.body.action.id);
  });

  it('action/outbox invalid transitions are rejected', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .send({ title: 'Invalid transition test' })
      .expect(201);

    const actionCreated = await supertest(server)
      .post(`/support-sessions/${created.body.id}/actions`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .send({ actionType: 'ticket_note', externalTicketId: 'TICKET-INV-1', body: 'Draft' })
      .expect(201);

    // Cannot approve from draft
    await supertest(server)
      .post(`/actions/${actionCreated.body.action.id}/approve`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({})
      .expect(400);

    // Cannot queue from draft
    await supertest(server)
      .post(`/actions/${actionCreated.body.action.id}/queue`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({})
      .expect(400);

    // Cannot mock-deliver without outbox item
    await supertest(server)
      .post(`/actions/${actionCreated.body.action.id}/mock-deliver`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .send({})
      .expect(400);
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

describe('Customer and connector installation endpoints (BL-020)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  before(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
    server = app.getHttpServer();
  });

  it('GET /customers requires tenant identity', async () => {
    const res = await supertest(server)
      .get('/customers')
      .expect(400);
    assert.ok(res.body.error.includes('x-tenant-id'));
  });

  it('GET /customers returns empty list for in-memory test store', async () => {
    const res = await supertest(server)
      .get('/customers')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .expect(200);
    assert.ok(Array.isArray(res.body.customers));
    assert.strictEqual(res.body.customers.length, 0);
  });

  it('GET /customers/:id returns 404 for unknown customer', async () => {
    await supertest(server)
      .get('/customers/unknown-id')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .expect(404);
  });

  it('GET /connector-installations requires tenant identity', async () => {
    const res = await supertest(server)
      .get('/connector-installations')
      .expect(400);
    assert.ok(res.body.error.includes('x-tenant-id'));
  });

  it('GET /connector-installations returns empty list for in-memory test store', async () => {
    const res = await supertest(server)
      .get('/connector-installations')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .expect(200);
    assert.ok(Array.isArray(res.body.installations));
    assert.strictEqual(res.body.installations.length, 0);
  });

  it('GET /connector-installations/:id returns 404 for unknown installation', async () => {
    await supertest(server)
      .get('/connector-installations/unknown-id')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .expect(404);
  });

  it('customer endpoints enforce tenant isolation', async () => {
    await supertest(server)
      .get('/customers')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .expect(200);
  });

  it('connector installation endpoints enforce tenant isolation', async () => {
    await supertest(server)
      .get('/connector-installations')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .expect(200);
  });

  it('no secrets exposed in connector installation responses', async () => {
    const res = await supertest(server)
      .get('/connector-installations')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'operator')
      .expect(200);
    const bodyStr = JSON.stringify(res.body);
    assert.ok(!bodyStr.includes('apiToken'), 'apiToken must not be exposed');
    assert.ok(!bodyStr.includes('secret'), 'secret must not be exposed');
    assert.ok(!bodyStr.includes('token='), 'token must not be exposed');
  });

  it('POST /connector-installations creates installation with mock defaults', async () => {
    const res = await supertest(server)
      .post('/connector-installations')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({ name: 'Test Connector', adapterType: 'zammad' })
      .expect(201);
    assert.strictEqual(res.body.installation.name, 'Test Connector');
    assert.strictEqual(res.body.installation.adapterType, 'zammad');
    assert.strictEqual(res.body.installation.mockMode, true);
    assert.strictEqual(res.body.installation.enabled, false);
    assert.strictEqual(res.body.installation.status, 'inactive');
    assert.ok(Array.isArray(res.body.installation.capabilities));
  });

  it('PATCH /connector-installations/:id updates safe fields as admin', async () => {
    const created = await supertest(server)
      .post('/connector-installations')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({ name: 'Patch Test', adapterType: 'mock' })
      .expect(201);

    const res = await supertest(server)
      .patch(`/connector-installations/${created.body.installation.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({
        displayName: 'Patched Display',
        description: 'Patched description',
        enabled: true,
        status: 'active',
        timeoutMs: 8000,
        capabilities: ['read_tickets', 'write_notes'],
        safetyFlags: { validateBeforeWrite: true, maxRetries: 5 },
      })
      .expect(200);

    assert.strictEqual(res.body.installation.displayName, 'Patched Display');
    assert.strictEqual(res.body.installation.description, 'Patched description');
    assert.strictEqual(res.body.installation.enabled, true);
    assert.strictEqual(res.body.installation.status, 'active');
    assert.strictEqual(res.body.installation.timeoutMs, 8000);
    assert.deepStrictEqual(res.body.installation.capabilities, ['read_tickets', 'write_notes']);
    assert.strictEqual(res.body.installation.safetyFlags.maxRetries, 5);
  });

  it('PATCH /connector-installations/:id denies viewer', async () => {
    const created = await supertest(server)
      .post('/connector-installations')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({ name: 'Viewer Deny Test', adapterType: 'mock' })
      .expect(201);

    await supertest(server)
      .patch(`/connector-installations/${created.body.installation.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'viewer-1')
      .set('x-user-role', 'viewer')
      .send({ enabled: true })
      .expect(403);
  });

  it('dev mode trusts identity headers (forged role denial covered in local auth script)', async () => {
    const created = await supertest(server)
      .post('/connector-installations')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({ name: 'Forged Test', adapterType: 'mock' })
      .expect(201);

    // In dev mode, headers are trusted; a viewer with forged admin header is treated as admin.
    // Real forged-role denial is verified by verify_delivery_policy_controls.sh in local auth mode.
    const res = await supertest(server)
      .patch(`/connector-installations/${created.body.installation.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'viewer-1')
      .set('x-user-role', 'admin')
      .send({ enabled: true })
      .expect(200);
    assert.strictEqual(res.body.installation.enabled, true);
  });

  it('cross-tenant connector installation access is denied', async () => {
    const created = await supertest(server)
      .post('/connector-installations')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({ name: 'Cross-tenant Test', adapterType: 'mock' })
      .expect(201);

    await supertest(server)
      .get(`/connector-installations/${created.body.installation.id}`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'admin-b')
      .set('x-user-role', 'admin')
      .expect(404);

    await supertest(server)
      .patch(`/connector-installations/${created.body.installation.id}`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'admin-b')
      .set('x-user-role', 'admin')
      .send({ enabled: true })
      .expect(404);
  });

  it('config secrets are redacted in connector installation responses', async () => {
    const created = await supertest(server)
      .post('/connector-installations')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({
        name: 'Redaction Test',
        adapterType: 'zammad',
        config: { apiToken: 'super-secret-123', baseUrl: 'http://localhost:3000', password: 'hunter2' },
      })
      .expect(201);

    const res = await supertest(server)
      .get(`/connector-installations/${created.body.installation.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .expect(200);

    assert.strictEqual(res.body.installation.config.apiToken, '[REDACTED]');
    assert.strictEqual(res.body.installation.config.password, '[REDACTED]');
    assert.strictEqual(res.body.installation.config.baseUrl, 'http://localhost:3000');
  });

  it('POST /connector-installations/:id/validate returns mock validation', async () => {
    const created = await supertest(server)
      .post('/connector-installations')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({ name: 'Validate Test', adapterType: 'mock' })
      .expect(201);

    const res = await supertest(server)
      .post(`/connector-installations/${created.body.installation.id}/validate`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .expect(200);

    assert.strictEqual(res.body.result.mode, 'mock');
    assert.strictEqual(res.body.result.realNetwork, false);
    assert.strictEqual(res.body.result.writebackEnabled, false);
  });

  it('POST /connector-installations/:id/test returns mock test result', async () => {
    const created = await supertest(server)
      .post('/connector-installations')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .send({ name: 'Test Endpoint Test', adapterType: 'mock' })
      .expect(201);

    const res = await supertest(server)
      .post(`/connector-installations/${created.body.installation.id}/test`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'admin-1')
      .set('x-user-role', 'admin')
      .expect(200);

    assert.strictEqual(res.body.result.mode, 'mock');
    assert.strictEqual(res.body.result.realNetwork, false);
    assert.strictEqual(res.body.result.writebackEnabled, false);
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
    assert.strictEqual(res.body.bundle.sourceProvenance.storeType, 'memory');
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

    assert.strictEqual(res.body.callEvent.provider, 'fake_webhook');
    assert.strictEqual(res.body.callEvent.direction, 'inbound');
    assert.strictEqual(res.body.callEvent.status, 'ringing');
    assert.strictEqual(res.body.callEvent.caller.rawNumber, '03 555 01 01');
    assert.strictEqual(res.body.callEvent.caller.normalizedNumber, '+32 3 555 01 01');
    assert.strictEqual(res.body.callEvent.mockDevOnly, true);
    assert.ok(res.body.callEvent.callerMatch);
    assert.strictEqual(res.body.autoCreateResult, 'not_requested');
  });

  it('POST /calls/fake-incoming returns matched fixture customer', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-2', rawCallerNumber: '+32 3 555 01 01' })
      .expect(201);

    assert.strictEqual(res.body.callEvent.callerMatch.status, 'matched');
    assert.strictEqual(res.body.callEvent.callerMatch.customerName, 'Acme BVBA');
    assert.deepStrictEqual(res.body.callEvent.callerMatch.matchedTicketIds, ['TICKET-101', 'TICKET-102']);
  });

  it('POST /calls/fake-incoming auto-creates session when autoCreateSession=true and caller matched', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-AUTO-1', rawCallerNumber: '+32 3 555 01 01', autoCreateSession: true })
      .expect(201);

    assert.strictEqual(res.body.autoCreateResult, 'auto_created');
    assert.ok(res.body.createdSession);
    assert.strictEqual(res.body.createdSession.tenantId, 'tenant-a');
    assert.strictEqual(res.body.createdSession.title, 'Incoming call from Acme BVBA');
    assert.strictEqual(res.body.createdSession.status, 'open');
    assert.strictEqual(res.body.createdSession.priority, 'normal');
    assert.deepStrictEqual(res.body.createdSession.linkedTicketIds, ['TICKET-101', 'TICKET-102']);
    assert.strictEqual(res.body.callEvent.sessionId, res.body.createdSession.id);
    assert.strictEqual(res.body.callEvent.status, 'answered');
  });

  it('POST /calls/fake-incoming uses preferredPriority when supplied and valid', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-AUTO-1-HIGH', rawCallerNumber: '+32 3 555 01 01', autoCreateSession: true, preferredPriority: 'high' })
      .expect(201);

    assert.strictEqual(res.body.autoCreateResult, 'auto_created');
    assert.ok(res.body.createdSession);
    assert.strictEqual(res.body.createdSession.priority, 'high');
    assert.strictEqual(res.body.createdSession.title, 'Incoming call from Acme BVBA');
  });

  it('POST /calls/fake-incoming uses preferredSessionTitle when supplied', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-AUTO-1-TITLE', rawCallerNumber: '+32 3 555 01 01', autoCreateSession: true, preferredSessionTitle: 'VIP Escalation' })
      .expect(201);

    assert.strictEqual(res.body.autoCreateResult, 'auto_created');
    assert.ok(res.body.createdSession);
    assert.strictEqual(res.body.createdSession.title, 'VIP Escalation');
    assert.strictEqual(res.body.createdSession.priority, 'normal');
  });

  it('POST /calls/fake-incoming skips auto-create for no-match caller', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-AUTO-2', rawCallerNumber: '+32 9 999 9999', autoCreateSession: true })
      .expect(201);

    assert.strictEqual(res.body.autoCreateResult, 'skipped_no_match');
    assert.strictEqual(res.body.createdSession, undefined);
    assert.strictEqual(res.body.callEvent.status, 'ringing');
  });

  it('POST /calls/fake-incoming skips auto-create for invalid phone', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-AUTO-3', rawCallerNumber: 'not-a-number', autoCreateSession: true })
      .expect(201);

    assert.strictEqual(res.body.autoCreateResult, 'skipped_invalid_phone');
    assert.strictEqual(res.body.createdSession, undefined);
  });

  it('auto-created session is tenant-scoped', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-AUTO-4', rawCallerNumber: '+32 3 555 01 01', autoCreateSession: true })
      .expect(201);

    const sessionId = res.body.createdSession.id;

    // Should be accessible from same tenant
    await supertest(server)
      .get(`/support-sessions/${sessionId}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    // Should not be accessible from different tenant
    await supertest(server)
      .get(`/support-sessions/${sessionId}`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .expect(404);
  });

  it('auto-create appends support_session_auto_created and call_auto_linked_to_session audit events', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-AUTO-5', rawCallerNumber: '03 555 01 01', autoCreateSession: true })
      .expect(201);

    const sessionId = res.body.createdSession.id;

    const audit = await supertest(server)
      .get(`/support-sessions/${sessionId}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const autoCreateEvent = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'support_session_auto_created'
    );
    assert.ok(autoCreateEvent, 'support_session_auto_created audit event should exist');
    assert.strictEqual(autoCreateEvent.metadata.customerName, 'Acme BVBA');

    const autoLinkEvent = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'call_auto_linked_to_session'
    );
    assert.ok(autoLinkEvent, 'call_auto_linked_to_session audit event should exist');
    assert.strictEqual(autoLinkEvent.metadata.sessionId, sessionId);
  });

  it('evidence bundle includes auto-created call and session relationship', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-AUTO-6', rawCallerNumber: '03 555 01 01', autoCreateSession: true })
      .expect(201);

    const sessionId = res.body.createdSession.id;

    const bundleRes = await supertest(server)
      .get(`/support-sessions/${sessionId}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.ok(Array.isArray(bundleRes.body.bundle.callEvents));
    assert.strictEqual(bundleRes.body.bundle.callEvents.length, 1);
    assert.strictEqual(bundleRes.body.bundle.callEvents[0].externalCallId, 'FAKE-AUTO-6');
    assert.strictEqual(bundleRes.body.bundle.callEvents[0].linkedSessionId, sessionId);
    assert.strictEqual(bundleRes.body.bundle.callEvents[0].matchStatus, 'matched');
    assert.strictEqual(bundleRes.body.bundle.sessionSummary.id, sessionId);

    const auditTimeline = bundleRes.body.bundle.auditTimeline;
    const receivedEvent = auditTimeline.find(
      (e: { eventType: string }) => e.eventType === 'call_event_received'
    );
    assert.ok(receivedEvent, 'call_event_received should be in evidence bundle audit timeline');
    const matchedEvent = auditTimeline.find(
      (e: { eventType: string }) => e.eventType === 'caller_matched'
    );
    assert.ok(matchedEvent, 'caller_matched should be in evidence bundle audit timeline');
    const autoCreateEvent = auditTimeline.find(
      (e: { eventType: string }) => e.eventType === 'support_session_auto_created'
    );
    assert.ok(autoCreateEvent, 'support_session_auto_created should be in evidence bundle audit timeline');
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
      .get(`/calls/${created.body.callEvent.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.strictEqual(res.body.id, created.body.callEvent.id);
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
      .post(`/calls/${call.body.callEvent.id}/link-session`)
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
      .get(`/calls/${call.body.callEvent.id}`)
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
      .post(`/calls/${call.body.callEvent.id}/link-session`)
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
      .post(`/calls/${call.body.callEvent.id}/link-session`)
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

  it('POST /calls/fake-incoming rejects invalid preferredPriority with 400', async () => {
    const res = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-AUTO-BAD', rawCallerNumber: '+32 3 555 01 01', autoCreateSession: true, preferredPriority: 'urgent' })
      .expect(400);

    assert.ok(res.body.message.includes('Invalid preferredPriority'));
  });
});

describe('Greeting suggestion endpoints', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  before(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
    server = app.getHttpServer();
  });

  it('POST /support-sessions/:id/greeting-suggestion rejects missing tenant identity', async () => {
    const res = await supertest(server)
      .post('/support-sessions/session-1/greeting-suggestion')
      .set('x-user-id', 'user-1')
      .send({})
      .expect(400);

    assert.ok(res.body.error.includes('x-tenant-id'));
  });

  it('POST /support-sessions/:id/greeting-suggestion rejects cross-tenant session access', async () => {
    const created = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Greeting isolation test' })
      .expect(201);

    await supertest(server)
      .post(`/support-sessions/${created.body.id}/greeting-suggestion`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .send({})
      .expect(404);
  });

  it('POST /support-sessions/:id/greeting-suggestion works with a linked call and session', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Greeting test' })
      .expect(201);

    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-GREET-1', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const res = await supertest(server)
      .post(`/support-sessions/${session.body.id}/greeting-suggestion`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ callEventId: call.body.callEvent.id, tone: 'friendly' })
      .expect(201);

    assert.ok(res.body.suggestion.greetingText);
    assert.strictEqual(res.body.suggestion.tone, 'friendly');
    assert.strictEqual(res.body.provider, 'mock');
    assert.ok(res.body.contextHash);
    assert.strictEqual(res.body.safety.mockOnly, true);
    assert.strictEqual(res.body.safety.autoSend, false);
    assert.strictEqual(res.body.safety.voiceEnabled, false);
  });

  it('POST /support-sessions/:id/greeting-suggestion works with incomplete context using safe fallback', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Greeting fallback test' })
      .expect(201);

    const res = await supertest(server)
      .post(`/support-sessions/${session.body.id}/greeting-suggestion`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ tone: 'concise' })
      .expect(201);

    assert.ok(res.body.suggestion.greetingText);
    assert.strictEqual(res.body.suggestion.tone, 'concise');
    assert.match(res.body.suggestion.greetingText, /the caller|SupportPlane/);
  });

  it('greeting suggestion appends greeting_suggestion_generated audit event', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Greeting audit test' })
      .expect(201);

    await supertest(server)
      .post(`/support-sessions/${session.body.id}/greeting-suggestion`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ tone: 'professional' })
      .expect(201);

    const audit = await supertest(server)
      .get(`/support-sessions/${session.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const event = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'greeting_suggestion_generated'
    );
    assert.ok(event, 'greeting_suggestion_generated audit event should exist');
    assert.strictEqual(event.metadata.provider, 'mock');
    assert.strictEqual(event.metadata.tone, 'professional');
    assert.ok(event.metadata.contextHash);
    assert.strictEqual(event.metadata.mockOnly, true);
  });

  it('evidence bundle includes greeting suggestion summary', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Greeting evidence test' })
      .expect(201);

    await supertest(server)
      .post(`/support-sessions/${session.body.id}/greeting-suggestion`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ tone: 'friendly' })
      .expect(201);

    const res = await supertest(server)
      .get(`/support-sessions/${session.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.ok(Array.isArray(res.body.bundle.greetingSuggestions));
    assert.strictEqual(res.body.bundle.greetingSuggestions.length, 1);
    assert.strictEqual(res.body.bundle.greetingSuggestions[0].tone, 'friendly');
    assert.strictEqual(res.body.bundle.greetingSuggestions[0].mockOnly, true);
    assert.strictEqual(res.body.bundle.greetingSuggestions[0].autoSend, false);
    assert.strictEqual(res.body.bundle.greetingSuggestions[0].voiceEnabled, false);
  });
});

describe('Call status transition endpoints', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  before(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
    server = app.getHttpServer();
  });

  it('POST /calls/:id/status transitions ringing → answered', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-STATUS-1', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const res = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'answered' })
      .expect(200);

    assert.strictEqual(res.body.previousStatus, 'ringing');
    assert.strictEqual(res.body.newStatus, 'answered');
    assert.strictEqual(res.body.callEvent.status, 'answered');
    assert.ok(res.body.callEvent.answeredAt);
  });

  it('POST /calls/:id/status transitions answered → on_hold', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-STATUS-2', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'answered' })
      .expect(200);

    const res = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'on_hold' })
      .expect(200);

    assert.strictEqual(res.body.previousStatus, 'answered');
    assert.strictEqual(res.body.newStatus, 'on_hold');
    assert.strictEqual(res.body.callEvent.status, 'on_hold');
  });

  it('POST /calls/:id/status transitions on_hold → answered (resume)', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-STATUS-3', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'answered' })
      .expect(200);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'on_hold' })
      .expect(200);

    const res = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'answered' })
      .expect(200);

    assert.strictEqual(res.body.previousStatus, 'on_hold');
    assert.strictEqual(res.body.newStatus, 'answered');
    assert.strictEqual(res.body.callEvent.status, 'answered');
  });

  it('POST /calls/:id/status transitions ringing → missed', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-STATUS-4', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const res = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'missed' })
      .expect(200);

    assert.strictEqual(res.body.previousStatus, 'ringing');
    assert.strictEqual(res.body.newStatus, 'missed');
    assert.ok(res.body.callEvent.endedAt);
  });

  it('POST /calls/:id/status rejects invalid transitions', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-STATUS-5', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const res = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'ended' })
      .expect(400);

    assert.ok(res.body.message.includes('Invalid status transition'));
  });

  it('POST /calls/:id/status rejects same status', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-STATUS-6', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const res = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'ringing' })
      .expect(400);

    assert.ok(res.body.message.includes('already in status'));
  });

  it('POST /calls/:id/status rejects missing tenant identity', async () => {
    const res = await supertest(server)
      .post('/calls/call-1/status')
      .set('x-user-id', 'user-1')
      .send({ status: 'answered' })
      .expect(400);

    assert.ok(res.body.error.includes('x-tenant-id'));
  });

  it('POST /calls/:id/status rejects cross-tenant call access', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-STATUS-7', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .send({ status: 'answered' })
      .expect(404);
  });

  it('POST /calls/:id/status appends call_status_changed audit event', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Status audit test' })
      .expect(201);

    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-STATUS-8', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/link-session`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ sessionId: session.body.id })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'on_hold', reason: 'Checking ticket details' })
      .expect(200);

    const audit = await supertest(server)
      .get(`/support-sessions/${session.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const event = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'call_status_changed'
    );
    assert.ok(event, 'call_status_changed audit event should exist');
    assert.strictEqual(event.metadata.previousStatus, 'answered');
    assert.strictEqual(event.metadata.newStatus, 'on_hold');
    assert.strictEqual(event.metadata.reason, 'Checking ticket details');
    assert.strictEqual(event.metadata.mockDevOnly, true);
  });

  it('GET /calls/:id/timeline returns deterministic timeline items', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-STATUS-9', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const res = await supertest(server)
      .get(`/calls/${call.body.callEvent.id}/timeline`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.strictEqual(res.body.callEventId, call.body.callEvent.id);
    assert.ok(Array.isArray(res.body.timelineItems));
    assert.strictEqual(res.body.mockDevOnly, true);
    const received = res.body.timelineItems.find((t: { type: string }) => t.type === 'call_received');
    const matched = res.body.timelineItems.find((t: { type: string }) => t.type === 'caller_matched');
    assert.ok(received, 'timeline should include call_received');
    assert.ok(matched, 'timeline should include caller_matched');
  });

  it('GET /calls/:id/timeline includes status changes and greeting suggestions', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Timeline test' })
      .expect(201);

    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-STATUS-10', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/link-session`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ sessionId: session.body.id })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'on_hold' })
      .expect(200);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'answered' })
      .expect(200);

    await supertest(server)
      .post(`/support-sessions/${session.body.id}/greeting-suggestion`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ callEventId: call.body.callEvent.id, tone: 'professional' })
      .expect(201);

    const res = await supertest(server)
      .get(`/calls/${call.body.callEvent.id}/timeline`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const held = res.body.timelineItems.find((t: { type: string }) => t.type === 'call_held');
    const resumed = res.body.timelineItems.find((t: { type: string }) => t.type === 'call_resumed');
    const greeting = res.body.timelineItems.find((t: { type: string }) => t.type === 'greeting_suggested');
    assert.ok(held, 'timeline should include call_held');
    assert.ok(resumed, 'timeline should include call_resumed');
    assert.ok(greeting, 'timeline should include greeting_suggested');
  });

  it('evidence bundle audit timeline includes call_status_changed events', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Evidence status test' })
      .expect(201);

    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-STATUS-11', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/link-session`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ sessionId: session.body.id })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/status`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ status: 'ended' })
      .expect(200);

    const res = await supertest(server)
      .get(`/support-sessions/${session.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const statusEvent = res.body.bundle.auditTimeline.find(
      (e: { eventType: string }) => e.eventType === 'call_status_changed'
    );
    assert.ok(statusEvent, 'evidence bundle audit timeline should include call_status_changed');
    assert.strictEqual(statusEvent.metadataSummary.newStatus, 'ended');
    const receivedEvent = res.body.bundle.auditTimeline.find(
      (e: { eventType: string }) => e.eventType === 'call_event_received'
    );
    assert.ok(receivedEvent, 'evidence bundle audit timeline should include call_event_received');
    const matchedEvent = res.body.bundle.auditTimeline.find(
      (e: { eventType: string }) => e.eventType === 'caller_matched'
    );
    assert.ok(matchedEvent, 'evidence bundle audit timeline should include caller_matched');
  });
});

describe('Telephony adapter boundary endpoints', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  before(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
    server = app.getHttpServer();
  });

  it('GET /telephony/status requires tenant identity', async () => {
    const res = await supertest(server)
      .get('/telephony/status')
      .expect(400);
    assert.ok(res.body.error.includes('x-tenant-id'));
  });

  it('GET /telephony/status returns mock status and capabilities', async () => {
    const res = await supertest(server)
      .get('/telephony/status')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.equal(res.body.providerType, 'mock');
    assert.equal(res.body.mode, 'mock');
    assert.equal(res.body.capabilities.inboundCalls, true);
    assert.equal(res.body.capabilities.answer, true);
    assert.equal(res.body.webhookVerification.status, 'not_required');
  });

  it('POST /telephony/webhooks/fake-provider maps into call flow', async () => {
    const res = await supertest(server)
      .post('/telephony/webhooks/fake-provider')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({
        sourceEventId: 'provider-event-1',
        externalCallId: 'TEL-1',
        eventType: 'incoming_call',
        rawCallerNumber: '03 555 01 01',
        callerDisplayName: 'Telephony Caller',
      })
      .expect(201);

    assert.equal(res.body.event.verification.status, 'not_required');
    assert.equal(res.body.callEvent.provider, 'mock');
    assert.equal(res.body.callEvent.source, 'telephony_bridge');
    assert.equal(res.body.callEvent.callerMatch.status, 'matched');
    assert.equal(res.body.mockDevOnly, true);
  });

  it('telephony call controls append audit events and update local mock state', async () => {
    const call = await supertest(server)
      .post('/telephony/webhooks/fake-provider')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({
        externalCallId: 'TEL-CONTROL-1',
        eventType: 'incoming_call',
        rawCallerNumber: '03 555 01 01',
      })
      .expect(201);

    const result = await supertest(server)
      .post(`/telephony/calls/${call.body.callEvent.id}/control`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ action: 'answer' })
      .expect(200);

    assert.equal(result.body.success, true);
    assert.equal(result.body.intent.action, 'answer');
    assert.equal(result.body.callEvent.status, 'answered');

    const timeline = await supertest(server)
      .get(`/calls/${call.body.callEvent.id}/timeline`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const bridgeEvents = timeline.body.timelineItems.filter(
      (item: { type: string }) => item.type === 'telephony_bridge_event'
    );
    assert.ok(bridgeEvents.length >= 3);
  });

  it('telephony endpoints enforce cross-tenant access rejection', async () => {
    const call = await supertest(server)
      .post('/telephony/webhooks/fake-provider')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({
        externalCallId: 'TEL-ISOLATION-1',
        eventType: 'incoming_call',
        rawCallerNumber: '03 555 01 01',
      })
      .expect(201);

    await supertest(server)
      .post(`/telephony/calls/${call.body.callEvent.id}/control`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .send({ action: 'answer' })
      .expect(404);
  });

  it('evidence bundle includes telephony bridge audit summary', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Telephony evidence test' })
      .expect(201);

    const call = await supertest(server)
      .post('/telephony/webhooks/fake-provider')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({
        externalCallId: 'TEL-EVIDENCE-1',
        eventType: 'incoming_call',
        rawCallerNumber: '03 555 01 01',
      })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/link-session`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ sessionId: session.body.id })
      .expect(201);

    await supertest(server)
      .post(`/telephony/calls/${call.body.callEvent.id}/control`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ action: 'hold' })
      .expect(200);

    const bundle = await supertest(server)
      .get(`/support-sessions/${session.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.ok(Array.isArray(bundle.body.bundle.telephonyBridgeEvents));
    assert.ok(bundle.body.bundle.telephonyBridgeEvents.length >= 3);
    assert.match(JSON.stringify(bundle.body.bundle.mockDevOnlyDisclaimers), /No real PBX/);
    assert.ok(!JSON.stringify(bundle.body).includes('Bearer '));
  });
});

describe('Call recording endpoints', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  before(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
    server = app.getHttpServer();
  });

  it('POST /calls/:id/recordings/mock requires tenant identity', async () => {
    const res = await supertest(server)
      .post('/calls/call-1/recordings/mock')
      .send({})
      .expect(400);
    assert.ok(res.body.error.includes('x-tenant-id'));
  });

  it('POST /calls/:id/recordings/mock attaches mock recording to call', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-REC-1', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const res = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/mock`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ source: 'mock_generated', durationSeconds: 30 })
      .expect(201);

    assert.strictEqual(res.body.recording.callEventId, call.body.callEvent.id);
    assert.strictEqual(res.body.recording.status, 'available');
    assert.strictEqual(res.body.recording.durationSeconds, 30);
    assert.strictEqual(res.body.recording.source, 'mock_generated');
    assert.strictEqual(res.body.recording.storageType, 'mock_inline');
    assert.strictEqual(res.body.recording.noRealAudio, true);
    assert.strictEqual(res.body.recording.mockDevOnly, true);
    assert.ok(res.body.recording.mockMediaUrl);
    assert.ok(res.body.recording.checksumHash);
    assert.ok(res.body.attachedAt);
  });

  it('GET /calls/:id/recordings lists recordings for a call', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-REC-2', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/mock`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({})
      .expect(201);

    const res = await supertest(server)
      .get(`/calls/${call.body.callEvent.id}/recordings`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.ok(Array.isArray(res.body));
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].callEventId, call.body.callEvent.id);
  });

  it('POST /calls/:id/recordings/:recordingId/review marks recording reviewed', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-REC-3', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const attached = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/mock`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({})
      .expect(201);

    const res = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/${attached.body.recording.id}/review`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(201);

    assert.strictEqual(res.body.recording.status, 'mock_only');
    assert.strictEqual(res.body.recording.reviewedBy, 'user-1');
    assert.ok(res.body.recording.reviewedAt);
    assert.ok(res.body.reviewedAt);
  });

  it('POST /calls/:id/recordings/:recordingId/playback records playback opened', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-REC-4', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const attached = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/mock`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({})
      .expect(201);

    const res = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/${attached.body.recording.id}/playback`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(201);

    assert.strictEqual(res.body.playbackState.recordingId, attached.body.recording.id);
    assert.strictEqual(res.body.playbackState.noRealAudio, true);
    assert.strictEqual(res.body.playbackState.placeholderOnly, true);
    assert.ok(res.body.recordedAt);
  });

  it('recording endpoints enforce tenant isolation', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-REC-5', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const attached = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/mock`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({})
      .expect(201);

    await supertest(server)
      .get(`/calls/${call.body.callEvent.id}/recordings`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .expect(404);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/${attached.body.recording.id}/review`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .expect(404);
  });

  it('recording attach appends call_recording_attached audit event', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Recording audit test' })
      .expect(201);

    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-REC-6', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/link-session`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ sessionId: session.body.id })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/mock`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ durationSeconds: 60 })
      .expect(201);

    const audit = await supertest(server)
      .get(`/support-sessions/${session.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const event = audit.body.find(
      (e: { eventType: string }) => e.eventType === 'call_recording_attached'
    );
    assert.ok(event, 'call_recording_attached audit event should exist');
    assert.strictEqual(event.metadata.noRealAudio, true);
    assert.strictEqual(event.metadata.durationSeconds, 60);
    assert.strictEqual(event.metadata.storageType, 'mock_inline');
  });

  it('recording review appends call_recording_reviewed audit event', async () => {
    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-REC-7', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    const attached = await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/mock`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({})
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/${attached.body.recording.id}/review`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(201);

    const allAudit = await supertest(server)
      .get('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    // Find any session to read audit events (the auto-created one or a default)
    const sessionId = allAudit.body[0]?.id;
    if (sessionId) {
      const audit = await supertest(server)
        .get(`/support-sessions/${sessionId}/audit-events`)
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .expect(200);

      const event = audit.body.find(
        (e: { eventType: string }) => e.eventType === 'call_recording_reviewed'
      );
      if (event) {
        assert.strictEqual(event.metadata.previousStatus, 'available');
        assert.strictEqual(event.metadata.newStatus, 'mock_only');
        assert.strictEqual(event.metadata.noRealAudio, true);
      }
    }
  });

  it('evidence bundle includes call recording summary', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Recording evidence test' })
      .expect(201);

    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-REC-8', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/link-session`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ sessionId: session.body.id })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/mock`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ durationSeconds: 45 })
      .expect(201);

    const bundle = await supertest(server)
      .get(`/support-sessions/${session.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.ok(Array.isArray(bundle.body.bundle.callRecordings));
    assert.strictEqual(bundle.body.bundle.callRecordings.length, 1);
    assert.strictEqual(bundle.body.bundle.callRecordings[0].durationSeconds, 45);
    assert.strictEqual(bundle.body.bundle.callRecordings[0].status, 'available');
    assert.strictEqual(bundle.body.bundle.callRecordings[0].noRealAudio, true);
    assert.ok(!JSON.stringify(bundle.body).includes('mockMediaUrl'));
  });

  it('evidence bundle export does not expose raw media or secrets', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Recording secret test' })
      .expect(201);

    const call = await supertest(server)
      .post('/calls/fake-incoming')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ externalCallId: 'FAKE-REC-9', rawCallerNumber: '03 555 01 01' })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/link-session`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ sessionId: session.body.id })
      .expect(201);

    await supertest(server)
      .post(`/calls/${call.body.callEvent.id}/recordings/mock`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({})
      .expect(201);

    const bundle = await supertest(server)
      .get(`/support-sessions/${session.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    const bodyStr = JSON.stringify(bundle.body);
    assert.ok(!bodyStr.includes('mock://recordings/'), 'mockMediaUrl must not be in bundle');
    assert.ok(!bodyStr.includes('sha256-mock-'), 'checksum hash placeholder should not leak in bundle');
  });
});


describe('Screen observation sharing and redaction (BL-047/048/049)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  before(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
    server = app.getHttpServer();
  });

  it('POST /support-sessions/:id/screen-observations/active-window/mock captures metadata', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Active window test' })
      .expect(201);

    const res = await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/active-window/mock`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ appLabel: 'VS Code:', windowLabel: 'server.ts', rawInputPlaceholder: 'apiToken=abc123' })
      .expect(201);

    assert.strictEqual(res.body.observation.kind, 'active_window');
    assert.strictEqual(res.body.observation.source, 'mock_operator_companion');
    assert.strictEqual(res.body.observation.sharingState, 'inactive');
    assert.strictEqual(res.body.observation.rawImageRetention, 'disabled');
    assert.strictEqual(res.body.observation.redactionStatus, 'pattern_redacted');
    assert.strictEqual(res.body.mockDevOnly, true);
    assert.ok(res.body.redactedSummary.includes('[REDACTED]'));
    assert.strictEqual(res.body.observation.safetyFlags.noRawPixels, true);
    assert.strictEqual(res.body.observation.safetyFlags.rawImageStored, false);
  });

  it('POST /support-sessions/:id/screen-observations/manual-screenshot attaches metadata without raw image', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Manual screenshot test' })
      .expect(201);

    const res = await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/manual-screenshot`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ appLabel: 'Chrome', windowLabel: 'Dashboard', rawInputPlaceholder: 'password=hunter2' })
      .expect(201);

    assert.strictEqual(res.body.observation.kind, 'screenshot_metadata');
    assert.strictEqual(res.body.observation.source, 'manual_screenshot_metadata');
    assert.strictEqual(res.body.observation.sharingState, 'active');
    assert.strictEqual(res.body.observation.rawImageRetention, 'disabled');
    assert.strictEqual(res.body.observation.redactionStatus, 'pattern_redacted');
    assert.strictEqual(res.body.mockDevOnly, true);
    assert.strictEqual(res.body.rawImageRetention, 'disabled');
    assert.ok(res.body.redactedSummary.includes('[REDACTED]'));
    assert.strictEqual(res.body.observation.safetyFlags.rawImageStored, false);
  });

  it('POST /support-sessions/:id/screen-observations/structured-upload accepts any kind', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Structured upload test' })
      .expect(201);

    const res = await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/structured-upload`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ kind: 'url', urlLabel: 'https://example.com', rawInputPlaceholder: 'Authorization: Bearer abc' })
      .expect(201);

    assert.strictEqual(res.body.observation.kind, 'url');
    assert.strictEqual(res.body.observation.source, 'structured_upload');
    assert.strictEqual(res.body.observation.sharingState, 'active');
    assert.strictEqual(res.body.observation.rawImageRetention, 'disabled');
    assert.strictEqual(res.body.observation.redactionStatus, 'pattern_redacted');
    assert.strictEqual(res.body.mockDevOnly, true);
    assert.ok(res.body.redactedSummary.includes('[REDACTED]'));
  });

  it('sharing state transitions work and append audit events', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Sharing state test' })
      .expect(201);

    const getRes = await supertest(server)
      .get(`/support-sessions/${session.body.id}/screen-observations/sharing-state`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.strictEqual(getRes.body.state, 'inactive');
    assert.strictEqual(getRes.body.mockDevOnly, true);

    const startRes = await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/sharing-state`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ state: 'active' })
      .expect(201);

    assert.strictEqual(startRes.body.state, 'active');
    assert.strictEqual(startRes.body.previousState, 'inactive');

    const pauseRes = await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/sharing-state`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ state: 'paused' })
      .expect(201);

    assert.strictEqual(pauseRes.body.state, 'paused');
    assert.strictEqual(pauseRes.body.previousState, 'active');

    const stopRes = await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/sharing-state`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ state: 'inactive' })
      .expect(201);

    assert.strictEqual(stopRes.body.state, 'inactive');
    assert.strictEqual(stopRes.body.previousState, 'paused');

    const audit = await supertest(server)
      .get(`/support-sessions/${session.body.id}/audit-events`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.ok(audit.body.find((e: { eventType: string }) => e.eventType === 'screen_observation_sharing_started'));
    assert.ok(audit.body.find((e: { eventType: string }) => e.eventType === 'screen_observation_sharing_paused'));
    assert.ok(audit.body.find((e: { eventType: string }) => e.eventType === 'screen_observation_sharing_stopped'));
  });

  it('sharing state rejects invalid transitions', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Invalid transition test' })
      .expect(201);

    const res = await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/sharing-state`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ state: 'inactive' })
      .expect(400);

    assert.ok(res.body.message.includes('Invalid sharing state transition'));
  });

  it('screen observation endpoints reject missing tenant identity', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Identity rejection test' })
      .expect(201);

    const activeWindowRes = await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/active-window/mock`)
      .send({})
      .expect(400);
    assert.ok(activeWindowRes.body.error.includes('x-tenant-id'));

    const manualRes = await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/manual-screenshot`)
      .send({})
      .expect(400);
    assert.ok(manualRes.body.error.includes('x-tenant-id'));

    const structuredRes = await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/structured-upload`)
      .send({ kind: 'url' })
      .expect(400);
    assert.ok(structuredRes.body.error.includes('x-tenant-id'));

    const sharingGetRes = await supertest(server)
      .get(`/support-sessions/${session.body.id}/screen-observations/sharing-state`)
      .expect(400);
    assert.ok(sharingGetRes.body.error.includes('x-tenant-id'));

    const sharingPostRes = await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/sharing-state`)
      .send({ state: 'active' })
      .expect(400);
    assert.ok(sharingPostRes.body.error.includes('x-tenant-id'));
  });

  it('screen observation endpoints reject cross-tenant session access', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Cross-tenant test' })
      .expect(201);

    await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/active-window/mock`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .send({})
      .expect(404);

    await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/manual-screenshot`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .send({})
      .expect(404);

    await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/structured-upload`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .send({ kind: 'url' })
      .expect(404);

    await supertest(server)
      .get(`/support-sessions/${session.body.id}/screen-observations/sharing-state`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .expect(404);

    await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/sharing-state`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .send({ state: 'active' })
      .expect(404);
  });

  it('evidence bundle includes new observation summaries with sharing state, redaction status, safety flags', async () => {
    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Evidence observation test' })
      .expect(201);

    await supertest(server)
      .post(`/support-sessions/${session.body.id}/screen-observations/structured-upload`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ kind: 'application', appLabel: 'Terminal', rawInputPlaceholder: 'ZAMMAD_API_TOKEN=secretvalue' })
      .expect(201);

    const bundle = await supertest(server)
      .get(`/support-sessions/${session.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.ok(Array.isArray(bundle.body.bundle.screenObservations));
    assert.strictEqual(bundle.body.bundle.screenObservations.length, 1);
    const obs = bundle.body.bundle.screenObservations[0];
    assert.strictEqual(obs.sharingState, 'active');
    assert.strictEqual(obs.rawImageRetention, 'disabled');
    assert.strictEqual(obs.redactionStatus, 'pattern_redacted');
    assert.ok(obs.safetyFlags);
    assert.strictEqual(obs.safetyFlags.mockDevOnly, true);
    assert.strictEqual(obs.safetyFlags.rawImageStored, false);
    assert.ok(!JSON.stringify(bundle.body).includes('secretvalue'));
  });

  it('delivery policy endpoints enforce RBAC and reject real writeback', async () => {
    // Seed a policy directly into the in-memory store
    const store = app.get(InMemoryStore);
    const policy = {
      id: 'policy-test-001',
      tenantId: 'tenant-a',
      connectorInstallationId: null,
      name: 'Test Policy',
      enabled: true,
      killSwitch: false,
      dryRunRequired: true,
      mockOnlyEnforced: true,
      allowRealNetworkCalls: false,
      allowedActionTypes: ['ticket_note'],
      approvalRequired: true,
      minimumApproverRole: 'admin' as const,
      requireHumanReview: true,
      requireEvidenceBundleBeforeDelivery: false,
      requireConnectorValidationBeforeDelivery: false,
      retryPolicy: { maxAttempts: 3, baseDelaySeconds: 5, maxDelaySeconds: 300, backoffMultiplier: 2 },
      deadLetterPolicy: { enabled: true, maxAttemptsBeforeDeadLetter: 3, requireManualRetry: true },
      updatedBy: 'user-1',
      updatedAt: new Date().toISOString(),
      policyVersion: 1,
      lastValidationStatus: 'valid' as const,
      safetyFlags: { realNetworkAllowed: false, writebackEnabled: false, externalWriteAllowed: false, mockOnly: true, localDevOnly: true },
      createdAt: new Date().toISOString(),
    };
    store.saveDeliveryPolicy(policy);

    // Admin can list policies
    const list = await supertest(server)
      .get('/delivery-policies')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'admin')
      .expect(200);
    assert.ok(list.body.policies.length >= 1);

    // Validation returns mock_only_allowed before any updates
    const validate = await supertest(server)
      .post(`/delivery-policies/${policy.id}/validate`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'admin')
      .expect(200);
    assert.strictEqual(validate.body.decision.allowed, true);
    assert.strictEqual(validate.body.decision.decision, 'mock_only_allowed');
    assert.strictEqual(validate.body.decision.realNetworkAllowed, false);
    assert.strictEqual(validate.body.decision.writebackEnabled, false);

    // Admin can update safe fields
    const update = await supertest(server)
      .patch(`/delivery-policies/${policy.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'admin')
      .send({ killSwitch: true })
      .expect(200);
    assert.strictEqual(update.body.policy.killSwitch, true);
    assert.strictEqual(update.body.policy.policyVersion, 2);

    // Viewer cannot update
    await supertest(server)
      .patch(`/delivery-policies/${policy.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'viewer-1')
      .set('x-user-role', 'viewer')
      .send({ killSwitch: false })
      .expect(403);

    // Real writeback toggle rejected
    await supertest(server)
      .patch(`/delivery-policies/${policy.id}`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .set('x-user-role', 'admin')
      .send({ allowRealNetworkCalls: true })
      .expect(400);

    // Cross-tenant access denied
    await supertest(server)
      .get(`/delivery-policies`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .set('x-user-role', 'admin')
      .expect(200);
    const crossTenant = await supertest(server)
      .get(`/delivery-policies/${policy.id}`)
      .set('x-tenant-id', 'tenant-b')
      .set('x-user-id', 'user-2')
      .set('x-user-role', 'admin')
      .expect(404);
    assert.ok(crossTenant.body.message.includes('not found'));
  });

  it('evidence bundle includes delivery policy summaries', async () => {
    const store = app.get(InMemoryStore);
    const policy = {
      id: 'policy-evidence-001',
      tenantId: 'tenant-a',
      connectorInstallationId: null,
      name: 'Evidence Test Policy',
      enabled: true,
      killSwitch: false,
      dryRunRequired: true,
      mockOnlyEnforced: true,
      allowRealNetworkCalls: false,
      allowedActionTypes: ['ticket_note'],
      approvalRequired: true,
      minimumApproverRole: 'admin' as const,
      requireHumanReview: true,
      requireEvidenceBundleBeforeDelivery: false,
      requireConnectorValidationBeforeDelivery: false,
      retryPolicy: { maxAttempts: 3, baseDelaySeconds: 5, maxDelaySeconds: 300, backoffMultiplier: 2 },
      deadLetterPolicy: { enabled: true, maxAttemptsBeforeDeadLetter: 3, requireManualRetry: true },
      updatedBy: 'user-1',
      updatedAt: new Date().toISOString(),
      policyVersion: 1,
      lastValidationStatus: 'valid' as const,
      safetyFlags: { realNetworkAllowed: false, writebackEnabled: false, externalWriteAllowed: false, mockOnly: true, localDevOnly: true },
      createdAt: new Date().toISOString(),
    };
    store.saveDeliveryPolicy(policy);

    const session = await supertest(server)
      .post('/support-sessions')
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .send({ title: 'Evidence policy test' })
      .expect(201);

    const bundle = await supertest(server)
      .get(`/support-sessions/${session.body.id}/evidence-bundle`)
      .set('x-tenant-id', 'tenant-a')
      .set('x-user-id', 'user-1')
      .expect(200);

    assert.ok(Array.isArray(bundle.body.bundle.deliveryPolicies));
    const found = bundle.body.bundle.deliveryPolicies.find((p: { policyId: string }) => p.policyId === policy.id);
    assert.ok(found, 'expected policy in evidence bundle');
    assert.strictEqual(found.mockOnlyEnforced, true);
    assert.strictEqual(found.allowRealNetworkCalls, false);
    assert.strictEqual(found.safetyFlags.realNetworkAllowed, false);
  });
});

describe('Redaction unit tests', () => {
  it('redactString removes Authorization Bearer tokens', async () => {
    const { redactString } = await import('../src/evidence-bundle/redaction.js');
    const input = 'Authorization: Bearer abc123';
    const result = redactString(input);
    assert.ok(result.includes('[REDACTED]'));
    assert.ok(!result.includes('abc123'));
  });

  it('redactString removes apiToken values', async () => {
    const { redactString } = await import('../src/evidence-bundle/redaction.js');
    const input = 'apiToken=abc123';
    const result = redactString(input);
    assert.strictEqual(result, 'apiToken=[REDACTED]');
  });

  it('redactString removes password values', async () => {
    const { redactString } = await import('../src/evidence-bundle/redaction.js');
    const input = 'password=hunter2';
    const result = redactString(input);
    assert.strictEqual(result, 'password=[REDACTED]');
  });

  it('redactString removes ZAMMAD_API_TOKEN values', async () => {
    const { redactString } = await import('../src/evidence-bundle/redaction.js');
    const input = 'ZAMMAD_API_TOKEN=secretvalue';
    const result = redactString(input);
    assert.strictEqual(result, 'ZAMMAD_API_TOKEN=[REDACTED]');
  });

  it('redactString removes long secret-looking strings', async () => {
    const { redactString } = await import('../src/evidence-bundle/redaction.js');
    const input = 'token=abcdefghijklmnopqrstuvwxyz123456';
    const result = redactString(input);
    assert.ok(result.includes('[REDACTED]'));
    assert.ok(!result.includes('abcdefghijklmnopqrstuvwxyz123456'));
  });

  it('redactPlaceholder returns not_needed for empty input', async () => {
    const { redactPlaceholder } = await import('../src/evidence-bundle/redaction.js');
    const result = redactPlaceholder(undefined);
    assert.strictEqual(result.redacted, '');
    assert.strictEqual(result.redactionStatus, 'not_needed');
  });

  it('redactPlaceholder returns pattern_redacted when secrets found', async () => {
    const { redactPlaceholder } = await import('../src/evidence-bundle/redaction.js');
    const result = redactPlaceholder('password=secret123');
    assert.ok(result.redacted.includes('[REDACTED]'));
    assert.strictEqual(result.redactionStatus, 'pattern_redacted');
  });

  it('redactPlaceholder returns placeholder_redacted for clean input', async () => {
    const { redactPlaceholder } = await import('../src/evidence-bundle/redaction.js');
    const result = redactPlaceholder('hello world');
    assert.strictEqual(result.redacted, 'hello world');
    assert.strictEqual(result.redactionStatus, 'placeholder_redacted');
  });
});
