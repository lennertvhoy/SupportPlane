import { Module } from '@nestjs/common';
import { CallsModule } from '../calls/calls.module.js';
import { TelephonyController } from './telephony.controller.js';
import { TelephonyService } from './telephony.service.js';

@Module({
  imports: [CallsModule],
  controllers: [TelephonyController],
  providers: [TelephonyService],
})
export class TelephonyModule {}
