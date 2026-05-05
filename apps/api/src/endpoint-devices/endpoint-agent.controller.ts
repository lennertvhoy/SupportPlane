import { Body, Controller, Headers, Inject, Param, Post } from '@nestjs/common';
import { EndpointDevicesService } from './endpoint-devices.service.js';

@Controller('endpoint-agent')
export class EndpointAgentController {
  constructor(@Inject(EndpointDevicesService) private readonly service: EndpointDevicesService) {}

  @Post('register')
  register(@Body() body: Record<string, unknown>) {
    return this.service.registerDevice(body as never);
  }

  @Post('heartbeat')
  async heartbeat(
    @Headers('x-endpoint-tenant-id') tenantId: string | undefined,
    @Headers('x-endpoint-device-key') deviceKey: string | undefined,
    @Headers('x-endpoint-device-token') token: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const device = await this.service.authenticateAgent(tenantId, deviceKey, token);
    return this.service.heartbeat(device, body as never);
  }

  @Post('snapshots')
  async snapshot(
    @Headers('x-endpoint-tenant-id') tenantId: string | undefined,
    @Headers('x-endpoint-device-key') deviceKey: string | undefined,
    @Headers('x-endpoint-device-token') token: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const device = await this.service.authenticateAgent(tenantId, deviceKey, token);
    return this.service.submitSnapshot(device, body as never);
  }

  @Post('commands/claim')
  async claim(
    @Headers('x-endpoint-tenant-id') tenantId: string | undefined,
    @Headers('x-endpoint-device-key') deviceKey: string | undefined,
    @Headers('x-endpoint-device-token') token: string | undefined,
  ) {
    const device = await this.service.authenticateAgent(tenantId, deviceKey, token);
    return this.service.claimNext(device);
  }

  @Post('commands/:id/result')
  async result(
    @Headers('x-endpoint-tenant-id') tenantId: string | undefined,
    @Headers('x-endpoint-device-key') deviceKey: string | undefined,
    @Headers('x-endpoint-device-token') token: string | undefined,
    @Param('id') commandId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const device = await this.service.authenticateAgent(tenantId, deviceKey, token);
    return this.service.submitResult(device, commandId, body as never);
  }
}
