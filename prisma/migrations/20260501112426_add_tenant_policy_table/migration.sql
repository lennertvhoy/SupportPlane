-- CreateTable
CREATE TABLE "tenant_policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "scopeId" TEXT,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_policies_tenantId_idx" ON "tenant_policies"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_policies_policyType_idx" ON "tenant_policies"("policyType");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_policies_tenantId_policyType_scopeId_key" ON "tenant_policies"("tenantId", "policyType", "scopeId");

-- AddForeignKey
ALTER TABLE "tenant_policies" ADD CONSTRAINT "tenant_policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
