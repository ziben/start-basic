/*
  Warnings:

  - You are about to drop the `organization_role_instance_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization_role_instances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `organizationRoleInstanceId` on the `member` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "organization_role_instance_permissions_organizationRoleInstanceId_permissionId_key";

-- DropIndex
DROP INDEX "organization_role_instance_permissions_permissionId_idx";

-- DropIndex
DROP INDEX "organization_role_instance_permissions_organizationRoleInstanceId_idx";

-- DropIndex
DROP INDEX "organization_role_instances_organizationId_name_key";

-- DropIndex
DROP INDEX "organization_role_instances_isActive_idx";

-- DropIndex
DROP INDEX "organization_role_instances_templateRoleId_idx";

-- DropIndex
DROP INDEX "organization_role_instances_organizationId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "organization_role_instance_permissions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "organization_role_instances";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "organization_role_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationRoleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "dataScope" TEXT NOT NULL DEFAULT 'ORG',
    "customScope" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "organization_role_permissions_organizationRoleId_fkey" FOREIGN KEY ("organizationRoleId") REFERENCES "organizationRole" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "organization_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "departmentId" TEXT,
    "organizationRoleId" TEXT,
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "member_organizationRoleId_fkey" FOREIGN KEY ("organizationRoleId") REFERENCES "organizationRole" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_member" ("createdAt", "departmentId", "id", "organizationId", "role", "userId") SELECT "createdAt", "departmentId", "id", "organizationId", "role", "userId" FROM "member";
DROP TABLE "member";
ALTER TABLE "new_member" RENAME TO "member";
CREATE INDEX "member_organizationRoleId_idx" ON "member"("organizationRoleId");
CREATE TABLE "new_organizationRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "templateRoleId" TEXT,
    "permission" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "organizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "organizationRole_templateRoleId_fkey" FOREIGN KEY ("templateRoleId") REFERENCES "roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_organizationRole" ("createdAt", "id", "organizationId", "permission", "role", "updatedAt") SELECT "createdAt", "id", "organizationId", "permission", "role", "updatedAt" FROM "organizationRole";
DROP TABLE "organizationRole";
ALTER TABLE "new_organizationRole" RENAME TO "organizationRole";
CREATE INDEX "organizationRole_organizationId_idx" ON "organizationRole"("organizationId");
CREATE INDEX "organizationRole_role_idx" ON "organizationRole"("role");
CREATE INDEX "organizationRole_templateRoleId_idx" ON "organizationRole"("templateRoleId");
CREATE UNIQUE INDEX "organizationRole_organizationId_role_key" ON "organizationRole"("organizationId", "role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "organization_role_permissions_organizationRoleId_idx" ON "organization_role_permissions"("organizationRoleId");

-- CreateIndex
CREATE INDEX "organization_role_permissions_permissionId_idx" ON "organization_role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_role_permissions_organizationRoleId_permissionId_key" ON "organization_role_permissions"("organizationRoleId", "permissionId");
