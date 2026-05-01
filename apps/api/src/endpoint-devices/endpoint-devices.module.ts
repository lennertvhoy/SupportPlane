import { Module } from '@nestjs/common';
import { StoreModule } from '../store/store.module.js';
import { EndpointDevicesController } from './endpoint-devices.controller.js';
import { EndpointAgentController } from './endpoint-agent.controller.js';
import { EndpointDevicesService } from './endpoint-devices.service.js';

@Module({
  imports: [StoreModule],
  controllers: [EndpointDevicesController, EndpointAgentController],
  providers: [EndpointDevicesService],
})
export class EndpointDevicesModule {}
