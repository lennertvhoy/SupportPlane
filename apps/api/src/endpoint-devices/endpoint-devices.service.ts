import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import {
  AuditActorType,
  AuditEventType,
  EndpointCommandKind,
  EndpointCommandStatus,
  EndpointDiagnosticKind,
  EndpointDeviceStatus,
  type AuditEvent,
  type EndpointCommand,
  type EndpointCommandResult,
  type EndpointDevice,
  type EndpointDiagnosticSnapshot,
  type EndpointHeartbeat,
} from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import type { Store } from '../store/store.interface.js';
import type { CurrentIdentity } from '../auth/auth.types.js';
import { requirePermission } from '../auth/rbac.js';

const allowedCommandKinds = EndpointCommandKind.options;
const readOnlyDiagnosticKinds = EndpointDiagnosticKind.options;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function nowIso(): string {
  return new Date().toISOString();
}

function enrollmentToken(): string {
  return process.env['SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN'] ?? 'local-endpoint-enrollment-token';
}

function makeFingerprint(tenantId: string, deviceKey: string, hostname: string): string {
  return sha256(`${tenantId}:${deviceKey}:${hostname}`).slice(0, 48);
}

@Injectable()
export class EndpointDevicesService {
  constructor(@Inject(InMemoryStore) private readonly store: Store) {}

  async registerDevice(body: {
    tenantId?: string;
    enrollmentToken?: string;
    deviceKey?: string;
    displayName?: string;
    hostname?: string;
    platform?: string;
    agentVersion?: string;
    inventory?: Record<string, unknown>;
  }): Promise<{ device: EndpointDevice; deviceToken: string; note: string }> {
    if (!body.tenantId || !body.deviceKey || !body.hostname || !body.platform || !body.agentVersion) {
      throw new BadRequestException('tenantId, deviceKey, hostname, platform, and agentVersion are required.');
    }
    if (!body.enrollmentToken || body.enrollmentToken !== enrollmentToken()) {
      throw new UnauthorizedException('Invalid endpoint enrollment token.');
    }

    const existing = await this.store.getEndpointDeviceByKey(body.tenantId, body.deviceKey);
    const deviceToken = `spdev_${randomBytes(24).toString('hex')}`;
    const at = nowIso();
    const device: EndpointDevice = {
      id: (existing?.id ?? randomUUID()) as EndpointDevice['id'],
      tenantId: body.tenantId as EndpointDevice['tenantId'],
      displayName: body.displayName ?? body.hostname,
      hostname: body.hostname,
      deviceKey: body.deviceKey,
      fingerprint: existing?.fingerprint ?? makeFingerprint(body.tenantId, body.deviceKey, body.hostname),
      platform: body.platform,
      agentVersion: body.agentVersion,
      status: EndpointDeviceStatus.enum.online,
      lastSeenAt: at,
      enrolledAt: existing?.enrolledAt ?? at,
      createdAt: existing?.createdAt ?? at,
      updatedAt: at,
    };
    await this.store.saveEndpointDevice(device, sha256(deviceToken));
    await this.audit(device.tenantId, 'endpoint-agent', AuditActorType.enum.system, AuditEventType.enum.endpoint_device_registered, 'endpoint_device', device.id, {
      hostname: device.hostname,
      platform: device.platform,
      agentVersion: device.agentVersion,
      outboundOnly: true,
    });
    if (body.inventory) {
      await this.saveSnapshotForDevice(device, 'inventory', body.inventory);
    }
    return {
      device,
      deviceToken,
      note: 'Device token is shown once. The agent stores it locally and only initiates outbound API requests.',
    };
  }

  async authenticateAgent(tenantId: string | undefined, deviceKey: string | undefined, token: string | undefined): Promise<EndpointDevice> {
    if (!tenantId || !deviceKey || !token) {
      throw new UnauthorizedException('Endpoint agent tenant, device key, and token are required.');
    }
    const device = await this.store.getEndpointDeviceByKey(tenantId, deviceKey);
    if (!device || !device.tokenHash || device.tokenHash !== sha256(token)) {
      throw new UnauthorizedException('Endpoint device identity could not be verified.');
    }
    return device;
  }

