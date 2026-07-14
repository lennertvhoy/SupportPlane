# ADR 0001: Stateware public naming

Status: accepted
Date: 2026-07-14

## Decision

The public category is **Stateware**, the engineering method is
**State-Centric Engineering**, and the portable application specification is
**StateSpec**. Current operator and contributor copy uses those names.

## Compatibility boundary

Existing `statedd-*` command paths, OpenCode skill and agent IDs, workflow and
script filenames, schema/version identifiers, repository history, and evidence
remain valid legacy identifiers. They are not physically renamed in this
slice, because doing so would break automation and invalidate established
references. Initializer output now presents StateSpec while accepting legacy
template detection during the compatibility period.

## Migration rule

New public prose uses Stateware, State-Centric Engineering, and StateSpec.
Parsers and operators continue to accept StateDD identifiers until a separately
versioned physical migration provides aliases, tests, and rollback.
