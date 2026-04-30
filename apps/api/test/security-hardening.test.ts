import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Post, Body, UseGuards, INestApplication, ExecutionContext } from '@nestjs/common';
import supertest from 'supertest';
import type { Request, Response } from 'express';
import { AppModule } from '../src/app.module.js';
import { RateLimitGuard, RateLimitExceeded } from '../src/common/rate-limit.guard.js';
import { ValidateAdapterTypeGuard, ValidateTelephonyEventGuard } from '../src/common/validation.guard.js';
import { UnsafeFieldGuard } from '../src/common/unsafe-field.guard.js';
import { BodyLimitGuard } from '../src/common/body-limit.guard.js';
import { bodyLimitMiddleware } from '../src/common/body-limit.middleware.js';
import { evaluateEgressPolicy } from '@supportplane/policy';

// Inline test controllers for guard-specific tests
@Controller('test-guards')
class TestGuardsController {
  @Post('adapter-type')
  @UseGuards(ValidateAdapterTypeGuard)
  adapterType(@Body() body: { adapterType?: string }) {
    return { adapterType: body.adapterType };
  }

  @Post('telephony-event')
  @UseGuards(ValidateTelephonyEventGuard)
  telephonyEvent(@Body() _body: unknown) {
    return { received: true };
  }

  @Post('unsafe-field')
  @UseGuards(UnsafeFieldGuard)
  unsafeField(@Body() _body: unknown) {
    return { received: true };
  }
}

@Module({
  controllers: [TestGuardsController],
})
class TestGuardsModule {}

