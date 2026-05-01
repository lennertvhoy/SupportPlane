import { Module } from '@nestjs/common';
import { AuditExplorerController } from './audit-explorer.controller.js';
import { AuditExplorerService } from './audit-explorer.service.js';

@Module({
  controllers: [AuditExplorerController],
  providers: [AuditExplorerService],
  exports: [AuditExplorerService],
})
export class AuditExplorerModule {}
