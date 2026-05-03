import { Module } from '@nestjs/common';
import { ConnectorInstallationsController } from './connector-installations.controller.js';
import { ConnectorInstallationsService } from './connector-installations.service.js';
import { ConnectorRuntimeService } from './connector-runtime.service.js';
import { StoreModule } from '../store/store.module.js';
import { CredentialReferencesModule } from '../credential-references/credential-references.module.js';
import { ConnectorsModule } from '../connectors/connectors.module.js';

@Module({
  imports: [StoreModule, CredentialReferencesModule, ConnectorsModule],
  controllers: [ConnectorInstallationsController],
  providers: [ConnectorInstallationsService, ConnectorRuntimeService],
  exports: [ConnectorInstallationsService, ConnectorRuntimeService],
})
export class ConnectorInstallationsModule {}
