-- 1) enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConfigValueType') THEN
    CREATE TYPE "ConfigValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'STRING_ARRAY');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConfigChangeType') THEN
    CREATE TYPE "ConfigChangeType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'REFRESH');
  END IF;
END $$;

-- 2) system_config enrich
ALTER TABLE "system_config"
  ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'runtime',
  ADD COLUMN IF NOT EXISTS "valueType" "ConfigValueType" NOT NULL DEFAULT 'JSON',
  ADD COLUMN IF NOT EXISTS "isSecret" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "isEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- 3) audit table
CREATE TABLE IF NOT EXISTS "system_config_change" (
  "id" TEXT NOT NULL,
  "configId" TEXT NOT NULL,
  "configKey" TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "valueType" "ConfigValueType" NOT NULL DEFAULT 'JSON',
  "changeType" "ConfigChangeType" NOT NULL DEFAULT 'UPDATE',
  "operatorId" TEXT,
  "operatorName" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "system_config_change_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "system_config_change_configId_createdAt_idx"
  ON "system_config_change" ("configId", "createdAt");

CREATE INDEX IF NOT EXISTS "system_config_change_configKey_createdAt_idx"
  ON "system_config_change" ("configKey", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'system_config_change_configId_fkey'
  ) THEN
    ALTER TABLE "system_config_change"
      ADD CONSTRAINT "system_config_change_configId_fkey"
      FOREIGN KEY ("configId") REFERENCES "system_config"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
