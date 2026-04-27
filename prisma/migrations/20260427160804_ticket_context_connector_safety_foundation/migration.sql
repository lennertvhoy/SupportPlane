-- AlterTable
ALTER TABLE "ticket_references" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "customer_references" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adapterId" TEXT NOT NULL,
    "externalCustomerId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "rawData" JSONB,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_summaries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketReferenceId" TEXT NOT NULL,
    "sessionId" TEXT,
    "generatedBy" TEXT,
    "summaryText" TEXT,
    "keyPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentiment" TEXT,
    "source" TEXT NOT NULL,
    "redactionLog" JSONB NOT NULL DEFAULT '[]',
    "mockDevOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_installations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adapterType" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "secretReferenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "safetyFlags" JSONB NOT NULL DEFAULT '{}',
    "lastVerifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connector_installations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_references_tenantId_idx" ON "customer_references"("tenantId");

-- CreateIndex
CREATE INDEX "customer_references_tenantId_email_idx" ON "customer_references"("tenantId", "email");

-- CreateIndex
CREATE INDEX "customer_references_tenantId_phone_idx" ON "customer_references"("tenantId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "customer_references_tenantId_adapterId_externalCustomerId_key" ON "customer_references"("tenantId", "adapterId", "externalCustomerId");

-- CreateIndex
CREATE INDEX "ticket_summaries_tenantId_idx" ON "ticket_summaries"("tenantId");

-- CreateIndex
CREATE INDEX "ticket_summaries_tenantId_ticketReferenceId_idx" ON "ticket_summaries"("tenantId", "ticketReferenceId");

-- CreateIndex
CREATE INDEX "ticket_summaries_tenantId_sessionId_idx" ON "ticket_summaries"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "connector_installations_tenantId_idx" ON "connector_installations"("tenantId");

-- CreateIndex
CREATE INDEX "connector_installations_tenantId_status_idx" ON "connector_installations"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "connector_installations_tenantId_name_key" ON "connector_installations"("tenantId", "name");

-- CreateIndex
CREATE INDEX "ticket_references_customerId_idx" ON "ticket_references"("customerId");

-- AddForeignKey
ALTER TABLE "customer_references" ADD CONSTRAINT "customer_references_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_references" ADD CONSTRAINT "customer_references_adapterId_fkey" FOREIGN KEY ("adapterId") REFERENCES "ticketing_adapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_references" ADD CONSTRAINT "ticket_references_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_references"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_summaries" ADD CONSTRAINT "ticket_summaries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_summaries" ADD CONSTRAINT "ticket_summaries_ticketReferenceId_fkey" FOREIGN KEY ("ticketReferenceId") REFERENCES "ticket_references"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_summaries" ADD CONSTRAINT "ticket_summaries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "support_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_installations" ADD CONSTRAINT "connector_installations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
