/*
  Warnings:

  - You are about to drop the `_UserToSystemRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `roleId` on the `cross_org_access` table. All the data in the column will be lost.
  - You are about to drop the column `systemRoleId` on the `member` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `role_nav_group` table. All the data in the column will be lost.
  - You are about to drop the column `roleName` on the `role_nav_group` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `role_permissions` table. All the data in the column will be lost.
  - Added the required column `role` to the `cross_org_access` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `role_nav_group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `role_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables - 先迁移数据，再删除表
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cross_org_access" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "sourceOrgId" TEXT NOT NULL,
    "targetOrgId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "sourceDeptId" TEXT,
    "targetDeptId" TEXT,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_cross_org_access" ("accessLevel", "createdAt", "id", "resource", "sourceDeptId", "sourceOrgId", "targetDeptId", "targetOrgId", "updatedAt", "validFrom", "validUntil") SELECT "accessLevel", "createdAt", "id", "resource", "sourceDeptId", "sourceOrgId", "targetDeptId", "targetOrgId", "updatedAt", "validFrom", "validUntil" FROM "cross_org_access";
DROP TABLE "cross_org_access";
ALTER TABLE "new_cross_org_access" RENAME TO "cross_org_access";
CREATE INDEX "cross_org_access_role_idx" ON "cross_org_access"("role");
CREATE UNIQUE INDEX "cross_org_access_role_sourceOrgId_targetOrgId_resource_key" ON "cross_org_access"("role", "sourceOrgId", "targetOrgId", "resource");
CREATE TABLE "new_member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "departmentId" TEXT,
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_member" ("createdAt", "departmentId", "id", "organizationId", "role", "userId") SELECT "createdAt", "departmentId", "id", "organizationId", "role", "userId" FROM "member";
DROP TABLE "member";
ALTER TABLE "new_member" RENAME TO "member";
CREATE TABLE "new_role_nav_group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "navGroupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "role_nav_group_navGroupId_fkey" FOREIGN KEY ("navGroupId") REFERENCES "nav_group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- 迁移数据：使用 roleName 或从 system_role 获取 name
INSERT INTO "new_role_nav_group" ("createdAt", "id", "navGroupId", "role")
SELECT 
    rng."createdAt", 
    rng."id", 
    rng."navGroupId",
    COALESCE(rng."roleName", sr."name", 'user') as "role"
FROM "role_nav_group" rng
LEFT JOIN "system_role" sr ON rng."roleId" = sr."id";
DROP TABLE "role_nav_group";
ALTER TABLE "new_role_nav_group" RENAME TO "role_nav_group";
CREATE UNIQUE INDEX "role_nav_group_role_navGroupId_key" ON "role_nav_group"("role", "navGroupId");
CREATE TABLE "new_role_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "dataScope" TEXT NOT NULL DEFAULT 'ALL',
    "customScope" JSONB,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "timeRanges" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- 迁移数据：从 system_role 获取角色名
INSERT INTO "new_role_permissions" ("createdAt", "customScope", "dataScope", "id", "permissionId", "timeRanges", "updatedAt", "validFrom", "validUntil", "role")
SELECT 
    rp."createdAt", 
    rp."customScope", 
    rp."dataScope", 
    rp."id", 
    rp."permissionId", 
    rp."timeRanges", 
    rp."updatedAt", 
    rp."validFrom", 
    rp."validUntil",
    COALESCE(sr."name", 'user') as "role"
FROM "role_permissions" rp
LEFT JOIN "system_role" sr ON rp."roleId" = sr."id";
DROP TABLE "role_permissions";
ALTER TABLE "new_role_permissions" RENAME TO "role_permissions";
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");
CREATE UNIQUE INDEX "role_permissions_role_permissionId_key" ON "role_permissions"("role", "permissionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- 删除旧表和索引
DROP INDEX IF EXISTS "_UserToSystemRole_B_index";
DROP INDEX IF EXISTS "_UserToSystemRole_AB_unique";
DROP INDEX IF EXISTS "system_role_name_key";

PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS "_UserToSystemRole";
DROP TABLE IF EXISTS "system_role";
PRAGMA foreign_keys=on;
