CREATE TABLE IF NOT EXISTS "health_person" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "gender" TEXT,
  "birthDate" TIMESTAMP(3),
  "relationLabel" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "health_person_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "health_report"
  ADD COLUMN IF NOT EXISTS "personId" TEXT;

CREATE INDEX IF NOT EXISTS "health_person_ownerUserId_idx"
  ON "health_person" ("ownerUserId");

CREATE INDEX IF NOT EXISTS "health_person_ownerUserId_name_idx"
  ON "health_person" ("ownerUserId", "name");

CREATE INDEX IF NOT EXISTS "health_report_personId_idx"
  ON "health_report" ("personId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'health_person_ownerUserId_fkey'
  ) THEN
    ALTER TABLE "health_person"
      ADD CONSTRAINT "health_person_ownerUserId_fkey"
      FOREIGN KEY ("ownerUserId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'health_report_personId_fkey'
  ) THEN
    ALTER TABLE "health_report"
      ADD CONSTRAINT "health_report_personId_fkey"
      FOREIGN KEY ("personId") REFERENCES "health_person"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
