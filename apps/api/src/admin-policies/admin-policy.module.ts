import { Module } from '@nestjs/common';
import { StoreModule } from '../store/store.module.js';
import { DeliveryPolicyModule } from '../delivery-policy/delivery-policy.module.js';
import { AdminPolicyController } from './admin-policy.controller.js';
import { AdminPolicyService } from './admin-policy.service.js';

@Module({
  imports: [StoreModule, DeliveryPolicyModule],
  controllers: [AdminPolicyController],
  providers: [AdminPolicyService],
  exports: [AdminPolicyService],
})
export class AdminPolicyModule {}
