-- CreateTable
CREATE TABLE "nav_group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "nav_item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "icon" TEXT,
    "badge" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "isCollapsible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "navGroupId" TEXT,
    "parentId" TEXT,
    CONSTRAINT "nav_item_navGroupId_fkey" FOREIGN KEY ("navGroupId") REFERENCES "nav_group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "nav_item_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "nav_item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "role_nav_group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "navGroupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "role_nav_group_navGroupId_fkey" FOREIGN KEY ("navGroupId") REFERENCES "nav_group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_role_nav_group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "navGroupId" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_role_nav_group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_role_nav_group_navGroupId_fkey" FOREIGN KEY ("navGroupId") REFERENCES "nav_group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "role_nav_group_role_navGroupId_key" ON "role_nav_group"("role", "navGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_nav_group_userId_navGroupId_key" ON "user_role_nav_group"("userId", "navGroupId");
