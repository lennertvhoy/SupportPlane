import { Module } from '@nestjs/common';
import { StoreModule } from '../store/store.module.js';
import { EndpointDevicesController } from './endpoint-devices.controller.js';
import { EndpointAgentController } from './endpoint-agent.controller.js';
import { EndpointDevicesService } from './endpoint-devices.service.js';
import { ToolExecutionModule } from '../tool-execution/tool-execution.module.js';

@Module({
  imports: [StoreModule, ToolExecutionModule],
  controllers: [EndpointDevicesController, EndpointAgentController],
  providers: [EndpointDevicesService],
})
export class EndpointDevicesModule {}
