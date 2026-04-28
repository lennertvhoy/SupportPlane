-- BL-097: Connector Credential Reference / Secret Broker Foundation

CREATE TABLE "connector_credential_references" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "connectorType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "secretKind" TEXT NOT NULL DEFAULT 'api_token_placeholder',
    "secretRef" TEXT NOT NULL DEFAULT 'local-dev-placeholder',
    "lastValidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,

    CONSTRAINT "connector_credential_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "connector_credential_references_tenantId_idx" ON "connector_credential_references"("tenantId");

-- CreateIndex
CREATE INDEX "connector_credential_references_tenantId_connectorType_idx" ON "connector_credential_references"("tenantId", "connectorType");

-- CreateIndex
CREATE INDEX "connector_credential_references_tenantId_status_idx" ON "connector_credential_references"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "connector_credential_references" ADD CONSTRAINT "connector_credential_references_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
