# Greeting Suggestions

**Product:** SupportPlane  
**Scope:** BL-042 Suggested greeting generation from call plus ticket context and BL-043 Call Console integration  
**Last updated:** 2026-04-27

## Purpose

When an incoming call is matched and a support session exists, the support agent needs a safe, reviewable way to start the conversation. The Greeting Suggestion feature provides a deterministic mock-AI greeting based on caller identity and ticket context.

## Behavior

### API endpoint

```http
POST /support-sessions/:id/greeting-suggestion
Content-Type: application/json
x-tenant-id: dev-tenant
x-user-id: dev-user

{
  "callEventId": "optional-call-event-id",
  "tone": "professional",
  "modelSelection": {
    "provider": "mock",
    "model": "mock-greeting-v1"
  }
}
```

### Response shape

```json
{
  "suggestion": {
    "id": "greet-uuid",
    "tenantId": "dev-tenant",
    "supportSessionId": "session-uuid",
    "callEventId": "call-uuid",
    "greetingText": "Good day, Acme BVBA. Thank you for calling SupportPlane. I can see we have 2 open ticket(s) on file. My name is the assigned support agent, and I'll be assisting you today. How may I help?",
    "tone": "professional",
    "contextSummary": {
      "callerName": "Mock Caller",
      "normalizedPhoneNumber": "+32 3 555 01 01",
      "matchedTicketIds": ["TICKET-101", "TICKET-102"],
      "matchedCustomerName": "Acme BVBA",
      "sessionTitle": "Incoming call from Acme BVBA"
    },
    "metadata": {
      "provider": "mock",
      "model": "mock-greeting-v1",
      "promptId": "greeting-suggestion",
      "promptVersion": "mock-v1",
      "contextHash": "sha256-hash",
      "mockDevOnly": true,
      "reviewRequired": true,
      "generatedAt": "2026-04-26T21:45:25.000Z"
    }
  },
  "provider": "mock",
  "model": "mock-greeting-v1",
  "prompt": {
    "id": "greeting-suggestion",
    "version": "mock-v1",
    "purpose": "Suggest a safe, reviewable greeting for a support agent based on caller and ticket context."
  },
  "contextHash": "sha256-hash",
  "usage": {
    "placeholder": true
  },
  "safety": {
    "mockOnly": true,
    "externalCallMade": false,
    "policyChecks": ["mock_provider_only", "review_required", "auto_send_disabled", "voice_disabled"],
    "reviewRequired": true,
    "autoSend": false,
    "voiceEnabled": false
  },
  "generatedAt": "2026-04-26T21:45:25.000Z"
}
```

### Tones

| Tone | Example output |
|------|----------------|
| `professional` | "Good day, Acme BVBA. Thank you for calling SupportPlane. I can see we have 2 open ticket(s) on file. My name is the assigned support agent, and I'll be assisting you today. How may I help?" |
| `friendly` | "Hi Acme BVBA! This is SupportPlane. I see you're calling in — thanks for reaching out. I'm here to help with whatever you need today." |
| `concise` | "Good day, Acme BVBA. SupportPlane here. How can I assist?" |

## UI flow

1. Simulate a fake incoming call with auto-create enabled (or link a call to an existing session).
2. Select the support session.
3. In the **Greeting Suggestion** panel, choose a tone.
4. Click **Generate suggested greeting**.
5. Review the generated text.
6. Review the model metadata (provider, model, prompt version, context hash).
7. Copy the greeting if useful.
8. Observe the audit trail for the `greeting_suggestion_generated` event.

## Prompt/context metadata

- **Prompt ID:** `greeting-suggestion`
- **Prompt version:** `mock-v1`
- **Context hash:** SHA-256 of stable-sorted JSON including tenant, session, call event, tone, caller name, phone number, matched tickets, customer name, session title, and prompt metadata.
- **Deterministic:** identical context produces identical greeting and hash.

## Audit event emitted

- `greeting_suggestion_generated`
  - Metadata includes: `provider`, `model`, `promptId`, `promptVersion`, `contextHash`, `tone`, `callEventId`, `greetingText`, `mockOnly`

## Evidence bundle inclusion

Evidence bundles include a `greetingSuggestions` array with:
- `greetingText`
- `tone`
- `provider`, `model`, `promptVersion`, `contextHash`
- `mockOnly`, `reviewRequired`, `autoSend`, `voiceEnabled`
- `generatedAt`

## Mock AI / mock telephony limitations

- **No real telephony:** This is a mock webhook only. No PBX, SIP, WebRTC, or external provider is connected.
- **No real AI provider:** The AI gateway uses deterministic mock output. No external AI API calls are made.
- **Not spoken or sent automatically:** The greeting is for operator review only.
- **No voice/TTS/STT:** No audio generation or speech recognition is implemented.
- **In-memory store:** All data is lost on API restart.
- **No real authentication:** Actor identity comes from mock dev headers.

## Call Console integration

BL-043 exposes greeting suggestions inside `/call-console` when the selected
fake call is linked to a SupportSession. The Call Console passes `callEventId`,
tone, and mock model selection to `POST /support-sessions/:id/greeting-suggestion`
and displays:

- the generated greeting text
- provider `mock`
- model `mock-greeting-v1`
- prompt version `mock-v1`
- context hash
- tone
- `Auto-send: No`
- `Voice: No`

The generated greeting remains review-only and is not spoken, sent, or written
back automatically.

## Future path after BL-043

Later slices may add post-call summaries, ticket-note draft review, and fuller
demo fixtures. Real provider selection, voice, TTS, STT, and production
telephony are not implemented by BL-043.
