import { Module } from '@nestjs/common';
import { ConnectorInstallationsController } from './connector-installations.controller.js';
import { ConnectorInstallationsService } from './connector-installations.service.js';
import { StoreModule } from '../store/store.module.js';

@Module({
  imports: [StoreModule],
  controllers: [ConnectorInstallationsController],
  providers: [ConnectorInstallationsService],
  exports: [ConnectorInstallationsService],
})
export class ConnectorInstallationsModule {}
