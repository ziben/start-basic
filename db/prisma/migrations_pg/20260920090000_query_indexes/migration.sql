CREATE INDEX "payment_order_status_createdAt_idx" ON "payment_order"("status", "createdAt");
CREATE INDEX "ai_conversation_userId_updatedAt_id_idx" ON "ai_conversation"("userId", "updatedAt", "id");
CREATE INDEX "health_report_userId_createdAt_idx" ON "health_report"("userId", "createdAt");