  async heartbeat(device: EndpointDevice, body: { agentVersion?: string; status?: string; summary?: Record<string, unknown>; inventory?: Record<string, unknown> }) {
    const at = nowIso();
    const status = EndpointDeviceStatus.safeParse(body.status ?? 'online').success ? body.status as EndpointDevice['status'] : EndpointDeviceStatus.enum.online;
    const heartbeat: EndpointHeartbeat = {
      id: randomUUID(),
      tenantId: device.tenantId,
      deviceId: device.id,
      status,
      agentVersion: body.agentVersion ?? device.agentVersion,
      observedAt: at,
      summary: body.summary ?? {},
    };
    await this.store.saveEndpointHeartbeat(heartbeat);
    await this.store.saveEndpointDevice({ ...device, status, agentVersion: heartbeat.agentVersion, lastSeenAt: at, updatedAt: at });
    await this.audit(device.tenantId, device.id, AuditActorType.enum.system, AuditEventType.enum.endpoint_heartbeat_received, 'endpoint_device', device.id, {
      status,
      agentVersion: heartbeat.agentVersion,
    });
    if (body.inventory) {
      await this.saveSnapshotForDevice({ ...device, agentVersion: heartbeat.agentVersion }, 'inventory', body.inventory);
    }
    return { heartbeat };
  }

  async submitSnapshot(device: EndpointDevice, body: { kind?: string; payload?: Record<string, unknown>; collectedAt?: string }) {
    const parsed = EndpointDiagnosticKind.safeParse(body.kind);
    if (!parsed.success || !readOnlyDiagnosticKinds.includes(parsed.data)) {
      throw new BadRequestException('Unsupported read-only diagnostic kind.');
    }
    const snapshot = await this.saveSnapshotForDevice(device, parsed.data, body.payload ?? {}, body.collectedAt);
    return { snapshot };
  }

  async claimNext(device: EndpointDevice) {
    const command = await this.store.claimNextEndpointCommand(device.tenantId, device.id, { now: nowIso() });
    if (command) {
      await this.audit(device.tenantId, device.id, AuditActorType.enum.system, AuditEventType.enum.endpoint_command_claimed, 'endpoint_command', command.id, {
        commandKind: command.commandKind,
        nonce: command.nonce,
      });
    }
    return { command: command ?? null };
  }

  async submitResult(device: EndpointDevice, commandId: string, body: { nonce?: string; status?: string; payload?: Record<string, unknown>; errorCode?: string; errorMessage?: string }) {
    const command = await this.store.getEndpointCommand(device.tenantId, commandId);
    if (!command || command.deviceId !== device.id) {
      await this.audit(device.tenantId, device.id, AuditActorType.enum.system, AuditEventType.enum.endpoint_command_rejected, 'endpoint_command', commandId, {
        reason: 'wrong_tenant_or_device',
      });
      throw new NotFoundException('Endpoint command not found for this device.');
    }
    if (command.nonce !== body.nonce) {
      await this.audit(device.tenantId, device.id, AuditActorType.enum.system, AuditEventType.enum.endpoint_command_replay_rejected, 'endpoint_command', command.id, {
        reason: 'nonce_mismatch',
      });
      throw new ForbiddenException('Command nonce mismatch.');
    }
    if (Date.parse(command.expiresAt) <= Date.now()) {
      await this.store.saveEndpointCommand({ ...command, status: EndpointCommandStatus.enum.expired, updatedAt: nowIso() });
      throw new ForbiddenException('Endpoint command is expired.');
    }
    const existing = await this.store.getEndpointCommandResult(device.tenantId, command.id);
    if (existing) {
      await this.audit(device.tenantId, device.id, AuditActorType.enum.system, AuditEventType.enum.endpoint_command_replay_rejected, 'endpoint_command', command.id, {
        reason: 'duplicate_result',
      });
      throw new ForbiddenException('Endpoint command result was already accepted.');
    }
    const status = EndpointCommandStatus.safeParse(body.status).success ? body.status as EndpointCommand['status'] : EndpointCommandStatus.enum.succeeded;
    if (!['succeeded', 'failed'].includes(status)) {
      throw new BadRequestException('Command results may only be succeeded or failed.');
    }
    const submittedAt = nowIso();
    const result: EndpointCommandResult = {
      id: randomUUID() as EndpointCommandResult['id'],
      commandId: command.id,
      tenantId: device.tenantId,
      deviceId: device.id,
      status,
      payload: body.payload ?? {},
      errorCode: body.errorCode,
      errorMessage: body.errorMessage,
      submittedAt,
    };
    await this.store.saveEndpointCommandResult(result);
    await this.store.saveEndpointCommand({
      ...command,
      status,
      completedAt: submittedAt,
      updatedAt: submittedAt,
      result: result.payload,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
    });
    await this.audit(device.tenantId, device.id, AuditActorType.enum.system, AuditEventType.enum.endpoint_command_result_received, 'endpoint_command', command.id, {
      commandKind: command.commandKind,
      status,
      readOnly: true,
    });
    return { result };
  }

