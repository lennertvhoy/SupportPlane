import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { NestFactory } from '@nestjs/core';
import supertest from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';

describe('SupportPlane API (BL-003)', () => {
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
    const provenances = res.body.map((p: any) => p.provenance).sort();
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
});
