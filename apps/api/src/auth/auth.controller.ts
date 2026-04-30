import { Body, Controller, Get, Inject, Post, Req, Res, UnauthorizedException, UseGuards, BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { OidcService } from './oidc.service.js';
import { getCurrentIdentity } from './current-identity.middleware.js';
import { requirePermission } from './rbac.js';
import { RateLimitGuard } from '../common/rate-limit.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(OidcService) private readonly oidcService: OidcService,
  ) {}

  @Post('local/login')
  @UseGuards(RateLimitGuard)
  async login(
    @Body() body: { email?: string; password?: string; tenantSlug?: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(body.email ?? '', body.password ?? '', body.tenantSlug);
    if (!result) {
      throw new UnauthorizedException('Invalid local credentials');
    }
    res.cookie(this.authService.getSessionCookieName(), result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      expires: new Date(result.expiresAt),
    });
    return {
      identity: result.identity,
      expiresAt: result.expiresAt,
      authMode: 'local',
    };
  }

  @Get('me')
  me(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    return {
      identity,
      authMode: identity?.authMode ?? (process.env['SUPPORTPLANE_AUTH_MODE'] === 'local' ? 'local' : 'dev'),
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const identity = getCurrentIdentity(req);
    const localCookie = req.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${this.authService.getSessionCookieName()}=`))
      ?.slice(this.authService.getSessionCookieName().length + 1);
    const oidcCookie = req.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${this.oidcService.getSessionCookieName()}=`))
      ?.slice(this.oidcService.getSessionCookieName().length + 1);
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice('Bearer '.length)
      : undefined;
    await this.authService.logout(bearer ?? localCookie, identity);
    await this.authService.logoutOidcSession(oidcCookie, identity);
    res.clearCookie(this.authService.getSessionCookieName(), { path: '/' });
    res.clearCookie(this.oidcService.getSessionCookieName(), { path: '/' });
    return { loggedOut: true };
  }

  @Get('audit-events')
  async auditEvents(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:read');
    return this.authService.listTenantAuditEvents(identity);
  }

  // OIDC endpoints
  @Get('oidc/config')
  oidcConfig() {
    const config = this.authService.getOidcConfig();
    if (!config) {
      return {
        oidcEnabled: false,
        note: 'OIDC not configured. Set OIDC_ISSUER_URL, OIDC_CLIENT_ID, and OIDC_REDIRECT_URI environment variables.',
      };
    }
    return {
      oidcEnabled: true,
      issuerUrl: config.issuerUrl,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      note: 'OIDC configuration metadata. Browser login flow implemented.',
    };
  }

  @Get('oidc/login')
  @UseGuards(RateLimitGuard)
  async oidcLogin(@Res({ passthrough: true }) res: Response) {
    if (!this.oidcService.isOidcEnabled()) {
      throw new BadRequestException('OIDC is not configured');
    }
    const result = await this.oidcService.buildAuthorizationUrl();
    if (!result) {
      throw new BadRequestException('OIDC authorization URL could not be built');
    }
    // Store session ID in a short-lived cookie for callback correlation
    res.cookie('supportplane_oidc_state', result.sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 1000 * 60 * 10, // 10 minutes
    });
    return { redirectUrl: result.url };
  }

  @Get('oidc/callback')
  async oidcCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!this.oidcService.isOidcEnabled()) {
      throw new BadRequestException('OIDC is not configured');
    }
    const sessionId = req.cookies?.['supportplane_oidc_state'];
    if (!sessionId || typeof sessionId !== 'string') {
      throw new BadRequestException('Missing OIDC state cookie');
    }

    const callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const grantResult = await this.oidcService.authorizationCodeGrant(sessionId, callbackUrl);
    if (!grantResult) {
      throw new UnauthorizedException('OIDC authorization failed');
    }

    const { identity, rawToken, expiresAt } = grantResult;
    await this.authService.createOidcSession(
      identity,
      this.oidcService.hashToken(rawToken),
      identity.userId.replace('oidc-', ''),
      this.authService.getOidcConfig()?.issuerUrl ?? '',
      this.authService.getOidcConfig()?.clientId ?? '',
      expiresAt,
      identity.roles
    );

    res.cookie(this.oidcService.getSessionCookieName(), rawToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      expires: expiresAt,
    });
    res.clearCookie('supportplane_oidc_state', { path: '/' });

    // Redirect to web cockpit
    const webUrl = process.env['WEB_URL'] ?? 'http://localhost:3300';
    res.redirect(webUrl);
    return;
  }

  @Get('mfa/status')
  mfaStatus() {
    return {
      ...this.authService.getMfaHookStatus(),
      note: 'MFA hook status. Enforcement not implemented.',
    };
  }

  // Service account endpoints
  @Get('service-accounts')
  async serviceAccounts(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:read');
    const accounts = await this.authService.listServiceAccounts(identity.tenantId);
    return {
      accounts,
      ...this.authService.getServiceAccountHooks(),
    };
  }

  @Post('service-accounts')
  async createServiceAccount(
    @Req() req: Request,
    @Body() body: { name: string; description?: string; roles?: string[] }
  ) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:write');
    if (!body.name || body.name.length < 2) {
      throw new BadRequestException('Service account name is required');
    }
    return this.authService.createServiceAccount(identity.tenantId, body.name, body.description, body.roles);
  }

  @Post('service-accounts/:id/tokens')
  async createServiceAccountToken(
    @Req() req: Request,
    @Body() body: { scopes?: string[]; ttlHours?: number }
  ) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:write');
    const serviceAccountId = (req.params as Record<string, string>)['id'];
    const result = await this.authService.createServiceAccountToken(
      serviceAccountId,
      identity.tenantId,
      body.scopes,
      body.ttlHours
    );
    return {
      token: result.rawToken, // shown once only
      metadata: result.token,
      note: 'This is the only time the raw token is shown. Store it securely.',
    };
  }

  @Post('service-accounts/:id/revoke')
  async revokeServiceAccount(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:write');
    const serviceAccountId = (req.params as Record<string, string>)['id'];
    await this.authService.revokeServiceAccountToken(serviceAccountId, identity.tenantId);
    return { revoked: true };
  }
}
