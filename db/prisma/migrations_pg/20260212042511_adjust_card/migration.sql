/*
  Warnings:

  - You are about to drop the column `nameEn` on the `zc_tarot_card` table. All the data in the column will be lost.
  - You are about to drop the `zc_share_action` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `number` on table `zc_tarot_card` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "zc_share_action" DROP CONSTRAINT "zc_share_action_shareCode_fkey";

-- AlterTable
ALTER TABLE "zc_tarot_card" DROP COLUMN "nameEn",
ALTER COLUMN "number" SET NOT NULL;

-- DropTable
DROP TABLE "zc_share_action";

-- DropEnum
DROP TYPE "ZcShareChannel";
