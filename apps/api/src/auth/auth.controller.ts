import { Body, Controller, Get, Inject, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { getCurrentIdentity } from './current-identity.middleware.js';
import { requirePermission } from './rbac.js';
import { RateLimitGuard } from '../common/rate-limit.guard.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

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
    return {
      identity: getCurrentIdentity(req),
      authMode: process.env['SUPPORTPLANE_AUTH_MODE'] === 'local' ? 'local' : 'dev',
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const identity = getCurrentIdentity(req);
    const cookie = req.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${this.authService.getSessionCookieName()}=`))
      ?.slice(this.authService.getSessionCookieName().length + 1);
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice('Bearer '.length)
      : undefined;
    await this.authService.logout(bearer ?? cookie, identity);
    res.clearCookie(this.authService.getSessionCookieName(), { path: '/' });
    return { loggedOut: true };
  }

  @Get('audit-events')
  async auditEvents(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    requirePermission(identity, 'audit:read');
    return this.authService.listTenantAuditEvents(identity);
  }

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
      note: 'OIDC configuration metadata. Full browser login flow not implemented.',
    };
  }

  @Get('mfa/status')
  mfaStatus() {
    return {
      ...this.authService.getMfaHookStatus(),
      note: 'MFA hook status. Enforcement not implemented.',
    };
  }

  @Get('service-accounts')
  serviceAccounts(@Req() req: Request) {
    const identity = getCurrentIdentity(req);
    // Protected by authentication middleware. Full implementation would restrict
    // writes to service-authenticated requests only.
    return {
      accounts: [],
      ...this.authService.getServiceAccountHooks(),
    };
  }
}
