import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { SupportSessionsModule } from './support-sessions/support-sessions.module.js';
import { ConnectorsModule } from './connectors/connectors.module.js';
import { DevIdentityMiddleware } from './common/dev-identity.middleware.js';

@Module({
  imports: [SupportSessionsModule, ConnectorsModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DevIdentityMiddleware).forRoutes('support-sessions', 'connectors');
  }
}
