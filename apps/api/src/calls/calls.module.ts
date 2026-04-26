import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller.js';
import { CallsService } from './calls.service.js';
import { StoreModule } from '../store/store.module.js';

@Module({
  imports: [StoreModule],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
