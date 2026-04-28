-- AlterTable
ALTER TABLE "connector_installations" ADD COLUMN     "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mockMode" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timeoutMs" INTEGER;

-- CreateIndex
CREATE INDEX "connector_installations_tenantId_enabled_idx" ON "connector_installations"("tenantId", "enabled");
