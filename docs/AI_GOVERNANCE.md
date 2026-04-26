# AI Governance

SupportPlane should be marketed as built with governance, auditability, and
compliance evidence in mind. It should not be marketed as fully compliant
without legal review and evidence.

## AI Boundaries

The AI may:

- summarize
- reason
- suggest next steps
- draft replies or notes
- request tool actions

The AI must not:

- directly execute privileged work
- receive raw secrets
- use hidden tools
- bypass tenant policy
- bypass approvals
- bypass audit

## AIContextPacket

The model receives explicit `AIContextPacket` objects rather than arbitrary raw
context. Packets should include provenance and redaction state for customer,
ticket, call, device, screen, and policy context.

The UI should expose AI Context Quality so support workers can see which inputs
were loaded, which were missing, and whether identity is verified.

## Model Gateway

Planned providers:

- mock provider for demos/tests
- OpenAI
- Azure OpenAI
- Anthropic later
- local Ollama later

Every model call should record provider, model, prompt template version,
context packet hash, redaction status, output hash, latency, token usage, and
cost estimate where available.

Raw sensitive prompts should not be retained indefinitely unless tenant policy
explicitly allows retention.

## Governance References

The evidence log records planning references for OWASP agentic AI security,
NIST AI RMF Generative AI Profile, and the EU AI Act timeline. These are design
inputs, not compliance certification.
