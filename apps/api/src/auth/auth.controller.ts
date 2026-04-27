import { Body, Controller, Get, Inject, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { getCurrentIdentity } from './current-identity.middleware.js';
import { requirePermission } from './rbac.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('local/login')
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
}
