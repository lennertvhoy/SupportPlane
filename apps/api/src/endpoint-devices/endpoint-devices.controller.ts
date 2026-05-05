import { Body, Controller, Get, Inject, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCurrentIdentity } from '../auth/current-identity.middleware.js';
import { EndpointDevicesService } from './endpoint-devices.service.js';

@Controller('endpoint-devices')
export class EndpointDevicesController {
  constructor(@Inject(EndpointDevicesService) private readonly service: EndpointDevicesService) {}

  @Get()
  list(@Req() req: Request) {
    return this.service.listDevices(getCurrentIdentity(req));
  }

  @Get(':id')
  detail(@Req() req: Request, @Param('id') id: string) {
    return this.service.getDeviceDetail(getCurrentIdentity(req), id);
  }

  @Post(':id/commands')
  requestCommand(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.requestCommand(getCurrentIdentity(req), id, body as never);
  }
}
