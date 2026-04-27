-- BL-018 local auth/RBAC foundation.
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT;
CREATE UNIQUE INDEX "users_tenantId_id_key" ON "users"("tenantId", "id");

CREATE TABLE "local_auth_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "local_auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "local_auth_sessions_tokenHash_key" ON "local_auth_sessions"("tokenHash");
CREATE INDEX "local_auth_sessions_tenantId_idx" ON "local_auth_sessions"("tenantId");
CREATE INDEX "local_auth_sessions_userId_idx" ON "local_auth_sessions"("userId");
CREATE INDEX "local_auth_sessions_expiresAt_idx" ON "local_auth_sessions"("expiresAt");

ALTER TABLE "local_auth_sessions" ADD CONSTRAINT "local_auth_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "local_auth_sessions" ADD CONSTRAINT "local_auth_sessions_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
