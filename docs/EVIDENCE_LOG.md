# EVIDENCE_LOG.md

**Purpose:** Structured ledger of proof artifacts for user-facing claims and external planning references.

## EV-2026-04-26-001: Zammad CTI planning reference verified

- File: https://docs.zammad.org/en/latest/api/generic-cti/index.html
- Title: Zammad Generic CTI API documentation
- Source/System: docs
- Action: Opened official Zammad documentation during bootstrap.
- Shows:
  - Zammad documents Generic CTI under REST API documentation.
  - The page states CTI endpoints are relevant for PBX systems and include call events such as new call, hangup, and answer.
- Proves:
  - Zammad is a plausible first ticketing/CTI-adjacent planning target.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-002: GLPI API v2 planning reference verified

- File: https://help.glpi-project.org/documentation/modules/configuration/general/api/restful-api-v2
- Title: GLPI RESTful API v2 documentation
- Source/System: docs
- Action: Opened official GLPI help documentation during bootstrap.
- Shows:
  - GLPI documents a RESTful API v2 as its high-level API.
  - The legacy API remains available.
  - OAuth2 authentication and API versioning are documented.
- Proves:
  - GLPI is a plausible second ITSM/assets integration target.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-003: Asterisk ARI planning reference verified

- File: https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/
- Title: Asterisk REST Interface documentation
- Source/System: docs
- Action: Opened official Asterisk documentation during bootstrap.
- Shows:
  - ARI documentation exists for Asterisk REST Interface.
  - The docs warn against direct browser access in production and recommend putting Asterisk behind an application server for security, logging, multi-tenancy, and related concerns.
- Proves:
  - A SupportPlane CTI gateway in front of Asterisk is directionally consistent with Asterisk production guidance.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-004: MeshCentral planning reference verified

- File: https://github.com/Ylianst/MeshCentral
- Title: MeshCentral GitHub repository
- Source/System: docs
- Action: Opened the MeshCentral GitHub repository during bootstrap.
- Shows:
  - MeshCentral describes itself as a web-based remote monitoring and management site.
  - It supports agents plus web-based remote desktop, terminal, and file management.
- Proves:
  - MeshCentral is a plausible remote-support context/launch integration target.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-005: OWASP agentic AI security reference verified

- File: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- Title: OWASP Top 10 for Agentic Applications for 2026
- Source/System: docs
- Action: Opened OWASP Gen AI Security Project documentation during bootstrap.
- Shows:
  - OWASP frames the resource around agentic AI systems that plan, act, and make decisions across workflows.
- Proves:
  - SupportPlane's agentic/tooling threat model should explicitly consider agentic AI risks.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-006: NIST GAI profile reference verified

- File: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
- Title: NIST AI RMF Generative AI Profile
- Source/System: docs
- Action: Opened NIST publication page during bootstrap.
- Shows:
  - NIST published the Generative AI Profile on 2024-07-26 and updated the page on 2026-04-08.
  - The abstract frames it as a companion resource for incorporating trustworthiness considerations into AI systems.
- Proves:
  - NIST AI RMF GAI profile is a relevant governance reference for SupportPlane planning.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-007: EU AI Act timeline reference verified

- File: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
- Title: European Commission AI Act page
- Source/System: docs
- Action: Opened European Commission AI Act policy page during bootstrap.
- Shows:
  - The AI Act entered into force on 2024-08-01.
  - The page states full applicability on 2026-08-02 with exceptions, including high-risk embedded systems extending to 2027-08-02.
- Proves:
  - Compliance-related planning must avoid overclaiming and account for staged AI Act applicability.
- Type: source-data
- as_of: 2026-04-26T18:25:00+02:00

## EV-2026-04-26-008: Local bootstrap validation evidence

- File: /home/ff/Documents/Projects/SupportPlane
- Title: Local repo and host baseline observed
- Source/System: terminal
- Action: Inspected repo files, ran hygiene checks, parsed YAML, compiled scripts, checked git state, and inspected host/runtime basics.
- Shows:
  - no SupportPlane product runtime exists yet
  - the directory is not currently a Git repository
  - Python 3.14.4, Node 22.22.0, Podman 5.8.2, and Chrome are present; Docker is absent
- Proves:
  - Bootstrap state distinguishes observed facts from unknown runtime/git facts.
- Type: source-data
- as_of: 2026-04-26T18:40:00+02:00

## Entry Format

```yaml
- ID: EV-YYYY-MM-DD-001
  File: /absolute/path/to/artifact.png
  Title: short description
  Source/System: browser | api | test | log | screenshot | docs
  Route/Page: optional route or URL
  Action: what was done
  Shows:
    - visible fact 1
  Proves:
    - why the artifact matters
  Type: source-data | chatbot | gap | integration | docs-render-verification
  as_of: 2026-03-18T18:00:00+01:00
```
