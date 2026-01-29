/*
  Warnings:

  - You are about to drop the `qb_category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qb_practice_attempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qb_practice_session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qb_question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qb_question_tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qb_tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "qb_category";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "qb_practice_attempt";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "qb_practice_session";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "qb_question";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "qb_question_tag";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "qb_tag";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "payment_order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "outTradeNo" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "metadata" JSONB,
    CONSTRAINT "payment_order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_order_outTradeNo_key" ON "payment_order"("outTradeNo");

-- CreateIndex
CREATE INDEX "payment_order_userId_idx" ON "payment_order"("userId");

-- CreateIndex
CREATE INDEX "payment_order_status_idx" ON "payment_order"("status");

-- CreateIndex
CREATE INDEX "payment_order_createdAt_idx" ON "payment_order"("createdAt");
