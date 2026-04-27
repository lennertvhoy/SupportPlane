-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedUserId" TEXT,
    "linkedTicketIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiContextPacketIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "screenObservationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "callEventIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "auditEventIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticketing_adapters" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adapterType" TEXT NOT NULL,
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "config" JSONB NOT NULL DEFAULT '{}',
    "secretReferenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticketing_adapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_references" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adapterId" TEXT NOT NULL,
    "externalTicketId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "customerEmail" TEXT,
    "customerName" TEXT,
    "rawData" JSONB,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_context_packets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "sourceTicketIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceAdapterId" TEXT,
    "payload" JSONB NOT NULL,
    "redactionLog" JSONB NOT NULL DEFAULT '[]',
    "contextHash" TEXT,
    "modelPolicySnapshotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_context_packets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screen_observations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "callEventId" TEXT,
    "source" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'review_required',
    "rawInputPlaceholder" TEXT,
    "redactedSummary" TEXT,
    "appLabel" TEXT,
    "windowLabel" TEXT,
    "urlLabel" TEXT,
    "sharingState" TEXT NOT NULL DEFAULT 'inactive',
    "rawImageRetention" TEXT NOT NULL DEFAULT 'disabled',
    "redactionStatus" TEXT NOT NULL DEFAULT 'not_needed',
    "safetyFlags" JSONB NOT NULL DEFAULT '{}',
    "noRawPixels" BOOLEAN NOT NULL DEFAULT true,
    "noClipboard" BOOLEAN NOT NULL DEFAULT true,
    "noOcr" BOOLEAN NOT NULL DEFAULT true,
    "noCredentialCapture" BOOLEAN NOT NULL DEFAULT true,
    "mockDevOnly" BOOLEAN NOT NULL DEFAULT true,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "contextPacketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screen_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sharing_states" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'inactive',
    "mockDevOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sharing_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_decisions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT,
    "outcome" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "reason" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "toolManifestSnapshotId" TEXT,
    "riskLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "hashChainPrevious" TEXT,
    "integrityHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalCallId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "caller" JSONB NOT NULL DEFAULT '{}',
    "callerMatch" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "answeredAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "mockDevOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_recordings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callEventId" TEXT NOT NULL,
    "supportSessionId" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "mockMediaUrl" TEXT,
    "placeholderReference" TEXT,
    "storageType" TEXT NOT NULL,
    "checksumHash" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "updatedAt" TIMESTAMP(3),
    "mockDevOnly" BOOLEAN NOT NULL DEFAULT true,
    "complianceDisclaimer" TEXT,
    "noRealAudio" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_note_drafts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "externalTicketId" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_note_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoleToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "roles_tenantId_idx" ON "roles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenantId_name_key" ON "roles"("tenantId", "name");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE INDEX "support_sessions_tenantId_idx" ON "support_sessions"("tenantId");

-- CreateIndex
CREATE INDEX "support_sessions_tenantId_status_idx" ON "support_sessions"("tenantId", "status");

-- CreateIndex
CREATE INDEX "support_sessions_assignedUserId_idx" ON "support_sessions"("assignedUserId");

-- CreateIndex
CREATE INDEX "support_sessions_startedAt_idx" ON "support_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "ticketing_adapters_tenantId_idx" ON "ticketing_adapters"("tenantId");

-- CreateIndex
CREATE INDEX "ticketing_adapters_tenantId_status_idx" ON "ticketing_adapters"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ticket_references_tenantId_idx" ON "ticket_references"("tenantId");

-- CreateIndex
CREATE INDEX "ticket_references_tenantId_status_idx" ON "ticket_references"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ticket_references_externalTicketId_idx" ON "ticket_references"("externalTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_references_tenantId_adapterId_externalTicketId_key" ON "ticket_references"("tenantId", "adapterId", "externalTicketId");

-- CreateIndex
CREATE INDEX "ai_context_packets_tenantId_idx" ON "ai_context_packets"("tenantId");

-- CreateIndex
CREATE INDEX "ai_context_packets_tenantId_sessionId_idx" ON "ai_context_packets"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "ai_context_packets_provenance_idx" ON "ai_context_packets"("provenance");

-- CreateIndex
CREATE INDEX "ai_context_packets_createdAt_idx" ON "ai_context_packets"("createdAt");

-- CreateIndex
CREATE INDEX "screen_observations_tenantId_idx" ON "screen_observations"("tenantId");

-- CreateIndex
CREATE INDEX "screen_observations_tenantId_sessionId_idx" ON "screen_observations"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "screen_observations_kind_idx" ON "screen_observations"("kind");

