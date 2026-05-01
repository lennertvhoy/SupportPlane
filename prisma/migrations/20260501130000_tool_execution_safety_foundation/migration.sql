-- BL-061 through BL-068: Tool Execution Safety Foundation
-- Adds ToolManifestRecord, ToolDefinition, ToolInvocation, ToolApproval, ToolResultNoteDraft

CREATE TABLE "tool_manifest_records" (
    "id" TEXT NOT NULL,
    "manifestVersion" TEXT NOT NULL,
    "registryVersion" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "integrityHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_manifest_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tool_definitions" (
    "id" TEXT NOT NULL,
    "manifestId" TEXT NOT NULL,
    "toolKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "implementationId" TEXT NOT NULL,
    "readOnly" BOOLEAN NOT NULL DEFAULT true,
    "remediation" BOOLEAN NOT NULL DEFAULT false,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "requiredPermission" TEXT NOT NULL DEFAULT 'endpoint_command:create',
    "supportedPlatforms" JSONB NOT NULL DEFAULT '[]',
    "inputSchema" JSONB NOT NULL DEFAULT '{}',
    "outputSchema" JSONB NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tool_definitions_toolKey_key" ON "tool_definitions"("toolKey");
CREATE INDEX "tool_definitions_manifestId_idx" ON "tool_definitions"("manifestId");
CREATE INDEX "tool_definitions_category_idx" ON "tool_definitions"("category");
CREATE INDEX "tool_definitions_riskLevel_idx" ON "tool_definitions"("riskLevel");
CREATE INDEX "tool_definitions_enabled_idx" ON "tool_definitions"("enabled");

ALTER TABLE "tool_definitions" ADD CONSTRAINT "tool_definitions_manifestId_fkey" FOREIGN KEY ("manifestId") REFERENCES "tool_manifest_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "tool_invocations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "toolDefinitionId" TEXT NOT NULL,
    "toolKey" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "policyDecision" JSONB NOT NULL DEFAULT '{}',
    "approvalId" TEXT,
    "endpointCommandId" TEXT,
    "requestedInput" JSONB NOT NULL DEFAULT '{}',
    "normalizedResult" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "tool_invocations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tool_invocations_tenantId_idx" ON "tool_invocations"("tenantId");
CREATE INDEX "tool_invocations_tenantId_deviceId_idx" ON "tool_invocations"("tenantId", "deviceId");
CREATE INDEX "tool_invocations_tenantId_status_idx" ON "tool_invocations"("tenantId", "status");
CREATE INDEX "tool_invocations_toolDefinitionId_idx" ON "tool_invocations"("toolDefinitionId");
CREATE UNIQUE INDEX "tool_invocations_approvalId_key" ON "tool_invocations"("approvalId");
CREATE INDEX "tool_invocations_endpointCommandId_idx" ON "tool_invocations"("endpointCommandId");
CREATE INDEX "tool_invocations_createdAt_idx" ON "tool_invocations"("createdAt");

ALTER TABLE "tool_invocations" ADD CONSTRAINT "tool_invocations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tool_invocations" ADD CONSTRAINT "tool_invocations_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "endpoint_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tool_invocations" ADD CONSTRAINT "tool_invocations_toolDefinitionId_fkey" FOREIGN KEY ("toolDefinitionId") REFERENCES "tool_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "tool_approvals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invocationId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "reason" TEXT,
    "comment" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_approvals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tool_approvals_invocationId_key" ON "tool_approvals"("invocationId");
CREATE INDEX "tool_approvals_tenantId_idx" ON "tool_approvals"("tenantId");
CREATE INDEX "tool_approvals_tenantId_status_idx" ON "tool_approvals"("tenantId", "status");
CREATE INDEX "tool_approvals_requestedByUserId_idx" ON "tool_approvals"("requestedByUserId");
CREATE INDEX "tool_approvals_approvedByUserId_idx" ON "tool_approvals"("approvedByUserId");
CREATE INDEX "tool_approvals_expiresAt_idx" ON "tool_approvals"("expiresAt");

ALTER TABLE "tool_approvals" ADD CONSTRAINT "tool_approvals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tool_invocations" ADD CONSTRAINT "tool_invocations_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "tool_approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "tool_result_note_drafts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invocationId" TEXT NOT NULL,
    "ticketId" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_result_note_drafts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tool_result_note_drafts_invocationId_key" ON "tool_result_note_drafts"("invocationId");
CREATE INDEX "tool_result_note_drafts_tenantId_idx" ON "tool_result_note_drafts"("tenantId");
CREATE INDEX "tool_result_note_drafts_tenantId_status_idx" ON "tool_result_note_drafts"("tenantId", "status");

ALTER TABLE "tool_result_note_drafts" ADD CONSTRAINT "tool_result_note_drafts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
