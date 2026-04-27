-- BL-092 Durable action/outbox workflow foundation.
-- Local/mock-only delivery state. No external writeback or queue worker is created here.

CREATE TABLE "support_actions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "callEventId" TEXT,
    "customerReferenceId" TEXT,
    "ticketReferenceId" TEXT,
    "connectorInstallationId" TEXT,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "idempotencyKey" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewDecision" TEXT,
    "reviewReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "queuedAt" TIMESTAMP(3),
    "mockDeliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "payloadSummary" JSONB NOT NULL DEFAULT '{}',
    "safeBodyPreview" TEXT,
    "mockDevOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "action_outbox_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supportActionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "connectorInstallationId" TEXT,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "idempotencyKey" TEXT NOT NULL,
    "deliveryIntent" JSONB NOT NULL DEFAULT '{}',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "latestAttemptState" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mockDeliveredAt" TIMESTAMP(3),
    "lastError" TEXT,
    "safetyFlags" JSONB NOT NULL DEFAULT '{}',
    "mockDevOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_outbox_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "action_outbox_attempts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "outboxItemId" TEXT NOT NULL,
    "supportActionId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "deliveryResult" JSONB NOT NULL DEFAULT '{}',
    "errorMessage" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mockDevOnly" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "action_outbox_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_actions_tenantId_idempotencyKey_key" ON "support_actions"("tenantId", "idempotencyKey");
CREATE INDEX "support_actions_tenantId_idx" ON "support_actions"("tenantId");
CREATE INDEX "support_actions_tenantId_sessionId_idx" ON "support_actions"("tenantId", "sessionId");
CREATE INDEX "support_actions_tenantId_status_idx" ON "support_actions"("tenantId", "status");
CREATE INDEX "support_actions_actionType_idx" ON "support_actions"("actionType");
CREATE INDEX "support_actions_createdAt_idx" ON "support_actions"("createdAt");

CREATE UNIQUE INDEX "action_outbox_items_tenantId_idempotencyKey_key" ON "action_outbox_items"("tenantId", "idempotencyKey");
CREATE INDEX "action_outbox_items_tenantId_idx" ON "action_outbox_items"("tenantId");
CREATE INDEX "action_outbox_items_tenantId_status_idx" ON "action_outbox_items"("tenantId", "status");
CREATE INDEX "action_outbox_items_tenantId_sessionId_idx" ON "action_outbox_items"("tenantId", "sessionId");
CREATE INDEX "action_outbox_items_tenantId_supportActionId_idx" ON "action_outbox_items"("tenantId", "supportActionId");
CREATE INDEX "action_outbox_items_queuedAt_idx" ON "action_outbox_items"("queuedAt");

CREATE INDEX "action_outbox_attempts_tenantId_idx" ON "action_outbox_attempts"("tenantId");
CREATE INDEX "action_outbox_attempts_tenantId_outboxItemId_idx" ON "action_outbox_attempts"("tenantId", "outboxItemId");
CREATE INDEX "action_outbox_attempts_tenantId_supportActionId_idx" ON "action_outbox_attempts"("tenantId", "supportActionId");
CREATE INDEX "action_outbox_attempts_attemptedAt_idx" ON "action_outbox_attempts"("attemptedAt");

ALTER TABLE "support_actions" ADD CONSTRAINT "support_actions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_actions" ADD CONSTRAINT "support_actions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "support_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_outbox_items" ADD CONSTRAINT "action_outbox_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_outbox_items" ADD CONSTRAINT "action_outbox_items_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "support_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_outbox_items" ADD CONSTRAINT "action_outbox_items_supportActionId_fkey" FOREIGN KEY ("supportActionId") REFERENCES "support_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_outbox_attempts" ADD CONSTRAINT "action_outbox_attempts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_outbox_attempts" ADD CONSTRAINT "action_outbox_attempts_outboxItemId_fkey" FOREIGN KEY ("outboxItemId") REFERENCES "action_outbox_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_outbox_attempts" ADD CONSTRAINT "action_outbox_attempts_supportActionId_fkey" FOREIGN KEY ("supportActionId") REFERENCES "support_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
