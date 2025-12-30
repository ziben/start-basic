/*
  Warnings:

  - You are about to drop the column `role` on the `role_nav_group` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "system_role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "qb_category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "qb_category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "qb_category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "qb_tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "qb_question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "options" JSONB,
    "answer" JSONB NOT NULL,
    "explanation" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "qb_question_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "qb_category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "qb_question_tag" (
    "questionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("questionId", "tagId"),
    CONSTRAINT "qb_question_tag_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "qb_question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "qb_question_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "qb_tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "qb_practice_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "qb_practice_attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qb_practice_attempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "qb_practice_session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "qb_practice_attempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "qb_question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_UserToSystemRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_UserToSystemRole_A_fkey" FOREIGN KEY ("A") REFERENCES "system_role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UserToSystemRole_B_fkey" FOREIGN KEY ("B") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_role_nav_group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleName" TEXT,
    "roleId" TEXT,
    "navGroupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "role_nav_group_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "system_role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_nav_group_navGroupId_fkey" FOREIGN KEY ("navGroupId") REFERENCES "nav_group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_role_nav_group" ("createdAt", "id", "navGroupId") SELECT "createdAt", "id", "navGroupId" FROM "role_nav_group";
DROP TABLE "role_nav_group";
ALTER TABLE "new_role_nav_group" RENAME TO "role_nav_group";
CREATE UNIQUE INDEX "role_nav_group_roleId_navGroupId_key" ON "role_nav_group"("roleId", "navGroupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "system_role_name_key" ON "system_role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "qb_tag_name_key" ON "qb_tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_UserToSystemRole_AB_unique" ON "_UserToSystemRole"("A", "B");

-- CreateIndex
CREATE INDEX "_UserToSystemRole_B_index" ON "_UserToSystemRole"("B");
