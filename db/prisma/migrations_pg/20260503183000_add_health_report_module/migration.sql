DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HealthReportStatus') THEN
    CREATE TYPE "HealthReportStatus" AS ENUM ('DRAFT', 'OCR_TEXT_READY', 'PARSED', 'FAILED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HealthMetricFlag') THEN
    CREATE TYPE "HealthMetricFlag" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'ABNORMAL', 'UNKNOWN');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "health_report" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "examDate" TIMESTAMP(3),
  "sourceFileName" TEXT,
  "ocrText" TEXT NOT NULL,
  "status" "HealthReportStatus" NOT NULL DEFAULT 'DRAFT',
  "parseError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "health_report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "health_metric_catalog" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "defaultUnit" TEXT,
  "aliases" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "health_metric_catalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "health_metric_result" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "metricId" TEXT,
  "rawName" TEXT NOT NULL,
  "valueText" TEXT NOT NULL,
  "numericValue" DOUBLE PRECISION,
  "unit" TEXT,
  "referenceRange" TEXT,
  "flag" "HealthMetricFlag" NOT NULL DEFAULT 'UNKNOWN',
  "rawLine" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "health_metric_result_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "health_metric_catalog_code_key"
  ON "health_metric_catalog" ("code");

CREATE INDEX IF NOT EXISTS "health_report_userId_idx"
  ON "health_report" ("userId");

CREATE INDEX IF NOT EXISTS "health_report_examDate_idx"
  ON "health_report" ("examDate");

CREATE INDEX IF NOT EXISTS "health_report_createdAt_idx"
  ON "health_report" ("createdAt");

CREATE INDEX IF NOT EXISTS "health_metric_catalog_name_idx"
  ON "health_metric_catalog" ("name");

CREATE INDEX IF NOT EXISTS "health_metric_result_reportId_idx"
  ON "health_metric_result" ("reportId");

CREATE INDEX IF NOT EXISTS "health_metric_result_metricId_idx"
  ON "health_metric_result" ("metricId");

CREATE INDEX IF NOT EXISTS "health_metric_result_rawName_idx"
  ON "health_metric_result" ("rawName");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'health_report_userId_fkey'
  ) THEN
    ALTER TABLE "health_report"
      ADD CONSTRAINT "health_report_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'health_metric_result_reportId_fkey'
  ) THEN
    ALTER TABLE "health_metric_result"
      ADD CONSTRAINT "health_metric_result_reportId_fkey"
      FOREIGN KEY ("reportId") REFERENCES "health_report"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'health_metric_result_metricId_fkey'
  ) THEN
    ALTER TABLE "health_metric_result"
      ADD CONSTRAINT "health_metric_result_metricId_fkey"
      FOREIGN KEY ("metricId") REFERENCES "health_metric_catalog"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
