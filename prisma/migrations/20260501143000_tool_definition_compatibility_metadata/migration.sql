ALTER TABLE "tool_definitions"
  ADD COLUMN IF NOT EXISTS "requiredPrivilege" TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS "dryRunCapable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "commandTemplateId" TEXT;