  async listDevices(identity: CurrentIdentity) {
    requirePermission(identity, 'endpoint_device:read');
    return { devices: await this.store.listEndpointDevices(identity.tenantId) };
  }

  async getDeviceDetail(identity: CurrentIdentity, deviceId: string) {
    requirePermission(identity, 'endpoint_device:read');
    const device = await this.store.getEndpointDevice(identity.tenantId, deviceId);
    if (!device) throw new NotFoundException('Endpoint device not found.');
    const [heartbeats, snapshots, commands] = await Promise.all([
      this.store.listEndpointHeartbeats(identity.tenantId, deviceId),
      this.store.listEndpointDiagnosticSnapshots(identity.tenantId, deviceId),
      this.store.listEndpointCommands(identity.tenantId, deviceId),
    ]);
    return { device, heartbeats, snapshots, commands };
  }

  async requestCommand(identity: CurrentIdentity, deviceId: string, body: { commandKind?: string; idempotencyKey?: string }) {
    requirePermission(identity, 'endpoint_command:create');
    const forbiddenExecutableFields = ['command', 'shell', 'script', 'argv', 'executable', 'program'];
    const presentExecutableField = forbiddenExecutableFields.find((field) => Object.prototype.hasOwnProperty.call(body, field));
    if (presentExecutableField) {
      await this.audit(identity.tenantId, identity.userId, AuditActorType.enum.user, AuditEventType.enum.endpoint_command_policy_denied, 'endpoint_device', deviceId, {
        requestedCommandKind: body.commandKind,
        reason: 'arbitrary_execution_field_rejected',
        rejectedField: presentExecutableField,
      });
      throw new BadRequestException('Endpoint diagnostics accept fixed command kinds only. Arbitrary shell, script, argv, and executable fields are rejected.');
    }
    const parsed = EndpointCommandKind.safeParse(body.commandKind);
    if (!parsed.success || !allowedCommandKinds.includes(parsed.data)) {
      await this.audit(identity.tenantId, identity.userId, AuditActorType.enum.user, AuditEventType.enum.endpoint_command_policy_denied, 'endpoint_device', deviceId, {
        requestedCommandKind: body.commandKind,
        reason: 'unknown_or_unsupported_command',
      });
      throw new BadRequestException('Unsupported endpoint diagnostic command. Arbitrary shell and custom command bodies are not accepted.');
    }
    const device = await this.store.getEndpointDevice(identity.tenantId, deviceId);
    if (!device) throw new NotFoundException('Endpoint device not found.');
    const policyDecision = this.evaluateDiagnosticPolicy(identity, device, parsed.data);
    if (!policyDecision.allowed) {
      await this.audit(identity.tenantId, identity.userId, AuditActorType.enum.user, AuditEventType.enum.endpoint_command_policy_denied, 'endpoint_device', deviceId, policyDecision);
      throw new ForbiddenException({ message: 'Endpoint diagnostic policy denied the command.', policyDecision });
    }
    const idempotencyKey = body.idempotencyKey ?? `${identity.tenantId}:${deviceId}:${parsed.data}:${new Date().toISOString().slice(0, 16)}`;
    const existing = await this.store.getEndpointCommandByIdempotencyKey(identity.tenantId, idempotencyKey);
    if (existing) return { command: existing, idempotentReplay: true };
    const at = nowIso();
    const command: EndpointCommand = {
      id: randomUUID() as EndpointCommand['id'],
      tenantId: identity.tenantId as EndpointCommand['tenantId'],
      deviceId: device.id,
      commandKind: parsed.data,
      status: EndpointCommandStatus.enum.queued,
      nonce: randomBytes(24).toString('hex'),
      idempotencyKey,
      requestedByUserId: identity.userId,
      requestedAt: at,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      policyDecision,
      createdAt: at,
      updatedAt: at,
    };
    await this.store.saveEndpointCommand(command);
    await this.audit(identity.tenantId, identity.userId, AuditActorType.enum.user, AuditEventType.enum.endpoint_command_requested, 'endpoint_command', command.id, {
      deviceId,
      commandKind: command.commandKind,
      nonce: command.nonce,
      policyDecision,
      readOnly: true,
    });
    return { command, idempotentReplay: false };
  }

