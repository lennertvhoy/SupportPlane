import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { NestFactory } from '@nestjs/core';
import supertest from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';

describe('AI Services', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  before(async () => {
    app = await NestFactory.create(AppModule);
    await app.init();
    server = app.getHttpServer();
  });

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Draft suggestion', () => {
    it('returns 400 for invalid model selection provider', async () => {
      const created = await supertest(server)
        .post('/support-sessions')
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ title: 'Draft invalid provider test' })
        .expect(201);

      const res = await supertest(server)
        .post(`/support-sessions/${created.body.id}/draft-suggestion`)
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ modelSelection: { provider: 'openai', model: 'gpt-4' } })
        .expect(400);

      assert.ok(res.body.message.includes('AI provider unavailable') || res.body.message.includes('Invalid model selection'));
    });

    it('returns 404 for unknown session', async () => {
      const res = await supertest(server)
        .post('/support-sessions/not-a-session/draft-suggestion')
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(404);

      assert.ok(res.body.message.includes('not found'));
    });

    it('returns mock draft with metadata on success', async () => {
      const created = await supertest(server)
        .post('/support-sessions')
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ title: 'Draft success test' })
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
        .send({ operatorInstructions: 'Test', modelSelection: { provider: 'mock', model: 'mock-support-note-v1' } })
        .expect(201);

      assert.match(draft.body.draft, /MOCK AI DRAFT/);
      assert.equal(draft.body.provider, 'mock');
      assert.equal(draft.body.safety.mockOnly, true);
      assert.equal(draft.body.safety.writebackAllowed, false);
    });
  });

  describe('Ticket summary', () => {
    it('returns 400 for invalid model selection', async () => {
      const created = await supertest(server)
        .post('/support-sessions')
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ title: 'Summary invalid model test' })
        .expect(201);

      const res = await supertest(server)
        .post(`/support-sessions/${created.body.id}/ticket-summary`)
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ modelSelection: { provider: 'invalid' } })
        .expect(400);

      assert.ok(res.body.message.includes('Invalid model selection') || res.body.message.includes('AI provider unavailable'));
    });

    it('returns summary with metadata on success', async () => {
      const created = await supertest(server)
        .post('/support-sessions')
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ title: 'Summary success test' })
        .expect(201);

      await supertest(server)
        .post(`/support-sessions/${created.body.id}/ticket-context`)
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ externalTicketId: 'TICKET-101' })
        .expect(201);

      const summary = await supertest(server)
        .post(`/support-sessions/${created.body.id}/ticket-summary`)
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ modelSelection: { provider: 'mock', model: 'mock-support-note-v1' } })
        .expect(201);

      assert.ok(summary.body.summary);
      assert.equal(summary.body.provider, 'mock');
      assert.equal(summary.body.safety.mockOnly, true);
    });
  });

  describe('AI Chat', () => {
    const dbAvailable = !!process.env['DATABASE_URL'];

    it('creates a chat session and sends a message', { skip: !dbAvailable }, async () => {
      const session = await supertest(server)
        .post('/ai-chat/sessions')
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ title: 'Test chat' })
        .expect(201);

      const message = await supertest(server)
        .post(`/ai-chat/sessions/${session.body.id}/messages`)
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ content: 'Hello', role: 'user', modelSelection: { provider: 'mock', model: 'mock-support-note-v1' } })
        .expect(200);

      assert.ok(message.body.session);
      assert.ok(message.body.assistantMessage);
      assert.equal(message.body.assistantMessage.role, 'assistant');
    });

    it('returns 400 for invalid model selection in chat', { skip: !dbAvailable }, async () => {
      const session = await supertest(server)
        .post('/ai-chat/sessions')
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ title: 'Test chat invalid' })
        .expect(201);

      const res = await supertest(server)
        .post(`/ai-chat/sessions/${session.body.id}/messages`)
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ content: 'Hello', role: 'user', modelSelection: { provider: 'openai' } })
        .expect(400);

      assert.ok(res.body.message.includes('Invalid model selection') || res.body.message.includes('AI provider unavailable'));
    });

    it('returns 400 for invalid chat role', { skip: !dbAvailable }, async () => {
      const session = await supertest(server)
        .post('/ai-chat/sessions')
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ title: 'Test chat role' })
        .expect(201);

      const res = await supertest(server)
        .post(`/ai-chat/sessions/${session.body.id}/messages`)
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ content: 'Hello', role: 'hacker' })
        .expect(400);

      assert.ok(res.body.message.includes('Invalid chat role'));
    });

    it('skips chat tests when database is unavailable', { skip: dbAvailable }, async () => {
      // AI chat requires DATABASE_URL for session/message persistence.
      // This placeholder ensures the suite counts are stable across environments.
    });
  });
});
