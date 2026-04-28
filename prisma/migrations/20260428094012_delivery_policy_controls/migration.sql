-- CreateTable
CREATE TABLE "delivery_policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "connectorInstallationId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Default Delivery Policy',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "killSwitch" BOOLEAN NOT NULL DEFAULT false,
    "dryRunRequired" BOOLEAN NOT NULL DEFAULT true,
    "mockOnlyEnforced" BOOLEAN NOT NULL DEFAULT true,
    "allowRealNetworkCalls" BOOLEAN NOT NULL DEFAULT false,
    "allowedActionTypes" TEXT[] DEFAULT ARRAY['ticket_note']::TEXT[],
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "minimumApproverRole" TEXT NOT NULL DEFAULT 'admin',
    "requireHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "requireEvidenceBundleBeforeDelivery" BOOLEAN NOT NULL DEFAULT false,
    "requireConnectorValidationBeforeDelivery" BOOLEAN NOT NULL DEFAULT false,
    "retryPolicy" JSONB NOT NULL DEFAULT '{}',
    "deadLetterPolicy" JSONB NOT NULL DEFAULT '{}',
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "policyVersion" INTEGER NOT NULL DEFAULT 1,
    "lastValidationStatus" TEXT NOT NULL DEFAULT 'not_run',
    "safetyFlags" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_policies_tenantId_idx" ON "delivery_policies"("tenantId");

-- CreateIndex
CREATE INDEX "delivery_policies_tenantId_enabled_idx" ON "delivery_policies"("tenantId", "enabled");

-- CreateIndex
CREATE INDEX "delivery_policies_tenantId_killSwitch_idx" ON "delivery_policies"("tenantId", "killSwitch");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_policies_tenantId_connectorInstallationId_key" ON "delivery_policies"("tenantId", "connectorInstallationId");

-- AddForeignKey
ALTER TABLE "delivery_policies" ADD CONSTRAINT "delivery_policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_policies" ADD CONSTRAINT "delivery_policies_connectorInstallationId_fkey" FOREIGN KEY ("connectorInstallationId") REFERENCES "connector_installations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
