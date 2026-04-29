import { Module } from '@nestjs/common';
import { StoreModule } from '../store/store.module.js';
import { DeliveryPolicyModule } from '../delivery-policy/delivery-policy.module.js';
import { ConnectorsModule } from '../connectors/connectors.module.js';
import { CredentialReferencesModule } from '../credential-references/credential-references.module.js';
import { ActionsController } from './actions.controller.js';
import { ActionsService } from './actions.service.js';

@Module({
  imports: [StoreModule, DeliveryPolicyModule, ConnectorsModule, CredentialReferencesModule],
  controllers: [ActionsController],
  providers: [ActionsService],
})
export class ActionsModule {}
