-- BL-093 Outbox worker retry/dead-letter foundation.
-- Additive local PostgreSQL outbox worker fields only. No external broker or real writeback.

ALTER TABLE "action_outbox_items"
  ADD COLUMN "deliveryMode" TEXT NOT NULL DEFAULT 'mock',
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "processingStartedAt" TIMESTAMP(3),
  ADD COLUMN "workerLockId" TEXT,
  ADD COLUMN "workerLockedAt" TIMESTAMP(3),
  ADD COLUMN "workerLockExpiresAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "retryScheduledAt" TIMESTAMP(3),
  ADD COLUMN "deadLetteredAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "lastErrorCode" TEXT,
  ADD COLUMN "lastErrorMessage" TEXT,
  ADD COLUMN "lastErrorRedacted" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "deadLetterReason" TEXT;

UPDATE "action_outbox_items"
SET
  "deliveryMode" = 'mock',
  "maxAttempts" = 3,
  "lastErrorMessage" = "lastError",
  "lastErrorRedacted" = true
WHERE "deliveryMode" = 'mock';

ALTER TABLE "action_outbox_attempts"
  ADD COLUMN "errorCode" TEXT,
  ADD COLUMN "errorRedacted" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE INDEX "action_outbox_items_tenantId_status_nextAttemptAt_idx" ON "action_outbox_items"("tenantId", "status", "nextAttemptAt");
CREATE INDEX "action_outbox_items_tenantId_workerLockExpiresAt_idx" ON "action_outbox_items"("tenantId", "workerLockExpiresAt");
CREATE INDEX "action_outbox_items_tenantId_connectorInstallationId_idx" ON "action_outbox_items"("tenantId", "connectorInstallationId");
CREATE UNIQUE INDEX "action_outbox_attempts_tenantId_outboxItemId_attemptNumber_key" ON "action_outbox_attempts"("tenantId", "outboxItemId", "attemptNumber");
