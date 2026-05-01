import { Module } from '@nestjs/common';
import { AiGatewayController } from './ai-gateway.controller.js';

@Module({
  controllers: [AiGatewayController],
})
export class AiGatewayModule {}