  private evaluateDiagnosticPolicy(identity: CurrentIdentity, device: EndpointDevice, commandKind: string) {
    const allowed = ['admin', 'owner', 'operator', 'support_agent'].some((role) => identity.roles.includes(role));
    return {
      allowed,
      decision: allowed ? 'read_only_diagnostic_allowed' : 'role_denied',
      riskLevel: 'read_only',
      commandKind,
      deviceId: device.id,
      tenantId: identity.tenantId,
      arbitraryShellAllowed: false,
      remediationAllowed: false,
      fixedImplementationOnly: true,
    };
  }

  private async saveSnapshotForDevice(device: EndpointDevice, kind: EndpointDiagnosticSnapshot['kind'], payload: Record<string, unknown>, collectedAt?: string) {
    const at = nowIso();
    const snapshot: EndpointDiagnosticSnapshot = {
      id: randomUUID() as EndpointDiagnosticSnapshot['id'],
      tenantId: device.tenantId,
      deviceId: device.id,
      kind,
      payload,
      collectedAt: collectedAt ?? at,
      sourceAgentVersion: device.agentVersion,
      createdAt: at,
    };
    await this.store.saveEndpointDiagnosticSnapshot(snapshot);
    await this.audit(device.tenantId, device.id, AuditActorType.enum.system, kind === 'inventory' ? AuditEventType.enum.endpoint_inventory_received : AuditEventType.enum.endpoint_diagnostic_snapshot_received, 'endpoint_device', device.id, {
      kind,
      readOnly: true,
    });
    return snapshot;
  }

  private async audit(tenantId: string, actorId: string, actorType: AuditActorType, eventType: AuditEventType, resourceType: string, resourceId: string, metadata: Record<string, unknown>) {
    const auditActorId = actorType === AuditActorType.enum.user ? actorId : 'dev-admin';
    const event: AuditEvent = {
      id: randomUUID() as AuditEvent['id'],
      tenantId: tenantId as AuditEvent['tenantId'],
      eventType,
      actorType,
      actorId: auditActorId,
      action: eventType,
      resourceType,
      resourceId,
      metadata: actorType === AuditActorType.enum.user ? metadata : { ...metadata, agentActorId: actorId },
      createdAt: nowIso(),
    };
    event.integrityHash = computeIntegrityHash(event);
    await this.store.saveAuditEvent(event);
  }
}
