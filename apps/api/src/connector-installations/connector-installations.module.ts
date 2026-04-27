import { Module } from '@nestjs/common';
import { ConnectorInstallationsController } from './connector-installations.controller.js';
import { StoreModule } from '../store/store.module.js';

@Module({
  imports: [StoreModule],
  controllers: [ConnectorInstallationsController],
})
export class ConnectorInstallationsModule {}
