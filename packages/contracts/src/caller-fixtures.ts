import {
  CallerMatch,
  type CallerMatch as CallerMatchShape,
  type PhoneNumberNormalizationResult as PhoneNumberNormalizationResultShape,
} from './call.js';

export interface MockCustomer {
  customerId: string;
  name: string;
  email: string;
  phoneCanonical: string;
  recentTicketIds: string[];
  recentTicketSubjects: string[];
}

/**
 * Deterministic mock customer fixtures keyed by canonical phone number.
 *
 * These are used for local development and testing only.
 * No real customer database is queried.
 */
export const MOCK_CUSTOMER_FIXTURES: Record<string, MockCustomer> = {
  '+32 3 555 01 01': {
    customerId: 'cust-antwerp-001',
    name: 'Acme BVBA',
    email: 'support@acme-bvba.be',
    phoneCanonical: '+32 3 555 01 01',
    recentTicketIds: ['TICKET-101', 'TICKET-102'],
    recentTicketSubjects: ['VPN issue', 'Printer offline'],
  },
  '+32 2 555 02 02': {
    customerId: 'cust-brussels-001',
    name: 'Brussels Tech SPRL',
    email: 'help@brusselstech.be',
    phoneCanonical: '+32 2 555 02 02',
    recentTicketIds: ['TICKET-201'],
    recentTicketSubjects: ['Email sync failure'],
  },
  '+32 495 12 34 56': {
    customerId: 'cust-mobile-001',
    name: 'Jean Dupont',
    email: 'jean.dupont@example.be',
    phoneCanonical: '+32 495 12 34 56',
    recentTicketIds: ['TICKET-301', 'TICKET-302'],
    recentTicketSubjects: ['Laptop battery drain', 'Wi-Fi connectivity'],
  },
};

/**
 * Match a normalized phone number against deterministic mock fixtures.
 *
 * Returns a clear CallerMatch result. Never crashes.
 */
export function matchCallerByPhone(
  normalization: PhoneNumberNormalizationResultShape,
): CallerMatchShape {
  if (!normalization.valid || !normalization.normalized) {
    return CallerMatch.parse({
      status: 'invalid_number',
      confidence: 0,
      reason: normalization.error ?? 'Invalid phone number',
    });
  }

  const customer = MOCK_CUSTOMER_FIXTURES[normalization.normalized];
  if (!customer) {
    return CallerMatch.parse({
      status: 'no_match',
      confidence: 0,
      reason: 'No fixture customer found for this number',
    });
  }

  return CallerMatch.parse({
    status: 'matched',
    confidence: 1.0,
    customerId: customer.customerId,
    customerName: customer.name,
    customerEmail: customer.email,
    matchedTicketIds: customer.recentTicketIds,
    matchSource: 'mock_fixture',
    reason: 'Deterministic mock fixture match',
  });
}
