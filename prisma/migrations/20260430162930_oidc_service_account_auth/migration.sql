-- CreateTable
CREATE TABLE "oidc_auth_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "idTokenSub" TEXT NOT NULL,
    "idTokenIssuer" TEXT NOT NULL,
    "idTokenAud" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oidc_auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_account_tokens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceAccountId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_account_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oidc_auth_sessions_tokenHash_key" ON "oidc_auth_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "oidc_auth_sessions_tenantId_idx" ON "oidc_auth_sessions"("tenantId");

-- CreateIndex
CREATE INDEX "oidc_auth_sessions_userId_idx" ON "oidc_auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "oidc_auth_sessions_expiresAt_idx" ON "oidc_auth_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "service_accounts_tenantId_idx" ON "service_accounts"("tenantId");

-- CreateIndex
CREATE INDEX "service_accounts_tenantId_status_idx" ON "service_accounts"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "service_account_tokens_tokenHash_key" ON "service_account_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "service_account_tokens_tenantId_idx" ON "service_account_tokens"("tenantId");

-- CreateIndex
CREATE INDEX "service_account_tokens_serviceAccountId_idx" ON "service_account_tokens"("serviceAccountId");

-- CreateIndex
CREATE INDEX "service_account_tokens_expiresAt_idx" ON "service_account_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "oidc_auth_sessions" ADD CONSTRAINT "oidc_auth_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oidc_auth_sessions" ADD CONSTRAINT "oidc_auth_sessions_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_accounts" ADD CONSTRAINT "service_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_account_tokens" ADD CONSTRAINT "service_account_tokens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_account_tokens" ADD CONSTRAINT "service_account_tokens_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "service_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
