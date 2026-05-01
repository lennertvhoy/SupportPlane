CREATE TABLE "endpoint_devices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "agentVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'online',
    "lastSeenAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endpoint_devices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "endpoint_heartbeats" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "agentVersion" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "endpoint_heartbeats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "endpoint_diagnostic_snapshots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceAgentVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endpoint_diagnostic_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "endpoint_commands" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "commandKind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "nonce" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "policyDecision" JSONB NOT NULL DEFAULT '{}',
    "result" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endpoint_commands_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "endpoint_command_results" (
    "id" TEXT NOT NULL,
    "commandId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endpoint_command_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "endpoint_devices_tenantId_deviceKey_key" ON "endpoint_devices"("tenantId", "deviceKey");
CREATE UNIQUE INDEX "endpoint_devices_tenantId_fingerprint_key" ON "endpoint_devices"("tenantId", "fingerprint");
CREATE INDEX "endpoint_devices_tenantId_idx" ON "endpoint_devices"("tenantId");
CREATE INDEX "endpoint_devices_tenantId_status_idx" ON "endpoint_devices"("tenantId", "status");
CREATE INDEX "endpoint_devices_tenantId_lastSeenAt_idx" ON "endpoint_devices"("tenantId", "lastSeenAt");

CREATE INDEX "endpoint_heartbeats_tenantId_idx" ON "endpoint_heartbeats"("tenantId");
CREATE INDEX "endpoint_heartbeats_tenantId_deviceId_idx" ON "endpoint_heartbeats"("tenantId", "deviceId");
CREATE INDEX "endpoint_heartbeats_observedAt_idx" ON "endpoint_heartbeats"("observedAt");

CREATE INDEX "endpoint_diagnostic_snapshots_tenantId_idx" ON "endpoint_diagnostic_snapshots"("tenantId");
CREATE INDEX "endpoint_diagnostic_snapshots_tenantId_deviceId_idx" ON "endpoint_diagnostic_snapshots"("tenantId", "deviceId");
CREATE INDEX "endpoint_diagnostic_snapshots_tenantId_deviceId_kind_idx" ON "endpoint_diagnostic_snapshots"("tenantId", "deviceId", "kind");
CREATE INDEX "endpoint_diagnostic_snapshots_collectedAt_idx" ON "endpoint_diagnostic_snapshots"("collectedAt");

CREATE UNIQUE INDEX "endpoint_commands_tenantId_idempotencyKey_key" ON "endpoint_commands"("tenantId", "idempotencyKey");
CREATE UNIQUE INDEX "endpoint_commands_tenantId_nonce_key" ON "endpoint_commands"("tenantId", "nonce");
CREATE INDEX "endpoint_commands_tenantId_idx" ON "endpoint_commands"("tenantId");
CREATE INDEX "endpoint_commands_tenantId_deviceId_idx" ON "endpoint_commands"("tenantId", "deviceId");
CREATE INDEX "endpoint_commands_tenantId_status_idx" ON "endpoint_commands"("tenantId", "status");
CREATE INDEX "endpoint_commands_expiresAt_idx" ON "endpoint_commands"("expiresAt");

CREATE UNIQUE INDEX "endpoint_command_results_tenantId_commandId_key" ON "endpoint_command_results"("tenantId", "commandId");
CREATE INDEX "endpoint_command_results_tenantId_idx" ON "endpoint_command_results"("tenantId");
CREATE INDEX "endpoint_command_results_tenantId_deviceId_idx" ON "endpoint_command_results"("tenantId", "deviceId");
CREATE INDEX "endpoint_command_results_submittedAt_idx" ON "endpoint_command_results"("submittedAt");

ALTER TABLE "endpoint_devices" ADD CONSTRAINT "endpoint_devices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "endpoint_heartbeats" ADD CONSTRAINT "endpoint_heartbeats_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "endpoint_heartbeats" ADD CONSTRAINT "endpoint_heartbeats_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "endpoint_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "endpoint_diagnostic_snapshots" ADD CONSTRAINT "endpoint_diagnostic_snapshots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "endpoint_diagnostic_snapshots" ADD CONSTRAINT "endpoint_diagnostic_snapshots_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "endpoint_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "endpoint_commands" ADD CONSTRAINT "endpoint_commands_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "endpoint_commands" ADD CONSTRAINT "endpoint_commands_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "endpoint_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "endpoint_command_results" ADD CONSTRAINT "endpoint_command_results_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "endpoint_command_results" ADD CONSTRAINT "endpoint_command_results_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "endpoint_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "endpoint_command_results" ADD CONSTRAINT "endpoint_command_results_commandId_fkey" FOREIGN KEY ("commandId") REFERENCES "endpoint_commands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
