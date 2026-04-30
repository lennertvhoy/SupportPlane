import { Controller, Get, Header } from '@nestjs/common';
import { telemetry } from './telemetry.service.js';

@Controller()
export class TelemetryController {
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  metrics() {
    return telemetry.prometheusText();
  }

  @Get('observability/status')
  status() {
    return telemetry.status();
  }
}
