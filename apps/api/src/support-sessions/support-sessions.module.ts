import { Module } from '@nestjs/common';
import { SupportSessionsController } from './support-sessions.controller.js';
import { SupportSessionsService } from './support-sessions.service.js';
import { ConnectorsModule } from '../connectors/connectors.module.js';
import { StoreModule } from '../store/store.module.js';

@Module({
  imports: [ConnectorsModule, StoreModule],
  controllers: [SupportSessionsController],
  providers: [SupportSessionsService],
})
export class SupportSessionsModule {}
