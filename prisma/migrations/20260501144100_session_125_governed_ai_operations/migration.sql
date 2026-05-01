-- Session 125: Governed AI Operations, Evidence/Audit Compliance, Admin Control Plane
-- Adds ModelUsageLog, AiChatSession, AiChatMessage, DataSubjectRequest

CREATE TABLE "model_usage_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL DEFAULT 'user',
    "sessionId" TEXT,
    "ticketId" TEXT,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "latencyMs" INTEGER NOT NULL,
    "estimatedCostUsd" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "model_usage_logs_tenantId_idx" ON "model_usage_logs"("tenantId");
CREATE INDEX "model_usage_logs_tenantId_feature_idx" ON "model_usage_logs"("tenantId", "feature");
CREATE INDEX "model_usage_logs_tenantId_provider_idx" ON "model_usage_logs"("tenantId", "provider");
CREATE INDEX "model_usage_logs_tenantId_status_idx" ON "model_usage_logs"("tenantId", "status");
CREATE INDEX "model_usage_logs_tenantId_createdAt_idx" ON "model_usage_logs"("tenantId", "createdAt");
CREATE INDEX "model_usage_logs_createdAt_idx" ON "model_usage_logs"("createdAt");

ALTER TABLE "model_usage_logs" ADD CONSTRAINT "model_usage_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_chat_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_chat_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_chat_sessions_tenantId_idx" ON "ai_chat_sessions"("tenantId");
CREATE INDEX "ai_chat_sessions_tenantId_sessionId_idx" ON "ai_chat_sessions"("tenantId", "sessionId");
CREATE INDEX "ai_chat_sessions_tenantId_status_idx" ON "ai_chat_sessions"("tenantId", "status");

ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_chat_messages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "chatSessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "usageMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_chat_messages_tenantId_idx" ON "ai_chat_messages"("tenantId");
CREATE INDEX "ai_chat_messages_tenantId_chatSessionId_idx" ON "ai_chat_messages"("tenantId", "chatSessionId");
CREATE INDEX "ai_chat_messages_chatSessionId_createdAt_idx" ON "ai_chat_messages"("chatSessionId", "createdAt");

ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ai_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "data_subject_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "resultUrl" TEXT,
    "resultCount" INTEGER,
    "errorCode" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "data_subject_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "data_subject_requests_tenantId_idx" ON "data_subject_requests"("tenantId");
CREATE INDEX "data_subject_requests_tenantId_status_idx" ON "data_subject_requests"("tenantId", "status");
CREATE INDEX "data_subject_requests_tenantId_requestType_idx" ON "data_subject_requests"("tenantId", "requestType");
CREATE INDEX "data_subject_requests_subjectId_idx" ON "data_subject_requests"("subjectId");

ALTER TABLE "data_subject_requests" ADD CONSTRAINT "data_subject_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
