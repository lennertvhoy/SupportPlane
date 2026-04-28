import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { SupportSessionsModule } from './support-sessions/support-sessions.module.js';
import { ConnectorsModule } from './connectors/connectors.module.js';
import { CallsModule } from './calls/calls.module.js';
import { TelephonyModule } from './telephony/telephony.module.js';
import { StoreModule } from './store/store.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { ConnectorInstallationsModule } from './connector-installations/connector-installations.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { ActionsModule } from './actions/actions.module.js';
import { DeliveryPolicyModule } from './delivery-policy/delivery-policy.module.js';
import { CurrentIdentityMiddleware } from './auth/current-identity.middleware.js';

@Module({
  imports: [StoreModule, AuthModule, SupportSessionsModule, ConnectorsModule, CallsModule, TelephonyModule, CustomersModule, ConnectorInstallationsModule, TicketsModule, ActionsModule, DeliveryPolicyModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentIdentityMiddleware).forRoutes('auth/me', 'auth/logout', 'auth/audit-events', 'support-sessions', 'connectors', 'calls', 'telephony', 'customers', 'connector-installations', 'tickets', 'actions', 'outbox', 'delivery-policies');
  }
}
