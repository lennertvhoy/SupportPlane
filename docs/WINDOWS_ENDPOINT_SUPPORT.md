# Windows Endpoint Support

**Status:** Architecture-grade foundation implemented. Real Windows runtime proof pending.

**Updated:** 2026-05-01

## Current Status

SupportPlane now treats Windows as a first-class endpoint platform alongside Linux and macOS. The architecture includes:

- Canonical `EndpointPlatform` enum: `linux`, `win32`, `darwin`, `unknown`
- Platform normalization for device registration and policy evaluation
- Platform-aware collector modules in the endpoint agent
- UI platform badges and unsupported tool states
- Mocked Windows endpoint in local development seed data

## What Works on Windows (Local/Mock Foundation)

### Read-Only Diagnostics

| Collector | Linux | Windows | macOS | Notes |
|-----------|-------|---------|-------|-------|
| `status` (ping_self) | ✅ | ✅ | ✅ | Cross-platform via Node `os` module |
| `inventory` | ✅ | ✅ | ✅ | Hostname, platform, arch, CPU, memory |
| `disk` | ✅ | ✅ | ✅ | Uses `fs.statfs`; Windows tries `C:\` |
| `network` | ✅ | ✅ | ✅ | Uses `os.networkInterfaces()` |
| `services` | ✅ | ❌ | ❌ | Linux `/proc` only; Windows returns `unsupported` |

### Remediation

| Tool | Linux | Windows | macOS | Notes |
|------|-------|---------|-------|-------|
| `flush_dns_cache` | ❌ | ❌ | ❌ | Returns `unsupported: true` with honest note |
| `clear_temp_preview` | ❌ | ❌ | ❌ | Returns `unsupported: true` with honest note |

All remediation commands are `enabled: false` in the local tool manifest.

## Security Model

- **No arbitrary shell:** Windows support does not use PowerShell, `cmd.exe`, or any dynamic command execution.
- **No arbitrary WMI:** Windows collectors use Node.js built-in APIs only (`os`, `fs`).
- **Fixed implementation IDs only:** The agent dispatch table maps `commandKind` to platform-specific collector functions.
- **Platform gate:** Policy engine rejects tools not supported by the endpoint platform before dispatch.
- **Unknown platform fails closed:** Devices reporting unrecognized platforms are denied all platform-gated tools.

## Policy Behavior

### Allowed
- Windows device invoking `diagnostic.status` → `allowed: true`
- Windows device invoking `diagnostic.inventory` → `allowed: true`

### Denied
- Windows device invoking `diagnostic.services` → `decision: unsupported_platform`
- Windows device invoking `remediation.flush_dns_cache` → `decision: unsupported_platform`
- Unknown platform invoking any platform-gated tool → `decision: unsupported_platform`

## Agent Architecture

```
apps/endpoint-agent/src/
├── collectors/
│   ├── shared.ts      # Cross-platform: inventory, network, ping
│   ├── linux.ts       # Linux: disk (statfs), services (/proc)
│   ├── win32.ts       # Windows: disk (statfs C:\), services (unsupported)
│   ├── darwin.ts      # macOS: disk (statfs), services (unsupported)
│   └── index.ts       # Platform-aware dispatch table
├── platform.ts        # Platform provider + normalization
└── index.ts           # Agent lifecycle (register, heartbeat, claim, dispatch)
```

## Testing Without Windows

Unit tests mock platform behavior by importing platform-specific collector modules directly:

```bash
cd apps/endpoint-agent
npm test
```

Platform policy tests use devices registered with `platform: win32` against the API:

```bash
cd apps/api
npm test
```

## What Requires a Real Windows Runner

1. **Windows `fs.statfs` on `C:\`** — Node.js may behave differently on real Windows vs. Linux mock.
2. **Windows service enumeration** — A safe non-shell implementation (WMI bindings, native addon, or external helper) needs real Windows verification.
3. **Windows remediation** — Flush DNS cache without PowerShell requires Windows-specific APIs.
4. **Installed software inventory** — Reading Windows registry or WMI safely is not yet implemented.
5. **Service packaging** — MSI/EXE installer, Windows Service wrapper, and auto-start behavior.

## Future Work

See backlog items:
- **BL-130:** Windows diagnostics collectors completion (services, installed software)
- **BL-131:** Windows tool-manifest compatibility completion
- **BL-132:** Windows service/install packaging plan
- **BL-133:** Windows verification strategy (real runner)

## Honest Limitations

- All Windows behavior in this slice is validated via unit tests and mocked device records on a Fedora Linux host.
- No real Windows endpoint was used for verification.
- The `diagnostic.disk` collector on Windows uses `fs.statfs('C:\\')`, which may fail on some Windows configurations or Node.js versions.
- Service enumeration and remediation explicitly return `unsupported` rather than faking success.
