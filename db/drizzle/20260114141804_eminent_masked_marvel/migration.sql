CREATE TABLE `drizzila_tasks` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`label` text DEFAULT 'documentation' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_account` (
	`id` text PRIMARY KEY,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` numeric,
	`refreshTokenExpiresAt` numeric,
	`scope` text,
	`password` text,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `fk_account_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_account`(`id`, `accountId`, `providerId`, `userId`, `accessToken`, `refreshToken`, `idToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, `password`, `createdAt`, `updatedAt`) SELECT `id`, `accountId`, `providerId`, `userId`, `accessToken`, `refreshToken`, `idToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, `password`, `createdAt`, `updatedAt` FROM `account`;--> statement-breakpoint
DROP TABLE `account`;--> statement-breakpoint
ALTER TABLE `__new_account` RENAME TO `account`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_actions` (
	`id` text PRIMARY KEY,
	`resourceId` text NOT NULL,
	`name` text NOT NULL,
	`displayName` text NOT NULL,
	`description` text,
	`isSystem` integer DEFAULT false NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `fk_actions_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_actions`(`id`, `resourceId`, `name`, `displayName`, `description`, `isSystem`, `createdAt`, `updatedAt`) SELECT `id`, `resourceId`, `name`, `displayName`, `description`, `isSystem`, `createdAt`, `updatedAt` FROM `actions`;--> statement-breakpoint
DROP TABLE `actions`;--> statement-breakpoint
ALTER TABLE `__new_actions` RENAME TO `actions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_audit_log` (
	`id` text PRIMARY KEY,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`actorUserId` text,
	`actorRole` text,
	`action` text NOT NULL,
	`targetType` text NOT NULL,
	`targetId` text,
	`ip` text,
	`userAgent` text,
	`success` integer DEFAULT true NOT NULL,
	`message` text,
	`meta` JSONB,
	CONSTRAINT `fk_audit_log_actorUserId_user_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_audit_log`(`id`, `createdAt`, `actorUserId`, `actorRole`, `action`, `targetType`, `targetId`, `ip`, `userAgent`, `success`, `message`, `meta`) SELECT `id`, `createdAt`, `actorUserId`, `actorRole`, `action`, `targetType`, `targetId`, `ip`, `userAgent`, `success`, `message`, `meta` FROM `audit_log`;--> statement-breakpoint
DROP TABLE `audit_log`;--> statement-breakpoint
ALTER TABLE `__new_audit_log` RENAME TO `audit_log`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_departments` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`organizationId` text NOT NULL,
	`parentId` text,
	`level` integer DEFAULT 1 NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`leader` text,
	`phone` text,
	`email` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `fk_departments_organizationId_organization_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_departments_parentId_departments_id_fk` FOREIGN KEY (`parentId`) REFERENCES `departments`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_departments`(`id`, `name`, `code`, `organizationId`, `parentId`, `level`, `sort`, `leader`, `phone`, `email`, `status`, `createdAt`, `updatedAt`) SELECT `id`, `name`, `code`, `organizationId`, `parentId`, `level`, `sort`, `leader`, `phone`, `email`, `status`, `createdAt`, `updatedAt` FROM `departments`;--> statement-breakpoint
DROP TABLE `departments`;--> statement-breakpoint
ALTER TABLE `__new_departments` RENAME TO `departments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_field_permissions` (
	`id` text PRIMARY KEY,
	`permissionId` text NOT NULL,
	`resource` text NOT NULL,
	`field` text NOT NULL,
	`access` text NOT NULL,
	`condition` JSONB,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `fk_field_permissions_permissionId_permissions_id_fk` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_field_permissions`(`id`, `permissionId`, `resource`, `field`, `access`, `condition`, `createdAt`, `updatedAt`) SELECT `id`, `permissionId`, `resource`, `field`, `access`, `condition`, `createdAt`, `updatedAt` FROM `field_permissions`;--> statement-breakpoint
DROP TABLE `field_permissions`;--> statement-breakpoint
ALTER TABLE `__new_field_permissions` RENAME TO `field_permissions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invitation` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`teamId` text,
	`status` text NOT NULL,
	`expiresAt` numeric NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`inviterId` text NOT NULL,
	CONSTRAINT `fk_invitation_organizationId_organization_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_invitation_teamId_team_id_fk` FOREIGN KEY (`teamId`) REFERENCES `team`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_invitation_inviterId_user_id_fk` FOREIGN KEY (`inviterId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_invitation`(`id`, `organizationId`, `email`, `role`, `teamId`, `status`, `expiresAt`, `createdAt`, `inviterId`) SELECT `id`, `organizationId`, `email`, `role`, `teamId`, `status`, `expiresAt`, `createdAt`, `inviterId` FROM `invitation`;--> statement-breakpoint
DROP TABLE `invitation`;--> statement-breakpoint
ALTER TABLE `__new_invitation` RENAME TO `invitation`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_member` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL,
	`departmentId` text,
	`organizationRoleId` text,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	CONSTRAINT `fk_member_organizationId_organization_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_member_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_member_departmentId_departments_id_fk` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `fk_member_organizationRoleId_organizationRole_id_fk` FOREIGN KEY (`organizationRoleId`) REFERENCES `organizationRole`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_member`(`id`, `organizationId`, `userId`, `role`, `departmentId`, `organizationRoleId`, `createdAt`) SELECT `id`, `organizationId`, `userId`, `role`, `departmentId`, `organizationRoleId`, `createdAt` FROM `member`;--> statement-breakpoint
DROP TABLE `member`;--> statement-breakpoint
ALTER TABLE `__new_member` RENAME TO `member`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_nav_item` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`url` text,
	`icon` text,
	`badge` text,
	`orderIndex` integer NOT NULL,
	`isCollapsible` integer DEFAULT false NOT NULL,
	`createdAt` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` text NOT NULL,
	`navGroupId` text,
	`parentId` text,
	CONSTRAINT `fk_nav_item_navGroupId_nav_group_id_fk` FOREIGN KEY (`navGroupId`) REFERENCES `nav_group`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_nav_item_parentId_nav_item_id_fk` FOREIGN KEY (`parentId`) REFERENCES `nav_item`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_nav_item`(`id`, `title`, `url`, `icon`, `badge`, `orderIndex`, `isCollapsible`, `createdAt`, `updatedAt`, `navGroupId`, `parentId`) SELECT `id`, `title`, `url`, `icon`, `badge`, `orderIndex`, `isCollapsible`, `createdAt`, `updatedAt`, `navGroupId`, `parentId` FROM `nav_item`;--> statement-breakpoint
DROP TABLE `nav_item`;--> statement-breakpoint
ALTER TABLE `__new_nav_item` RENAME TO `nav_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_organizationRole` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`role` text NOT NULL,
	`displayName` text,
	`description` text,
	`templateRoleId` text,
	`permission` text,
	`isActive` integer DEFAULT true NOT NULL,
	`metadata` JSONB,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `fk_organizationRole_organizationId_organization_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_organizationRole_templateRoleId_roles_id_fk` FOREIGN KEY (`templateRoleId`) REFERENCES `roles`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_organizationRole`(`id`, `organizationId`, `role`, `displayName`, `description`, `templateRoleId`, `permission`, `isActive`, `metadata`, `createdAt`, `updatedAt`) SELECT `id`, `organizationId`, `role`, `displayName`, `description`, `templateRoleId`, `permission`, `isActive`, `metadata`, `createdAt`, `updatedAt` FROM `organizationRole`;--> statement-breakpoint
DROP TABLE `organizationRole`;--> statement-breakpoint
ALTER TABLE `__new_organizationRole` RENAME TO `organizationRole`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_organization_role_permissions` (
	`id` text PRIMARY KEY,
	`organizationRoleId` text NOT NULL,
	`permissionId` text NOT NULL,
	`dataScope` text DEFAULT 'ORG' NOT NULL,
	`customScope` JSONB,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `fk_organization_role_permissions_organizationRoleId_organizationRole_id_fk` FOREIGN KEY (`organizationRoleId`) REFERENCES `organizationRole`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_organization_role_permissions_permissionId_permissions_id_fk` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_organization_role_permissions`(`id`, `organizationRoleId`, `permissionId`, `dataScope`, `customScope`, `createdAt`, `updatedAt`) SELECT `id`, `organizationRoleId`, `permissionId`, `dataScope`, `customScope`, `createdAt`, `updatedAt` FROM `organization_role_permissions`;--> statement-breakpoint
DROP TABLE `organization_role_permissions`;--> statement-breakpoint
ALTER TABLE `__new_organization_role_permissions` RENAME TO `organization_role_permissions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_permissions` (
	`id` text PRIMARY KEY,
	`resourceId` text NOT NULL,
	`actionId` text NOT NULL,
	`code` text NOT NULL,
	`displayName` text NOT NULL,
	`description` text,
	`category` text,
	`isSystem` integer DEFAULT false NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `fk_permissions_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_permissions_actionId_actions_id_fk` FOREIGN KEY (`actionId`) REFERENCES `actions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_permissions`(`id`, `resourceId`, `actionId`, `code`, `displayName`, `description`, `category`, `isSystem`, `createdAt`, `updatedAt`) SELECT `id`, `resourceId`, `actionId`, `code`, `displayName`, `description`, `category`, `isSystem`, `createdAt`, `updatedAt` FROM `permissions`;--> statement-breakpoint
DROP TABLE `permissions`;--> statement-breakpoint
ALTER TABLE `__new_permissions` RENAME TO `permissions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_qb_category` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`orderIndex` integer DEFAULT 0 NOT NULL,
	`depth` integer DEFAULT 0 NOT NULL,
	`parentId` text,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `fk_qb_category_parentId_qb_category_id_fk` FOREIGN KEY (`parentId`) REFERENCES `qb_category`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_qb_category`(`id`, `name`, `description`, `orderIndex`, `depth`, `parentId`, `createdAt`, `updatedAt`) SELECT `id`, `name`, `description`, `orderIndex`, `depth`, `parentId`, `createdAt`, `updatedAt` FROM `qb_category`;--> statement-breakpoint
DROP TABLE `qb_category`;--> statement-breakpoint
ALTER TABLE `__new_qb_category` RENAME TO `qb_category`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_qb_practice_attempt` (
	`id` text PRIMARY KEY,
	`sessionId` text NOT NULL,
	`questionId` text NOT NULL,
	`userAnswer` JSONB NOT NULL,
	`isCorrect` numeric NOT NULL,
	`durationMs` integer,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	CONSTRAINT `fk_qb_practice_attempt_sessionId_qb_practice_session_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `qb_practice_session`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_qb_practice_attempt_questionId_qb_question_id_fk` FOREIGN KEY (`questionId`) REFERENCES `qb_question`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_qb_practice_attempt`(`id`, `sessionId`, `questionId`, `userAnswer`, `isCorrect`, `durationMs`, `createdAt`) SELECT `id`, `sessionId`, `questionId`, `userAnswer`, `isCorrect`, `durationMs`, `createdAt` FROM `qb_practice_attempt`;--> statement-breakpoint
DROP TABLE `qb_practice_attempt`;--> statement-breakpoint
ALTER TABLE `__new_qb_practice_attempt` RENAME TO `qb_practice_attempt`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_qb_question` (
	`id` text PRIMARY KEY,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`options` JSONB,
	`answer` JSONB NOT NULL,
	`explanation` text,
	`difficulty` integer DEFAULT 1 NOT NULL,
	`categoryId` text,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `fk_qb_question_categoryId_qb_category_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `qb_category`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_qb_question`(`id`, `type`, `content`, `options`, `answer`, `explanation`, `difficulty`, `categoryId`, `createdAt`, `updatedAt`) SELECT `id`, `type`, `content`, `options`, `answer`, `explanation`, `difficulty`, `categoryId`, `createdAt`, `updatedAt` FROM `qb_question`;--> statement-breakpoint
DROP TABLE `qb_question`;--> statement-breakpoint
ALTER TABLE `__new_qb_question` RENAME TO `qb_question`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_qb_question_tag` (
	`questionId` text NOT NULL,
	`tagId` text NOT NULL,
	CONSTRAINT `qb_question_tag_pk` PRIMARY KEY(`questionId`, `tagId`),
	CONSTRAINT `fk_qb_question_tag_questionId_qb_question_id_fk` FOREIGN KEY (`questionId`) REFERENCES `qb_question`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_qb_question_tag_tagId_qb_tag_id_fk` FOREIGN KEY (`tagId`) REFERENCES `qb_tag`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_qb_question_tag`(`questionId`, `tagId`) SELECT `questionId`, `tagId` FROM `qb_question_tag`;--> statement-breakpoint
DROP TABLE `qb_question_tag`;--> statement-breakpoint
ALTER TABLE `__new_qb_question_tag` RENAME TO `qb_question_tag`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_role_nav_group` (
	`id` text PRIMARY KEY,
	`role` text NOT NULL,
	`navGroupId` text NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	CONSTRAINT `fk_role_nav_group_navGroupId_nav_group_id_fk` FOREIGN KEY (`navGroupId`) REFERENCES `nav_group`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_role_nav_group`(`id`, `role`, `navGroupId`, `createdAt`) SELECT `id`, `role`, `navGroupId`, `createdAt` FROM `role_nav_group`;--> statement-breakpoint
DROP TABLE `role_nav_group`;--> statement-breakpoint
ALTER TABLE `__new_role_nav_group` RENAME TO `role_nav_group`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_role_permissions` (
	`id` text PRIMARY KEY,
	`roleId` text NOT NULL,
	`permissionId` text NOT NULL,
	`dataScope` text DEFAULT 'ALL' NOT NULL,
	`customScope` JSONB,
	`validFrom` numeric,
	`validUntil` numeric,
	`timeRanges` JSONB,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `fk_role_permissions_roleId_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_role_permissions_permissionId_permissions_id_fk` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_role_permissions`(`id`, `roleId`, `permissionId`, `dataScope`, `customScope`, `validFrom`, `validUntil`, `timeRanges`, `createdAt`, `updatedAt`) SELECT `id`, `roleId`, `permissionId`, `dataScope`, `customScope`, `validFrom`, `validUntil`, `timeRanges`, `createdAt`, `updatedAt` FROM `role_permissions`;--> statement-breakpoint
DROP TABLE `role_permissions`;--> statement-breakpoint
ALTER TABLE `__new_role_permissions` RENAME TO `role_permissions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY,
	`expiresAt` numeric NOT NULL,
	`token` text NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`impersonatedBy` text,
	`activeOrganizationId` text,
	`activeTeamId` text,
	CONSTRAINT `fk_session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_session`(`id`, `expiresAt`, `token`, `createdAt`, `updatedAt`, `ipAddress`, `userAgent`, `userId`, `impersonatedBy`, `activeOrganizationId`, `activeTeamId`) SELECT `id`, `expiresAt`, `token`, `createdAt`, `updatedAt`, `ipAddress`, `userAgent`, `userId`, `impersonatedBy`, `activeOrganizationId`, `activeTeamId` FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_system_log` (
	`id` text PRIMARY KEY,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`level` text DEFAULT 'info' NOT NULL,
	`requestId` text,
	`method` text NOT NULL,
	`path` text NOT NULL,
	`query` text,
	`status` integer NOT NULL,
	`durationMs` integer NOT NULL,
	`ip` text,
	`userAgent` text,
	`userId` text,
	`userRole` text,
	`error` text,
	`meta` JSONB,
	CONSTRAINT `fk_system_log_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_system_log`(`id`, `createdAt`, `level`, `requestId`, `method`, `path`, `query`, `status`, `durationMs`, `ip`, `userAgent`, `userId`, `userRole`, `error`, `meta`) SELECT `id`, `createdAt`, `level`, `requestId`, `method`, `path`, `query`, `status`, `durationMs`, `ip`, `userAgent`, `userId`, `userRole`, `error`, `meta` FROM `system_log`;--> statement-breakpoint
DROP TABLE `system_log`;--> statement-breakpoint
ALTER TABLE `__new_system_log` RENAME TO `system_log`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_team` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`organizationId` text NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `fk_team_organizationId_organization_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_team`(`id`, `name`, `organizationId`, `createdAt`, `updatedAt`) SELECT `id`, `name`, `organizationId`, `createdAt`, `updatedAt` FROM `team`;--> statement-breakpoint
DROP TABLE `team`;--> statement-breakpoint
ALTER TABLE `__new_team` RENAME TO `team`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_teamMember` (
	`id` text PRIMARY KEY,
	`teamId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	CONSTRAINT `fk_teamMember_teamId_team_id_fk` FOREIGN KEY (`teamId`) REFERENCES `team`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_teamMember_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_teamMember`(`id`, `teamId`, `userId`, `createdAt`) SELECT `id`, `teamId`, `userId`, `createdAt` FROM `teamMember`;--> statement-breakpoint
DROP TABLE `teamMember`;--> statement-breakpoint
ALTER TABLE `__new_teamMember` RENAME TO `teamMember`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_role_nav_group` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`navGroupId` text NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	CONSTRAINT `fk_user_role_nav_group_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_user_role_nav_group_navGroupId_nav_group_id_fk` FOREIGN KEY (`navGroupId`) REFERENCES `nav_group`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_user_role_nav_group`(`id`, `userId`, `navGroupId`, `visible`, `createdAt`) SELECT `id`, `userId`, `navGroupId`, `visible`, `createdAt` FROM `user_role_nav_group`;--> statement-breakpoint
DROP TABLE `user_role_nav_group`;--> statement-breakpoint
ALTER TABLE `__new_user_role_nav_group` RENAME TO `user_role_nav_group`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_qb_tag` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`color` text,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_qb_tag`(`id`, `name`, `color`, `createdAt`, `updatedAt`) SELECT `id`, `name`, `color`, `createdAt`, `updatedAt` FROM `qb_tag`;--> statement-breakpoint
DROP TABLE `qb_tag`;--> statement-breakpoint
ALTER TABLE `__new_qb_tag` RENAME TO `qb_tag`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	`username` text,
	`displayUsername` text,
	`role` text,
	`banned` integer DEFAULT false,
	`banReason` text,
	`banExpires` text
);
--> statement-breakpoint
INSERT INTO `__new_user`(`id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`, `username`, `displayUsername`, `role`, `banned`, `banReason`, `banExpires`) SELECT `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`, `username`, `displayUsername`, `role`, `banned`, `banReason`, `banExpires` FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_translation` (
	`id` text PRIMARY KEY,
	`locale` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_translation`(`id`, `locale`, `key`, `value`, `createdAt`) SELECT `id`, `locale`, `key`, `value`, `createdAt` FROM `translation`;--> statement-breakpoint
DROP TABLE `translation`;--> statement-breakpoint
ALTER TABLE `__new_translation` RENAME TO `translation`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_nav_group` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`scope` text DEFAULT 'APP' NOT NULL,
	`orderIndex` integer NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_nav_group`(`id`, `title`, `scope`, `orderIndex`, `createdAt`, `updatedAt`) SELECT `id`, `title`, `scope`, `orderIndex`, `createdAt`, `updatedAt` FROM `nav_group`;--> statement-breakpoint
DROP TABLE `nav_group`;--> statement-breakpoint
ALTER TABLE `__new_nav_group` RENAME TO `nav_group`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_qb_practice_session` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`startTime` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`endTime` numeric,
	`totalCount` integer DEFAULT 0 NOT NULL,
	`correctCount` integer DEFAULT 0 NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_qb_practice_session`(`id`, `userId`, `type`, `status`, `startTime`, `endTime`, `totalCount`, `correctCount`, `createdAt`, `updatedAt`) SELECT `id`, `userId`, `type`, `status`, `startTime`, `endTime`, `totalCount`, `correctCount`, `createdAt`, `updatedAt` FROM `qb_practice_session`;--> statement-breakpoint
DROP TABLE `qb_practice_session`;--> statement-breakpoint
ALTER TABLE `__new_qb_practice_session` RENAME TO `qb_practice_session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_organization` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`slug` text,
	`logo` text,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL,
	`metadata` text
);
--> statement-breakpoint
INSERT INTO `__new_organization`(`id`, `name`, `slug`, `logo`, `createdAt`, `updatedAt`, `metadata`) SELECT `id`, `name`, `slug`, `logo`, `createdAt`, `updatedAt`, `metadata` FROM `organization`;--> statement-breakpoint
DROP TABLE `organization`;--> statement-breakpoint
ALTER TABLE `__new_organization` RENAME TO `organization`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_verification` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` numeric NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_verification`(`id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt`) SELECT `id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt` FROM `verification`;--> statement-breakpoint
DROP TABLE `verification`;--> statement-breakpoint
ALTER TABLE `__new_verification` RENAME TO `verification`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_roles` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`displayName` text NOT NULL,
	`description` text,
	`scope` text NOT NULL,
	`isSystem` integer DEFAULT false NOT NULL,
	`isTemplate` integer DEFAULT false NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`category` text,
	`metadata` JSONB,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_roles`(`id`, `name`, `displayName`, `description`, `scope`, `isSystem`, `isTemplate`, `isActive`, `sortOrder`, `category`, `metadata`, `createdAt`, `updatedAt`) SELECT `id`, `name`, `displayName`, `description`, `scope`, `isSystem`, `isTemplate`, `isActive`, `sortOrder`, `category`, `metadata`, `createdAt`, `updatedAt` FROM `roles`;--> statement-breakpoint
DROP TABLE `roles`;--> statement-breakpoint
ALTER TABLE `__new_roles` RENAME TO `roles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_resources` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`displayName` text NOT NULL,
	`description` text,
	`scope` text NOT NULL,
	`isSystem` integer DEFAULT false NOT NULL,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_resources`(`id`, `name`, `displayName`, `description`, `scope`, `isSystem`, `createdAt`, `updatedAt`) SELECT `id`, `name`, `displayName`, `description`, `scope`, `isSystem`, `createdAt`, `updatedAt` FROM `resources`;--> statement-breakpoint
DROP TABLE `resources`;--> statement-breakpoint
ALTER TABLE `__new_resources` RENAME TO `resources`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new__prisma_migrations` (
	`id` text PRIMARY KEY,
	`checksum` text NOT NULL,
	`finished_at` numeric,
	`migration_name` text NOT NULL,
	`logs` text,
	`rolled_back_at` numeric,
	`started_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`applied_steps_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new__prisma_migrations`(`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) SELECT `id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count` FROM `_prisma_migrations`;--> statement-breakpoint
DROP TABLE `_prisma_migrations`;--> statement-breakpoint
ALTER TABLE `__new__prisma_migrations` RENAME TO `_prisma_migrations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cross_org_access` (
	`id` text PRIMARY KEY,
	`role` text NOT NULL,
	`sourceOrgId` text NOT NULL,
	`targetOrgId` text NOT NULL,
	`resource` text NOT NULL,
	`accessLevel` text NOT NULL,
	`sourceDeptId` text,
	`targetDeptId` text,
	`validFrom` numeric,
	`validUntil` numeric,
	`createdAt` numeric DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_cross_org_access`(`id`, `role`, `sourceOrgId`, `targetOrgId`, `resource`, `accessLevel`, `sourceDeptId`, `targetDeptId`, `validFrom`, `validUntil`, `createdAt`, `updatedAt`) SELECT `id`, `role`, `sourceOrgId`, `targetOrgId`, `resource`, `accessLevel`, `sourceDeptId`, `targetDeptId`, `validFrom`, `validUntil`, `createdAt`, `updatedAt` FROM `cross_org_access`;--> statement-breakpoint
DROP TABLE `cross_org_access`;--> statement-breakpoint
ALTER TABLE `__new_cross_org_access` RENAME TO `cross_org_access`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `actions_resourceId_name_key` ON `actions` (`resourceId`,`name`);--> statement-breakpoint
CREATE INDEX `actions_isSystem_idx` ON `actions` (`isSystem`);--> statement-breakpoint
CREATE INDEX `actions_resourceId_idx` ON `actions` (`resourceId`);--> statement-breakpoint
CREATE INDEX `audit_log_targetType_targetId_idx` ON `audit_log` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `audit_log_actorUserId_idx` ON `audit_log` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `audit_log_createdAt_idx` ON `audit_log` (`createdAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `departments_organizationId_code_key` ON `departments` (`organizationId`,`code`);--> statement-breakpoint
CREATE INDEX `departments_parentId_idx` ON `departments` (`parentId`);--> statement-breakpoint
CREATE INDEX `departments_organizationId_idx` ON `departments` (`organizationId`);--> statement-breakpoint
CREATE UNIQUE INDEX `field_permissions_permissionId_resource_field_key` ON `field_permissions` (`permissionId`,`resource`,`field`);--> statement-breakpoint
CREATE INDEX `field_permissions_resource_field_idx` ON `field_permissions` (`resource`,`field`);--> statement-breakpoint
CREATE INDEX `member_organizationRoleId_idx` ON `member` (`organizationRoleId`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizationRole_organizationId_role_key` ON `organizationRole` (`organizationId`,`role`);--> statement-breakpoint
CREATE INDEX `organizationRole_templateRoleId_idx` ON `organizationRole` (`templateRoleId`);--> statement-breakpoint
CREATE INDEX `organizationRole_role_idx` ON `organizationRole` (`role`);--> statement-breakpoint
CREATE INDEX `organizationRole_organizationId_idx` ON `organizationRole` (`organizationId`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_role_permissions_organizationRoleId_permissionId_key` ON `organization_role_permissions` (`organizationRoleId`,`permissionId`);--> statement-breakpoint
CREATE INDEX `organization_role_permissions_permissionId_idx` ON `organization_role_permissions` (`permissionId`);--> statement-breakpoint
CREATE INDEX `organization_role_permissions_organizationRoleId_idx` ON `organization_role_permissions` (`organizationRoleId`);--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_resourceId_actionId_key` ON `permissions` (`resourceId`,`actionId`);--> statement-breakpoint
CREATE INDEX `permissions_isSystem_idx` ON `permissions` (`isSystem`);--> statement-breakpoint
CREATE INDEX `permissions_actionId_idx` ON `permissions` (`actionId`);--> statement-breakpoint
CREATE INDEX `permissions_resourceId_idx` ON `permissions` (`resourceId`);--> statement-breakpoint
CREATE INDEX `permissions_code_idx` ON `permissions` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_code_key` ON `permissions` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `role_nav_group_role_navGroupId_key` ON `role_nav_group` (`role`,`navGroupId`);--> statement-breakpoint
CREATE UNIQUE INDEX `role_permissions_roleId_permissionId_key` ON `role_permissions` (`roleId`,`permissionId`);--> statement-breakpoint
CREATE INDEX `role_permissions_permissionId_idx` ON `role_permissions` (`permissionId`);--> statement-breakpoint
CREATE INDEX `role_permissions_roleId_idx` ON `role_permissions` (`roleId`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_key` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE INDEX `system_log_userId_idx` ON `system_log` (`userId`);--> statement-breakpoint
CREATE INDEX `system_log_method_path_idx` ON `system_log` (`method`,`path`);--> statement-breakpoint
CREATE INDEX `system_log_createdAt_idx` ON `system_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `team_organizationId_idx` ON `team` (`organizationId`);--> statement-breakpoint
CREATE INDEX `teamMember_userId_idx` ON `teamMember` (`userId`);--> statement-breakpoint
CREATE INDEX `teamMember_teamId_idx` ON `teamMember` (`teamId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_role_nav_group_userId_navGroupId_key` ON `user_role_nav_group` (`userId`,`navGroupId`);--> statement-breakpoint
CREATE UNIQUE INDEX `qb_tag_name_key` ON `qb_tag` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_key` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_key` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `translation_locale_key_key` ON `translation` (`locale`,`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_key` ON `organization` (`slug`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `roles_sortOrder_idx` ON `roles` (`sortOrder`);--> statement-breakpoint
CREATE INDEX `roles_isActive_idx` ON `roles` (`isActive`);--> statement-breakpoint
CREATE INDEX `roles_isTemplate_idx` ON `roles` (`isTemplate`);--> statement-breakpoint
CREATE INDEX `roles_isSystem_idx` ON `roles` (`isSystem`);--> statement-breakpoint
CREATE INDEX `roles_scope_idx` ON `roles` (`scope`);--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_key` ON `roles` (`name`);--> statement-breakpoint
CREATE INDEX `resources_isSystem_idx` ON `resources` (`isSystem`);--> statement-breakpoint
CREATE INDEX `resources_scope_idx` ON `resources` (`scope`);--> statement-breakpoint
CREATE UNIQUE INDEX `resources_name_key` ON `resources` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `cross_org_access_role_sourceOrgId_targetOrgId_resource_key` ON `cross_org_access` (`role`,`sourceOrgId`,`targetOrgId`,`resource`);--> statement-breakpoint
CREATE INDEX `cross_org_access_role_idx` ON `cross_org_access` (`role`);