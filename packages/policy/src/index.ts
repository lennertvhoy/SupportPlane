export {
  PolicyDecision,
  PolicyDecisionOutcome,
  PolicyDecisionId,
  Permission,
  Role,
  type PolicyDecision as PolicyDecisionShape,
  type Role as RoleShape,
} from '@supportplane/contracts';

/**
 * Check whether a set of permissions satisfies a required permission.
 */
export function hasPermission(
  granted: string[],
  required: string
): boolean {
  return granted.includes(required) || granted.includes('*');
}

/**
 * Check whether all required permissions are satisfied.
 */
export function hasAllPermissions(
  granted: string[],
  required: string[]
): boolean {
  return required.every((r) => hasPermission(granted, r));
}

export type EgressOperation = 'read' | 'writeback';

export interface EgressPolicyInput {
  tenantId: string;
  connectorType: string;
  operation: EgressOperation;
  url?: string;
  killSwitchEnabled?: boolean;
  writebackEnabled?: boolean;
  allowedSandboxHosts?: string[];
}

export interface EgressPolicyDecision {
  allowed: boolean;
  decision:
    | 'allowed_local_zammad_sandbox_read'
    | 'allowed_local_zammad_sandbox_writeback'
    | 'blocked_by_default_deny'
    | 'blocked_external_url'
    | 'blocked_production_like_url'
    | 'blocked_by_kill_switch'
    | 'blocked_writeback_disabled'
    | 'blocked_tenant_guardrail';
  reason: string;
  url?: string;
  connectorType: string;
  operation: EgressOperation;
  tenantId: string;
  sandboxAllowlisted: boolean;
  writebackEnabled: boolean;
  killSwitchEnabled: boolean;
  secretExposed: false;
}

const DEFAULT_SANDBOX_HOSTS = [
  'zammad.supportplane-integrations.svc.cluster.local',
  'localhost',
  '127.0.0.1',
];

const PRODUCTION_LIKE_HOST_PATTERNS = [
  /(^|\.)zammad\.com$/i,
  /(^|\.)zendesk\.com$/i,
  /(^|\.)freshdesk\.com$/i,
  /prod/i,
  /production/i,
];

export function evaluateEgressPolicy(input: EgressPolicyInput): EgressPolicyDecision {
  const killSwitchEnabled = input.killSwitchEnabled === true;
  const writebackEnabled = input.writebackEnabled === true;
  const allowedSandboxHosts = input.allowedSandboxHosts ?? DEFAULT_SANDBOX_HOSTS;
  const url = input.url;
  const parsed = parseUrl(url);
  const host = parsed?.hostname ?? '';
  const sandboxAllowlisted =
    input.connectorType === 'zammad' &&
    parsed !== undefined &&
    ['http:', 'https:'].includes(parsed.protocol) &&
    allowedSandboxHosts.includes(host);

  const base = {
    url,
    connectorType: input.connectorType,
    operation: input.operation,
    tenantId: input.tenantId,
    sandboxAllowlisted,
    writebackEnabled,
    killSwitchEnabled,
    secretExposed: false as const,
  };

  if (killSwitchEnabled) {
    return {
      ...base,
      allowed: false,
      decision: 'blocked_by_kill_switch',
      reason: 'Network operation is blocked by the tenant kill switch.',
    };
  }

  if (input.operation === 'writeback') {
    if (!writebackEnabled) {
      return {
        ...base,
        allowed: false,
        decision: 'blocked_writeback_disabled',
        reason: 'Real writeback is disabled.',
      };
    }
    if (killSwitchEnabled) {
      return {
        ...base,
        allowed: false,
        decision: 'blocked_by_kill_switch',
        reason: 'Network operation is blocked by the tenant kill switch.',
      };
    }
    if (!parsed) {
      return {
        ...base,
        allowed: false,
        decision: 'blocked_by_default_deny',
        reason: 'Network operation is denied because no valid allowlisted URL was provided.',
      };
    }
    if (PRODUCTION_LIKE_HOST_PATTERNS.some((pattern) => pattern.test(host))) {
      return {
        ...base,
        allowed: false,
        decision: 'blocked_production_like_url',
        reason: 'Production-looking connector URLs are blocked in the local sandbox.',
      };
    }
    if (!sandboxAllowlisted) {
      return {
        ...base,
        allowed: false,
        decision: 'blocked_external_url',
        reason: 'Connector egress is deny-by-default and this URL is not on the sandbox allowlist.',
      };
    }
    return {
      ...base,
      allowed: true,
      decision: 'allowed_local_zammad_sandbox_writeback',
      reason: 'Sandbox-only Zammad internal note writeback is allowed by the local sandbox allowlist.',
    };
  }

  if (!parsed) {
    return {
      ...base,
      allowed: false,
      decision: 'blocked_by_default_deny',
      reason: 'Network operation is denied because no valid allowlisted URL was provided.',
    };
  }

  if (PRODUCTION_LIKE_HOST_PATTERNS.some((pattern) => pattern.test(host))) {
    return {
      ...base,
      allowed: false,
      decision: 'blocked_production_like_url',
      reason: 'Production-looking connector URLs are blocked in the local sandbox.',
    };
  }

  if (!sandboxAllowlisted) {
    return {
      ...base,
      allowed: false,
      decision: 'blocked_external_url',
      reason: 'Connector egress is deny-by-default and this URL is not on the sandbox allowlist.',
    };
  }

  return {
    ...base,
    allowed: true,
    decision: 'allowed_local_zammad_sandbox_read',
    reason: 'Read-only Zammad sandbox egress is allowed by the local sandbox allowlist.',
  };
}

function parseUrl(value?: string): URL | undefined {
  if (!value) return undefined;
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}
