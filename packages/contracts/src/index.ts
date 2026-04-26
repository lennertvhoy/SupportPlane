// SupportPlane shared contracts placeholder
export const CONTRACTS_VERSION = '0.1.0';

export interface HealthContract {
  service: string;
  version: string;
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
}
