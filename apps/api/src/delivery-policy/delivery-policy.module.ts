import { Module } from '@nestjs/common';
import { StoreModule } from '../store/store.module.js';
import { ConnectorInstallationsModule } from '../connector-installations/connector-installations.module.js';
import { DeliveryPolicyController } from './delivery-policy.controller.js';
import { DeliveryPolicyService } from './delivery-policy.service.js';

@Module({
  imports: [StoreModule, ConnectorInstallationsModule],
  controllers: [DeliveryPolicyController],
  providers: [DeliveryPolicyService],
  exports: [DeliveryPolicyService],
})
export class DeliveryPolicyModule {}
