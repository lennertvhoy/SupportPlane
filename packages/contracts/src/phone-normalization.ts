import {
  PhoneNumberNormalizationResult,
  type PhoneNumberNormalizationResult as PhoneNumberNormalizationResultShape,
} from './call.js';

/**
 * Normalize a phone number string to a canonical form.
 *
 * Supports Belgian-style numbers:
 * - International: +32 3 555 0101
 * - National: 03 555 01 01
 * - Legacy intl prefix: 0032 3 555 0101
 *
 * Returns a clear validation result. Does not crash on invalid input.
 */
export function normalizePhoneNumber(raw: string): PhoneNumberNormalizationResultShape {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      rawInput: raw || '',
      valid: false,
      error: 'Empty input',
    } as PhoneNumberNormalizationResultShape;
  }

  // Extract digits and any leading +
  let digitsOnly = trimmed.replace(/[^\d+]/g, '');

  // Handle + prefix
  const hasPlus = digitsOnly.startsWith('+');
  if (hasPlus) {
    digitsOnly = digitsOnly.slice(1);
  }

  // Handle 0032 prefix
  if (digitsOnly.startsWith('0032')) {
    digitsOnly = digitsOnly.slice(4);
    digitsOnly = '+32' + digitsOnly;
  } else if (hasPlus) {
    digitsOnly = '+' + digitsOnly;
  } else if (digitsOnly.startsWith('0')) {
    // National Belgian format: 0X XXX XX XX -> +32 X XXX XX XX
    digitsOnly = '+32' + digitsOnly.slice(1);
  } else {
    // No prefix and no leading 0: treat as already without country code
    digitsOnly = '+32' + digitsOnly;
  }

  // Validate: +32 followed by 8 or 9 digits
  const match = digitsOnly.match(/^\+32(\d{8,9})$/);
  if (!match) {
    return PhoneNumberNormalizationResult.parse({
      rawInput: raw,
      valid: false,
      error: 'Does not match expected Belgian number format (+32 + 8-9 digits)',
    });
  }

  const body = match[1];
  const formatted = `+32 ${body.slice(0, 1)} ${body.slice(1, 4)} ${body.slice(4, 6)} ${body.slice(6)}`;

  return PhoneNumberNormalizationResult.parse({
    rawInput: raw,
    normalized: formatted,
    valid: true,
    countryCode: '+32',
  });
}
