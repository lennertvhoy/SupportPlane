# Connector Contracts

SupportPlane connectors normalize external systems into SupportSession context
and audited writebacks. Integration claims remain planning claims until tested
against a real service or controlled fixture.

## TicketingAdapter

```ts
interface TicketingAdapter {
  provider: "zammad" | "glpi" | "jira" | "freshservice" | "mock";

  findCustomerByPhone(phone: string): Promise<CustomerMatch[]>;
  findCustomerByEmail(email: string): Promise<CustomerMatch[]>;
  getRecentTickets(customerId: string): Promise<TicketSummary[]>;
  getTicket(ticketId: string): Promise<TicketDetail>;
  createInternalNote(ticketId: string, note: string): Promise<void>;
  createPublicReplyDraft(ticketId: string, body: string): Promise<DraftResult>;
  attachEvidenceBundle(ticketId: string, bundle: EvidenceBundleRef): Promise<void>;
}
```

## ConnectorInstallation

BL-020 adds persistent `ConnectorInstallation` records with tenant-scoped storage, safety flags, and validation state. See `docs/TICKET_CONTEXT_CONNECTOR_SAFETY.md` for details.

## Integration Order

1. Mock connector for deterministic tests and demos.
2. Zammad for MVP ticket lookup, summaries, internal note drafts/writeback.
3. Simulated incoming call webhook before real PBX complexity.
4. GLPI for ITSM/assets after MVP 1 proves ticket context.
5. Asterisk/FreePBX via a CTI gateway after the simulator.
6. MeshCentral for remote support context and launch metadata.

## Connector Rules

- Connector credentials are stored encrypted.
- AI receives connector-derived summaries, not raw credentials.
- All external reads and writes emit audit events.
- Writebacks require explicit user action or policy-approved automation.
- External system outages must degrade the AI Context Quality display rather than silently hiding missing context.
- Connector installation safety flags are visible in the UI and evidence bundle.
- Secret redaction applies to all connector config and safety flag fields before API responses and evidence export.
