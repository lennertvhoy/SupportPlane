/**
 * Redaction helpers for evidence bundle output.
 * Ensures secrets, tokens, and sensitive values are never present in exported bundles.
 */

const SECRET_KEY_PATTERNS = [
  /apiToken/i,
  /api_token/i,
  /apiKey/i,
  /api_key/i,
  /authToken/i,
  /auth_token/i,
  /authorization/i,
  /password/i,
  /secret/i,
  /token/i,
  /privateKey/i,
  /private_key/i,
  /zammad_api_token/i,
  /ZAMMAD_API_TOKEN/i,
  /credential/i,
  /passwd/i,
  /access_token/i,
  /refresh_token/i,
  /bearer/i,
  /basic/i,
];

const ENV_VALUE_PATTERNS = [
  /^[A-Z][A-Z0-9_]*_URL$/,
  /^[A-Z][A-Z0-9_]*_TOKEN$/,
  /^[A-Z][A-Z0-9_]*_KEY$/,
  /^[A-Z][A-Z0-9_]*_SECRET$/,
  /^[A-Z][A-Z0-9_]*_PASSWORD$/,
  /^[A-Z][A-Z0-9_]*_CREDENTIAL$/,
];

function looksLikeSecretKey(key: string): boolean {
  return SECRET_KEY_PATTERNS.some((p) => p.test(key));
}

function looksLikeEnvValue(key: string): boolean {
  return ENV_VALUE_PATTERNS.some((p) => p.test(key));
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Redact Authorization header values
    if (value.toLowerCase().startsWith('bearer ') || value.toLowerCase().startsWith('token ') || value.toLowerCase().startsWith('basic ')) {
      return '[REDACTED]';
    }
    // Redact long token-like strings
    if (value.length > 20 && /^[A-Za-z0-9_\-./+=]+$/.test(value)) {
      return '[REDACTED]';
    }
    // Redact anything containing obvious secret phrases
    if (/apiToken|api_token|apiKey|api_key|authToken|auth_token|password|secret|privateKey|private_key|zammad_api_token/i.test(value)) {
      return '[REDACTED]';
    }
  }
  return value;
}

/**
 * Recursively redact secrets from a plain JSON-serializable object.
 */
export function redactSecrets<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (looksLikeSecretKey(key) || looksLikeEnvValue(key)) {
      out[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      out[key] = redactSecrets(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      out[key] = value.map((item) =>
        typeof item === 'object' && item !== null ? redactSecrets(item as Record<string, unknown>) : redactValue(item)
      );
    } else {
      out[key] = redactValue(value);
    }
  }
  return out as T;
}

/**
 * String-based redaction for Markdown or serialized output.
 */
export function redactString(input: string): string {
  let out = input;
  // Redact Authorization headers
  out = out.replace(/(Authorization\s*[:=]\s*).+/gi, '$1[REDACTED]');
  // Redact bearer/token strings
  out = out.replace(/(Bearer\s+)[A-Za-z0-9_\-./+=]+/gi, '$1[REDACTED]');
  out = out.replace(/(Token\s+token=)[A-Za-z0-9_\-./+=]+/gi, '$1[REDACTED]');
  // Redact env assignments of sensitive-looking keys
  out = out.replace(/(ZAMMAD_API_TOKEN\s*=\s*).+/g, '$1[REDACTED]');
  out = out.replace(/([A-Z_]*SECRET[A-Z_]*\s*=\s*).+/g, '$1[REDACTED]');
  out = out.replace(/([A-Z_]*TOKEN[A-Z_]*\s*=\s*).+/g, '$1[REDACTED]');
  out = out.replace(/([A-Z_]*PASSWORD[A-Z_]*\s*=\s*).+/g, '$1[REDACTED]');
  return out;
}