describe('BL-086 Security Hardening', () => {
  describe('Request body size limits', () => {
    it('middleware returns 413 when Content-Length exceeds limit', () => {
      const middleware = bodyLimitMiddleware();
      const req = { path: '/actions/test', headers: { 'content-length': String(1024 * 1024 * 2) } } as unknown as Request;
      let statusCode = 0;
      let responseBody: unknown;
      const res = {
        status: (code: number) => { statusCode = code; return res; },
        json: (b: unknown) => { responseBody = b; },
      } as unknown as Response;
      const next = () => {};
      middleware(req, res, next);
      assert.strictEqual(statusCode, 413);
      assert.strictEqual((responseBody as Record<string, string>).error, 'body_limit_exceeded');
      assert.ok((responseBody as Record<string, string>).limit);
    });

    it('guard returns false when Content-Length exceeds limit', () => {
      const guard = new BodyLimitGuard();
      const req = { path: '/actions/test', headers: { 'content-length': String(1024 * 1024 * 2) } } as unknown as Request;
      const res = { status: () => ({ json: () => {} }) } as unknown as Response;
      const context = {
        switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
      } as unknown as ExecutionContext;
      assert.strictEqual(guard.canActivate(context), false);
    });

    it('guard passes when Content-Length is within limit', () => {
      const guard = new BodyLimitGuard();
      const req = { path: '/actions/test', headers: { 'content-length': String(1024) } } as unknown as Request;
      const res = { status: () => ({ json: () => {} }) } as unknown as Response;
      const context = {
        switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
      } as unknown as ExecutionContext;
      assert.strictEqual(guard.canActivate(context), true);
    });
  });

  describe('Rate limiting', () => {
    it('guard allows requests within limit', () => {
      const guard = new RateLimitGuard();
      const req = { path: '/api/test', headers: {}, socket: { remoteAddress: '127.0.0.1' } } as unknown as Request;
      const context = {
        switchToHttp: () => ({ getRequest: () => req }),
      } as unknown as ExecutionContext;
      assert.strictEqual(guard.canActivate(context), true);
    });

    it('RateLimitExceeded exception carries retryAfter', () => {
      const exc = new RateLimitExceeded(42);
      assert.strictEqual(exc.getStatus(), 429);
      assert.deepStrictEqual(exc.getResponse(), { error: 'rate_limit_exceeded', retryAfter: 42 });
    });

    it('guard blocks after limit is exceeded', () => {
      const guard = new RateLimitGuard();
      const ip = '192.168.1.1';
      const path = '/auth/login';
      const req = { path, headers: {}, socket: { remoteAddress: ip } } as unknown as Request;
      const context = {
        switchToHttp: () => ({ getRequest: () => req }),
      } as unknown as ExecutionContext;

      // Exhaust the 5-per-minute auth/login bucket
      for (let i = 0; i < 5; i++) {
        assert.strictEqual(guard.canActivate(context), true);
      }

      // 6th request should be blocked
      assert.throws(() => guard.canActivate(context), (err: unknown) => {
        return err instanceof RateLimitExceeded;
      });
    });
  });

  describe('Invalid service token', () => {
    let app: INestApplication;
    let server: ReturnType<INestApplication['getHttpServer']>;
    const originalAuthMode = process.env['SUPPORTPLANE_AUTH_MODE'];

    before(async () => {
      process.env['SUPPORTPLANE_AUTH_MODE'] = 'local';
      app = await NestFactory.create(AppModule);
      await app.init();
      server = app.getHttpServer();
    });

    after(async () => {
      await app.close();
      if (originalAuthMode === undefined) {
        delete process.env['SUPPORTPLANE_AUTH_MODE'];
      } else {
        process.env['SUPPORTPLANE_AUTH_MODE'] = originalAuthMode;
      }
    });

    it('returns 401 for invalid service token on protected route', async () => {
      const res = await supertest(server)
        .get('/connectors/zammad/status')
        .set('x-supportplane-service-token', 'bad-token')
        .expect(401);

      assert.ok(res.body.message || res.body.error);
    });
  });

  describe('Invalid adapter type', () => {
    let app: INestApplication;
    let server: ReturnType<INestApplication['getHttpServer']>;

    before(async () => {
      app = await NestFactory.create(TestGuardsModule);
      await app.init();
      server = app.getHttpServer();
    });

    after(async () => {
      await app.close();
    });

    it('returns 400 for unknown adapter type', async () => {
      const res = await supertest(server)
        .post('/test-guards/adapter-type')
        .send({ adapterType: 'hacker-adaptor' })
        .expect(400);

      assert.strictEqual(res.body.error, 'validation_failed');
      assert.ok(res.body.reason.includes('Unknown adapter type'));
    });

    it('allows known adapter type', async () => {
      const res = await supertest(server)
        .post('/test-guards/adapter-type')
        .send({ adapterType: 'zammad' })
        .expect(201);

      assert.strictEqual(res.body.adapterType, 'zammad');
    });
  });

  describe('Blocked egress URL', () => {
    it('blocks production-like URLs via evaluateEgressPolicy', () => {
      const decision = evaluateEgressPolicy({
        tenantId: 'tenant-a',
        connectorType: 'zammad',
        operation: 'read',
        url: 'https://support.zendesk.com/api/v2',
      });

      assert.strictEqual(decision.allowed, false);
      assert.strictEqual(decision.decision, 'blocked_production_like_url');
    });

    it('blocks external URLs not on sandbox allowlist', () => {
      const decision = evaluateEgressPolicy({
        tenantId: 'tenant-a',
        connectorType: 'zammad',
        operation: 'read',
        url: 'https://evil.example.com/api',
      });

      assert.strictEqual(decision.allowed, false);
      assert.strictEqual(decision.decision, 'blocked_external_url');
    });
  });

  describe('Viewer cannot approve', () => {
    let app: INestApplication;
    let server: ReturnType<INestApplication['getHttpServer']>;

    before(async () => {
      app = await NestFactory.create(AppModule);
      await app.init();
      server = app.getHttpServer();
    });

    after(async () => {
      await app.close();
    });

    it('returns 403 when viewer tries to approve an action', async () => {
      const created = await supertest(server)
        .post('/support-sessions')
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .set('x-user-role', 'operator')
        .send({ title: 'Viewer approval test' })
        .expect(201);

      const actionCreated = await supertest(server)
        .post(`/support-sessions/${created.body.id}/actions`)
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .set('x-user-role', 'operator')
        .send({ actionType: 'ticket_note', externalTicketId: 'T-1', body: 'Draft' })
        .expect(201);

      await supertest(server)
        .post(`/actions/${actionCreated.body.action.id}/submit-for-review`)
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .set('x-user-role', 'operator')
        .send({})
        .expect(201);

      const res = await supertest(server)
        .post(`/actions/${actionCreated.body.action.id}/approve`)
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'viewer-1')
        .set('x-user-role', 'viewer')
        .send({ reason: 'Looks safe' })
        .expect(403);

      assert.ok(res.body.message || res.body.error);
    });
  });

  describe('Cross-tenant access denied', () => {
    let app: INestApplication;
    let server: ReturnType<INestApplication['getHttpServer']>;

    before(async () => {
      app = await NestFactory.create(AppModule);
      await app.init();
      server = app.getHttpServer();
    });

    after(async () => {
      await app.close();
    });

    it('returns 404 for cross-tenant support session access', async () => {
      const created = await supertest(server)
        .post('/support-sessions')
        .set('x-tenant-id', 'tenant-a')
        .set('x-user-id', 'user-1')
        .send({ title: 'Cross-tenant test' })
        .expect(201);

      await supertest(server)
        .get(`/support-sessions/${created.body.id}`)
        .set('x-tenant-id', 'tenant-b')
        .set('x-user-id', 'user-2')
        .expect(404);
    });
  });

  describe('Telephony event validation', () => {
    let app: INestApplication;
    let server: ReturnType<INestApplication['getHttpServer']>;

    before(async () => {
      app = await NestFactory.create(TestGuardsModule);
      await app.init();
      server = app.getHttpServer();
    });

    after(async () => {
      await app.close();
    });

    it('rejects missing callerNumber', async () => {
      const res = await supertest(server)
        .post('/test-guards/telephony-event')
        .send({ eventType: 'newchannel', calleeNumber: '123' })
        .expect(400);

      assert.strictEqual(res.body.error, 'validation_failed');
      assert.ok(res.body.field);
    });

    it('rejects missing eventType', async () => {
      const res = await supertest(server)
        .post('/test-guards/telephony-event')
        .send({ callerNumber: '123', calleeNumber: '456' })
        .expect(400);

      assert.strictEqual(res.body.error, 'validation_failed');
      assert.ok(res.body.field);
    });

    it('accepts valid telephony event', async () => {
      const res = await supertest(server)
        .post('/test-guards/telephony-event')
        .send({ callerNumber: '123', calleeNumber: '456', eventType: 'newchannel', externalCallId: 'call-1' })
        .expect(201);

      assert.strictEqual(res.body.received, true);
    });
  });

  describe('Unsafe field guard', () => {
    let app: INestApplication;
    let server: ReturnType<INestApplication['getHttpServer']>;

    before(async () => {
      app = await NestFactory.create(TestGuardsModule);
      await app.init();
      server = app.getHttpServer();
    });

    after(async () => {
      await app.close();
    });

    it('rejects __proto__ in body via guard directly', () => {
      // Body-parser strips __proto__ before it reaches the guard,
      // so we test the guard logic directly with a mocked request.
      const guard = new UnsafeFieldGuard();
      const req = { body: JSON.parse('{"__proto__": {"polluted": true}}') } as unknown as Request;
      const context = {
        switchToHttp: () => ({ getRequest: () => req }),
      } as unknown as ExecutionContext;

      assert.throws(() => guard.canActivate(context), (err: unknown) => {
        return (err as { response?: { error?: string; reason?: string } }).response?.error === 'validation_failed';
      });
    });

    it('rejects connector config with eval string', async () => {
      const res = await supertest(server)
        .post('/test-guards/unsafe-field')
        .send({ config: { script: 'eval(process.env)' } })
        .expect(400);

      assert.strictEqual(res.body.error, 'validation_failed');
      assert.ok(res.body.reason.includes('unsafe strings'));
    });

    it('allows safe body', async () => {
      const res = await supertest(server)
        .post('/test-guards/unsafe-field')
        .send({ name: 'safe', config: { url: 'http://localhost' } })
        .expect(201);

      assert.strictEqual(res.body.received, true);
    });
  });
});
