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
