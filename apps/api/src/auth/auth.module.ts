import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { OidcService } from './oidc.service.js';
import { ServiceAccountGuard } from './service-account.guard.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, OidcService, ServiceAccountGuard],
  exports: [AuthService, OidcService, ServiceAccountGuard],
})
export class AuthModule {}
