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
import { AdminPolicyModule } from './admin-policies/admin-policy.module.js';
import { CredentialReferencesModule } from './credential-references/credential-references.module.js';
import { CurrentIdentityMiddleware } from './auth/current-identity.middleware.js';
import { CorrelationMiddleware } from './telemetry/correlation.middleware.js';
import { TelemetryModule } from './telemetry/telemetry.module.js';
import { AuditModule } from './audit/audit.module.js';
import { EndpointDevicesModule } from './endpoint-devices/endpoint-devices.module.js';
import { ToolExecutionModule } from './tool-execution/tool-execution.module.js';

@Module({
  imports: [StoreModule, AuthModule, TelemetryModule, AuditModule, SupportSessionsModule, ConnectorsModule, CallsModule, TelephonyModule, CustomersModule, ConnectorInstallationsModule, CredentialReferencesModule, TicketsModule, ActionsModule, DeliveryPolicyModule, AdminPolicyModule, EndpointDevicesModule, ToolExecutionModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
    consumer.apply(CurrentIdentityMiddleware).forRoutes('auth/me', 'auth/logout', 'auth/audit-events', 'auth/service-accounts', 'support-sessions', 'connectors', 'calls', 'telephony', 'customers', 'connector-installations', 'credential-references', 'tickets', 'actions', 'outbox', 'delivery-policies', 'admin/policies', 'endpoint-devices', 'admin/devices', 'admin/tools', 'admin/tool-invocations', 'admin/tool-approvals');
  }
}