-- CreateIndex
CREATE INDEX "screen_observations_createdAt_idx" ON "screen_observations"("createdAt");

-- CreateIndex
CREATE INDEX "sharing_states_tenantId_idx" ON "sharing_states"("tenantId");

-- CreateIndex
CREATE INDEX "sharing_states_tenantId_sessionId_idx" ON "sharing_states"("tenantId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "sharing_states_tenantId_sessionId_key" ON "sharing_states"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "policy_decisions_tenantId_idx" ON "policy_decisions"("tenantId");

-- CreateIndex
CREATE INDEX "policy_decisions_tenantId_sessionId_idx" ON "policy_decisions"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "policy_decisions_outcome_idx" ON "policy_decisions"("outcome");

-- CreateIndex
CREATE INDEX "policy_decisions_resourceType_resourceId_idx" ON "policy_decisions"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "policy_decisions_createdAt_idx" ON "policy_decisions"("createdAt");

-- CreateIndex
CREATE INDEX "audit_events_tenantId_idx" ON "audit_events"("tenantId");

-- CreateIndex
CREATE INDEX "audit_events_tenantId_sessionId_idx" ON "audit_events"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "audit_events_eventType_idx" ON "audit_events"("eventType");

-- CreateIndex
CREATE INDEX "audit_events_actorType_actorId_idx" ON "audit_events"("actorType", "actorId");

-- CreateIndex
CREATE INDEX "audit_events_resourceType_resourceId_idx" ON "audit_events"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");

-- CreateIndex
CREATE INDEX "call_events_tenantId_idx" ON "call_events"("tenantId");

-- CreateIndex
CREATE INDEX "call_events_tenantId_sessionId_idx" ON "call_events"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "call_events_externalCallId_idx" ON "call_events"("externalCallId");

-- CreateIndex
CREATE INDEX "call_events_status_idx" ON "call_events"("status");

-- CreateIndex
CREATE INDEX "call_events_createdAt_idx" ON "call_events"("createdAt");

-- CreateIndex
CREATE INDEX "call_recordings_tenantId_idx" ON "call_recordings"("tenantId");

-- CreateIndex
CREATE INDEX "call_recordings_tenantId_callEventId_idx" ON "call_recordings"("tenantId", "callEventId");

-- CreateIndex
CREATE INDEX "call_recordings_supportSessionId_idx" ON "call_recordings"("supportSessionId");

-- CreateIndex
CREATE INDEX "call_recordings_createdAt_idx" ON "call_recordings"("createdAt");

-- CreateIndex
CREATE INDEX "internal_note_drafts_tenantId_idx" ON "internal_note_drafts"("tenantId");

-- CreateIndex
CREATE INDEX "internal_note_drafts_tenantId_sessionId_idx" ON "internal_note_drafts"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "internal_note_drafts_externalTicketId_idx" ON "internal_note_drafts"("externalTicketId");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_sessions" ADD CONSTRAINT "support_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_sessions" ADD CONSTRAINT "support_sessions_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticketing_adapters" ADD CONSTRAINT "ticketing_adapters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_references" ADD CONSTRAINT "ticket_references_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_references" ADD CONSTRAINT "ticket_references_adapterId_fkey" FOREIGN KEY ("adapterId") REFERENCES "ticketing_adapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_context_packets" ADD CONSTRAINT "ai_context_packets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_context_packets" ADD CONSTRAINT "ai_context_packets_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "support_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen_observations" ADD CONSTRAINT "screen_observations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen_observations" ADD CONSTRAINT "screen_observations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "support_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sharing_states" ADD CONSTRAINT "sharing_states_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sharing_states" ADD CONSTRAINT "sharing_states_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "support_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_decisions" ADD CONSTRAINT "policy_decisions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_decisions" ADD CONSTRAINT "policy_decisions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "support_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_decisions" ADD CONSTRAINT "policy_decisions_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "support_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_events" ADD CONSTRAINT "call_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_events" ADD CONSTRAINT "call_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "support_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_recordings" ADD CONSTRAINT "call_recordings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_recordings" ADD CONSTRAINT "call_recordings_callEventId_fkey" FOREIGN KEY ("callEventId") REFERENCES "call_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_recordings" ADD CONSTRAINT "call_recordings_supportSessionId_fkey" FOREIGN KEY ("supportSessionId") REFERENCES "support_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_note_drafts" ADD CONSTRAINT "internal_note_drafts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_note_drafts" ADD CONSTRAINT "internal_note_drafts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "support_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
