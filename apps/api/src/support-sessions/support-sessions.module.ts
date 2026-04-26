import { Module } from '@nestjs/common';
import { SupportSessionsController } from './support-sessions.controller.js';
import { SupportSessionsService } from './support-sessions.service.js';
import { ConnectorsModule } from '../connectors/connectors.module.js';

@Module({
  imports: [ConnectorsModule],
  controllers: [SupportSessionsController],
  providers: [SupportSessionsService],
})
export class SupportSessionsModule {}
