import { Module } from '@nestjs/common';
import { SupportSessionsController } from './support-sessions.controller.js';
import { SupportSessionsService } from './support-sessions.service.js';

@Module({
  controllers: [SupportSessionsController],
  providers: [SupportSessionsService],
})
export class SupportSessionsModule {}
