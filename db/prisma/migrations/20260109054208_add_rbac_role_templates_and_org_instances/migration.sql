/*
  Warnings:

  - You are about to drop the column `action` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `resource` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `role_permissions` table. All the data in the column will be lost.
  - Added the required column `actionId` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayName` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resourceId` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `role_permissions` table without a default value. This is not possible if the table is not empty.
  - Made the column `updatedAt` on table `verification` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "actions_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "organization_role_instances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "templateRoleId" TEXT,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "inheritPermissions" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "organization_role_instances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "organization_role_instances_templateRoleId_fkey" FOREIGN KEY ("templateRoleId") REFERENCES "roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "organization_role_instance_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationRoleInstanceId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "dataScope" TEXT NOT NULL DEFAULT 'ALL',
    "customScope" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "organization_role_instance_permissions_organizationRoleInstanceId_fkey" FOREIGN KEY ("organizationRoleInstanceId") REFERENCES "organization_role_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "organization_role_instance_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_account" ("accessToken", "accessTokenExpiresAt", "accountId", "createdAt", "id", "idToken", "password", "providerId", "refreshToken", "refreshTokenExpiresAt", "scope", "updatedAt", "userId") SELECT "accessToken", "accessTokenExpiresAt", "accountId", "createdAt", "id", "idToken", "password", "providerId", "refreshToken", "refreshTokenExpiresAt", "scope", "updatedAt", "userId" FROM "account";
DROP TABLE "account";
ALTER TABLE "new_account" RENAME TO "account";
CREATE INDEX "account_userId_idx" ON "account"("userId");
CREATE TABLE "new_invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "teamId" TEXT,
    "status" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviterId" TEXT NOT NULL,
    CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_invitation" ("email", "expiresAt", "id", "inviterId", "organizationId", "role", "status") SELECT "email", "expiresAt", "id", "inviterId", "organizationId", "role", "status" FROM "invitation";
DROP TABLE "invitation";
ALTER TABLE "new_invitation" RENAME TO "invitation";
CREATE TABLE "new_member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "departmentId" TEXT,
    "organizationRoleInstanceId" TEXT,
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "member_organizationRoleInstanceId_fkey" FOREIGN KEY ("organizationRoleInstanceId") REFERENCES "organization_role_instances" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_member" ("createdAt", "departmentId", "id", "organizationId", "role", "userId") SELECT "createdAt", "departmentId", "id", "organizationId", "role", "userId" FROM "member";
DROP TABLE "member";
ALTER TABLE "new_member" RENAME TO "member";
CREATE INDEX "member_organizationRoleInstanceId_idx" ON "member"("organizationRoleInstanceId");
CREATE TABLE "new_organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "logo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "metadata" TEXT
);
INSERT INTO "new_organization" ("createdAt", "id", "logo", "metadata", "name", "slug") SELECT "createdAt", "id", "logo", "metadata", "name", "slug" FROM "organization";
DROP TABLE "organization";
ALTER TABLE "new_organization" RENAME TO "organization";
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");
CREATE TABLE "new_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "permissions_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "permissions_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_permissions" ("category", "createdAt", "description", "id", "updatedAt") SELECT "category", "createdAt", "description", "id", "updatedAt" FROM "permissions";
DROP TABLE "permissions";
ALTER TABLE "new_permissions" RENAME TO "permissions";
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");
CREATE INDEX "permissions_code_idx" ON "permissions"("code");
CREATE INDEX "permissions_resourceId_idx" ON "permissions"("resourceId");
CREATE INDEX "permissions_actionId_idx" ON "permissions"("actionId");
CREATE INDEX "permissions_isSystem_idx" ON "permissions"("isSystem");
CREATE UNIQUE INDEX "permissions_resourceId_actionId_key" ON "permissions"("resourceId", "actionId");
CREATE TABLE "new_role_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "dataScope" TEXT NOT NULL DEFAULT 'ALL',
    "customScope" JSONB,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "timeRanges" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_role_permissions" ("createdAt", "customScope", "dataScope", "id", "permissionId", "timeRanges", "updatedAt", "validFrom", "validUntil") SELECT "createdAt", "customScope", "dataScope", "id", "permissionId", "timeRanges", "updatedAt", "validFrom", "validUntil" FROM "role_permissions";
DROP TABLE "role_permissions";
ALTER TABLE "new_role_permissions" RENAME TO "role_permissions";
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");
CREATE TABLE "new_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,
    "activeOrganizationId" TEXT,
    "activeTeamId" TEXT,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_session" ("activeOrganizationId", "activeTeamId", "createdAt", "expiresAt", "id", "impersonatedBy", "ipAddress", "token", "updatedAt", "userAgent", "userId") SELECT "activeOrganizationId", "activeTeamId", "createdAt", "expiresAt", "id", "impersonatedBy", "ipAddress", "token", "updatedAt", "userAgent", "userId" FROM "session";
DROP TABLE "session";
ALTER TABLE "new_session" RENAME TO "session";
CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "username" TEXT,
    "displayUsername" TEXT,
    "role" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" DATETIME
);
INSERT INTO "new_user" ("banExpires", "banReason", "banned", "createdAt", "displayUsername", "email", "emailVerified", "id", "image", "name", "role", "updatedAt", "username") SELECT "banExpires", "banReason", "banned", "createdAt", "displayUsername", "email", "emailVerified", "id", "image", "name", "role", "updatedAt", "username" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
CREATE TABLE "new_verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_verification" ("createdAt", "expiresAt", "id", "identifier", "updatedAt", "value") SELECT coalesce("createdAt", CURRENT_TIMESTAMP) AS "createdAt", "expiresAt", "id", "identifier", "updatedAt", "value" FROM "verification";
DROP TABLE "verification";
ALTER TABLE "new_verification" RENAME TO "verification";
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_scope_idx" ON "roles"("scope");

-- CreateIndex
CREATE INDEX "roles_isSystem_idx" ON "roles"("isSystem");

-- CreateIndex
CREATE INDEX "roles_isTemplate_idx" ON "roles"("isTemplate");

-- CreateIndex
CREATE INDEX "roles_isActive_idx" ON "roles"("isActive");

-- CreateIndex
CREATE INDEX "roles_sortOrder_idx" ON "roles"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "resources_name_key" ON "resources"("name");

-- CreateIndex
CREATE INDEX "resources_scope_idx" ON "resources"("scope");

-- CreateIndex
CREATE INDEX "resources_isSystem_idx" ON "resources"("isSystem");

-- CreateIndex
CREATE INDEX "actions_resourceId_idx" ON "actions"("resourceId");

-- CreateIndex
CREATE INDEX "actions_isSystem_idx" ON "actions"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "actions_resourceId_name_key" ON "actions"("resourceId", "name");

-- CreateIndex
CREATE INDEX "organization_role_instances_organizationId_idx" ON "organization_role_instances"("organizationId");

-- CreateIndex
CREATE INDEX "organization_role_instances_templateRoleId_idx" ON "organization_role_instances"("templateRoleId");

-- CreateIndex
CREATE INDEX "organization_role_instances_isActive_idx" ON "organization_role_instances"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "organization_role_instances_organizationId_name_key" ON "organization_role_instances"("organizationId", "name");

-- CreateIndex
CREATE INDEX "organization_role_instance_permissions_organizationRoleInstanceId_idx" ON "organization_role_instance_permissions"("organizationRoleInstanceId");

-- CreateIndex
CREATE INDEX "organization_role_instance_permissions_permissionId_idx" ON "organization_role_instance_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_role_instance_permissions_organizationRoleInstanceId_permissionId_key" ON "organization_role_instance_permissions"("organizationRoleInstanceId", "permissionId");
