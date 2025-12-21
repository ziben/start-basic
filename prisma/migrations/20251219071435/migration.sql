-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_nav_group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'APP',
    "orderIndex" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_nav_group" ("createdAt", "id", "orderIndex", "title", "updatedAt") SELECT "createdAt", "id", "orderIndex", "title", "updatedAt" FROM "nav_group";
DROP TABLE "nav_group";
ALTER TABLE "new_nav_group" RENAME TO "nav_group";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
