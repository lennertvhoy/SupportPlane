import { Injectable, Inject } from '@nestjs/common';
import {
  ToolPolicyDecision,
  normalizePlatform,
  type ToolDefinition as ToolDefinitionShape,
} from '@supportplane/contracts';
import type { Store } from '../store/store.interface.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { CurrentIdentity } from '../auth/auth.types.js';

@Injectable()
export class ToolPolicyService {
  constructor(@Inject(InMemoryStore) private readonly store: Store) {}

  async evaluateToolInvocation(
    identity: CurrentIdentity,
    deviceId: string,
    tool: ToolDefinitionShape,
    devicePlatform?: string,
  ): Promise<typeof ToolPolicyDecision._type> {
    const base = {
      tenantId: identity.tenantId,
      deviceId,
      toolKey: tool.toolKey,
      riskLevel: tool.riskLevel,
      arbitraryShellAllowed: false,
      fixedImplementationOnly: true,
    };

    const remediationEnabled =
      process.env['SUPPORTPLANE_REMEDIATION_ENABLED'] !== '0' &&
      process.env['SUPPORTPLANE_REMEDIATION_ENABLED'] !== 'false';

    // 1. Role permission check
    const hasPermission =
      identity.permissions.includes('*') || identity.permissions.includes(tool.requiredPermission);
    if (!hasPermission) {
      return {
        allowed: false,
        decision: 'role_denied',
        reason: `Role lacks required permission: ${tool.requiredPermission}`,
        ...base,
        remediationAllowed: false,
        approvalRequired: false,
      };
    }

    // 2. Tool enabled check
    if (!tool.enabled) {
      return {
        allowed: false,
        decision: 'tool_disabled',
        reason: 'Tool is disabled in the registry.',
        ...base,
        remediationAllowed: false,
        approvalRequired: false,
      };
    }

    // 3. Platform compatibility
    const canonicalPlatform = devicePlatform ? normalizePlatform(devicePlatform) : undefined;
    if (
      canonicalPlatform &&
      canonicalPlatform !== 'unknown' &&
      tool.supportedPlatforms.length > 0 &&
      !tool.supportedPlatforms.includes(canonicalPlatform)
    ) {
      return {
        allowed: false,
        decision: 'unsupported_platform',
        reason: `Platform ${canonicalPlatform} is not in supported platforms: ${tool.supportedPlatforms.join(', ')}`,
        ...base,
        remediationAllowed: false,
        approvalRequired: false,
      };
    }
    if (canonicalPlatform === 'unknown' && tool.supportedPlatforms.length > 0) {
      return {
        allowed: false,
        decision: 'unsupported_platform',
        reason: `Unknown platform ${devicePlatform} is not supported.`,
        ...base,
        remediationAllowed: false,
        approvalRequired: false,
      };
    }

    // 5. Risk level and approval gating
    if (tool.riskLevel === 'read_only') {
      return {
        allowed: true,
        decision: 'read_only_allowed',
        ...base,
        remediationAllowed: false,
        approvalRequired: false,
      };
    }

    if (tool.riskLevel === 'low_risk_remediation') {
      if (!remediationEnabled) {
        return {
          allowed: false,
          decision: 'remediation_policy_disabled',
          reason: 'Remediation execution is disabled by tenant/runtime policy.',
          ...base,
          remediationAllowed: false,
          approvalRequired: false,
        };
      }
      if (tool.approvalRequired) {
        return {
          allowed: false,
          decision: 'approval_required',
          reason: 'Low-risk remediation requires approval before execution.',
          ...base,
          remediationAllowed: false,
          approvalRequired: true,
        };
      }
      return {
        allowed: true,
        decision: 'low_risk_remediation_allowed',
        ...base,
        remediationAllowed: true,
        approvalRequired: false,
      };
    }

    if (tool.riskLevel === 'elevated_remediation') {
      return {
        allowed: false,
        decision: 'elevated_remediation_blocked',
        reason: 'Elevated remediation is blocked in this slice.',
        ...base,
        remediationAllowed: false,
        approvalRequired: true,
      };
    }

    if (tool.riskLevel === 'blocked' || tool.riskLevel === 'unsupported') {
      return {
        allowed: false,
        decision: 'tool_blocked',
        reason: 'Tool risk level is blocked or unsupported.',
        ...base,
        remediationAllowed: false,
        approvalRequired: false,
      };
    }

    return {
      allowed: false,
      decision: 'unknown_risk_level',
      reason: `Unrecognized risk level: ${tool.riskLevel}`,
      ...base,
      remediationAllowed: false,
      approvalRequired: false,
    };
  }
}
