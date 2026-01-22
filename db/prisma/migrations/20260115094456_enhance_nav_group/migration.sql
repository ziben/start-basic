/*
  Warnings:

  - You are about to drop the column `role` on the `role_nav_group` table. All the data in the column will be lost.
  - Added the required column `roleName` to the `role_nav_group` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_role_nav_group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleName" TEXT NOT NULL,
    "navGroupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "role_nav_group_roleName_fkey" FOREIGN KEY ("roleName") REFERENCES "roles" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_nav_group_navGroupId_fkey" FOREIGN KEY ("navGroupId") REFERENCES "nav_group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_role_nav_group" ("createdAt", "id", "navGroupId") SELECT "createdAt", "id", "navGroupId" FROM "role_nav_group";
DROP TABLE "role_nav_group";
ALTER TABLE "new_role_nav_group" RENAME TO "role_nav_group";
CREATE UNIQUE INDEX "role_nav_group_roleName_navGroupId_key" ON "role_nav_group"("roleName", "navGroupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
