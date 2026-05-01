import { Module } from '@nestjs/common';
import { ToolRegistryService } from './tool-registry.service.js';
import { ToolPolicyService } from './tool-policy.service.js';
import { ToolApprovalService } from './tool-approval.service.js';
import { ToolExecutionGatewayService } from './tool-execution-gateway.service.js';
import { ToolResultNoteDraftService } from './tool-result-note-draft.service.js';
import { ToolRegistryController } from './tool-registry.controller.js';
import { ToolExecutionController } from './tool-execution.controller.js';
import { ToolApprovalController } from './tool-approval.controller.js';

@Module({
  controllers: [ToolRegistryController, ToolExecutionController, ToolApprovalController],
  providers: [
    ToolRegistryService,
    ToolPolicyService,
    ToolApprovalService,
    ToolExecutionGatewayService,
    ToolResultNoteDraftService,
  ],
  exports: [
    ToolRegistryService,
    ToolPolicyService,
    ToolApprovalService,
    ToolExecutionGatewayService,
    ToolResultNoteDraftService,
  ],
})
export class ToolExecutionModule {}
