-- BL-073/074 knowledge retrieval hardening.
-- These fields record embedding provenance without requiring pgvector to be
-- installed. Vector storage/search remains gated by runtime pgvector readiness.
ALTER TABLE "knowledge_articles"
  ADD COLUMN "embeddingProvider" TEXT,
  ADD COLUMN "embeddingModel" TEXT,
  ADD COLUMN "embeddingDimensions" INTEGER,
  ADD COLUMN "embeddingContentHash" TEXT,
  ADD COLUMN "embeddedAt" TIMESTAMP(3);

CREATE INDEX "knowledge_articles_tenantId_embeddingProvider_idx"
  ON "knowledge_articles"("tenantId", "embeddingProvider");
