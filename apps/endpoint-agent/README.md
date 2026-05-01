# SupportPlane Endpoint Agent

Local-first endpoint agent for BL-055 through BL-060 and BL-118. The agent only
initiates outbound HTTP calls to the SupportPlane API and only executes fixed,
read-only diagnostic implementations.

## Local Dev

```bash
SUPPORTPLANE_API_URL=http://localhost:4110 \
SUPPORTPLANE_ENDPOINT_TENANT_ID=dev-tenant \
SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN=local-endpoint-enrollment-token \
npm run dev --workspace @supportplane/endpoint-agent
```

The first run registers the device and writes `.supportplane-endpoint-agent.json`
in the current working directory with the device token. The token is used for
later heartbeat, snapshot, command claim, and result submission requests.

## Safety Boundary

- No inbound listener is opened.
- No arbitrary shell, command string, eval, or dynamic script body exists.
- Command dispatch is a closed TypeScript switch over fixed command kinds:
  `collect_inventory`, `collect_disk`, `collect_network`, `collect_services`,
  `collect_software`, and `ping_self`.
- Collectors use Node `os`/`fs` APIs and read-only `/proc` or system metadata
  where available.
- Windows service and installed-software collectors use fixed `execFile`
  templates for `sc.exe` and `reg.exe`; they do not accept shell strings,
  PowerShell, `cmd.exe`, or user-supplied arguments.
