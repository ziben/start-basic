ALTER TABLE "audit_log" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "audit_log" ADD COLUMN "requestId" TEXT;

CREATE INDEX "audit_log_organizationId_createdAt_idx" ON "audit_log"("organizationId", "createdAt");
CREATE INDEX "audit_log_requestId_idx" ON "audit_log"("requestId");
