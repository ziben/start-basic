-- CreateTable
CREATE TABLE "zc_share_action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareCode" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "zc_share_action_shareCode_fkey" FOREIGN KEY ("shareCode") REFERENCES "zc_share_link" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "zc_share_action_shareCode_idx" ON "zc_share_action"("shareCode");

-- CreateIndex
CREATE INDEX "zc_share_action_channel_idx" ON "zc_share_action"("channel");

-- CreateIndex
CREATE INDEX "zc_share_action_createdAt_idx" ON "zc_share_action"("createdAt");
