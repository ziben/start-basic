-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `_prisma_migrations` (
	`id` text NOT NULL,
	`checksum` text NOT NULL,
	`finished_at` numeric,
	`migration_name` text NOT NULL,
	`logs` text,
	`rolled_back_at` numeric,
	`started_at` numeric DEFAULT current_timestamp NOT NULL,
	`applied_steps_count` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `_prisma_migrations_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nav_item` (
	`id` text NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`icon` text,
	`badge` text,
	`orderIndex` integer NOT NULL,
	`isCollapsible` numeric DEFAULT false NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	`navGroupId` text,
	`parentId` text,
	CONSTRAINT `nav_item_pk` PRIMARY KEY(`id`),
	CONSTRAINT `nav_item_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `nav_item`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `nav_item_navGroupId_fkey` FOREIGN KEY (`navGroupId`) REFERENCES `nav_group`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_role_nav_group` (
	`id` text NOT NULL,
	`userId` text NOT NULL,
	`navGroupId` text NOT NULL,
	`visible` numeric DEFAULT true NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `user_role_nav_group_pk` PRIMARY KEY(`id`),
	CONSTRAINT `user_role_nav_group_navGroupId_fkey` FOREIGN KEY (`navGroupId`) REFERENCES `nav_group`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `user_role_nav_group_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `translation` (
	`id` text NOT NULL,
	`locale` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `translation_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nav_group` (
	`id` text NOT NULL,
	`title` text NOT NULL,
	`scope` text DEFAULT 'APP' NOT NULL,
	`orderIndex` integer NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `nav_group_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_log` (
	`id` text NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
	CONSTRAINT `system_log_pk` PRIMARY KEY(`id`),
	CONSTRAINT `system_log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`actorUserId` text,
	`actorRole` text,
	`action` text NOT NULL,
	`targetType` text NOT NULL,
	`targetId` text,
	`ip` text,
	`userAgent` text,
	`success` numeric DEFAULT true NOT NULL,
	`message` text,
	`meta` JSONB,
	CONSTRAINT `audit_log_pk` PRIMARY KEY(`id`),
	CONSTRAINT `audit_log_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `qb_category` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`orderIndex` integer DEFAULT 0 NOT NULL,
	`depth` integer DEFAULT 0 NOT NULL,
	`parentId` text,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `qb_category_pk` PRIMARY KEY(`id`),
	CONSTRAINT `qb_category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `qb_category`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `qb_tag` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `qb_tag_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qb_question` (
	`id` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`options` JSONB,
	`answer` JSONB NOT NULL,
	`explanation` text,
	`difficulty` integer DEFAULT 1 NOT NULL,
	`categoryId` text,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `qb_question_pk` PRIMARY KEY(`id`),
	CONSTRAINT `qb_question_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `qb_category`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `qb_question_tag` (
	`questionId` text NOT NULL,
	`tagId` text NOT NULL,
	CONSTRAINT `qb_question_tag_pk` PRIMARY KEY(`questionId`, `tagId`),
	CONSTRAINT `qb_question_tag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `qb_tag`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `qb_question_tag_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `qb_question`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `qb_practice_session` (
	`id` text NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`startTime` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`endTime` numeric,
	`totalCount` integer DEFAULT 0 NOT NULL,
	`correctCount` integer DEFAULT 0 NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `qb_practice_session_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qb_practice_attempt` (
	`id` text NOT NULL,
	`sessionId` text NOT NULL,
	`questionId` text NOT NULL,
	`userAnswer` JSONB NOT NULL,
	`isCorrect` numeric NOT NULL,
	`durationMs` integer,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `qb_practice_attempt_pk` PRIMARY KEY(`id`),
	CONSTRAINT `qb_practice_attempt_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `qb_question`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `qb_practice_attempt_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `qb_practice_session`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text NOT NULL,
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
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `departments_pk` PRIMARY KEY(`id`),
	CONSTRAINT `departments_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `departments`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `departments_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `field_permissions` (
	`id` text NOT NULL,
	`permissionId` text NOT NULL,
	`resource` text NOT NULL,
	`field` text NOT NULL,
	`access` text NOT NULL,
	`condition` JSONB,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `field_permissions_pk` PRIMARY KEY(`id`),
	CONSTRAINT `field_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `cross_org_access` (
	`id` text NOT NULL,
	`role` text NOT NULL,
	`sourceOrgId` text NOT NULL,
	`targetOrgId` text NOT NULL,
	`resource` text NOT NULL,
	`accessLevel` text NOT NULL,
	`sourceDeptId` text,
	`targetDeptId` text,
	`validFrom` numeric,
	`validUntil` numeric,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `cross_org_access_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_nav_group` (
	`id` text NOT NULL,
	`role` text NOT NULL,
	`navGroupId` text NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `role_nav_group_pk` PRIMARY KEY(`id`),
	CONSTRAINT `role_nav_group_navGroupId_fkey` FOREIGN KEY (`navGroupId`) REFERENCES `nav_group`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `team` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`organizationId` text NOT NULL,
	`createdAt` numeric NOT NULL,
	`updatedAt` numeric,
	CONSTRAINT `team_pk` PRIMARY KEY(`id`),
	CONSTRAINT `team_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `teamMember` (
	`id` text NOT NULL,
	`teamId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` numeric,
	CONSTRAINT `teamMember_pk` PRIMARY KEY(`id`),
	CONSTRAINT `teamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `teamMember_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `team`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`displayName` text NOT NULL,
	`description` text,
	`scope` text NOT NULL,
	`isSystem` numeric DEFAULT false NOT NULL,
	`isTemplate` numeric DEFAULT false NOT NULL,
	`isActive` numeric DEFAULT true NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`category` text,
	`metadata` JSONB,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `roles_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`displayName` text NOT NULL,
	`description` text,
	`scope` text NOT NULL,
	`isSystem` numeric DEFAULT false NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `resources_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `actions` (
	`id` text NOT NULL,
	`resourceId` text NOT NULL,
	`name` text NOT NULL,
	`displayName` text NOT NULL,
	`description` text,
	`isSystem` numeric DEFAULT false NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `actions_pk` PRIMARY KEY(`id`),
	CONSTRAINT `actions_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text NOT NULL,
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
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `account_pk` PRIMARY KEY(`id`),
	CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text NOT NULL,
	`organizationId` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`teamId` text,
	`status` text NOT NULL,
	`expiresAt` numeric NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`inviterId` text NOT NULL,
	CONSTRAINT `invitation_pk` PRIMARY KEY(`id`),
	CONSTRAINT `invitation_inviterId_fkey` FOREIGN KEY (`inviterId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `invitation_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `team`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `invitation_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`logo` text,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric,
	`metadata` text,
	CONSTRAINT `organization_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text NOT NULL,
	`resourceId` text NOT NULL,
	`actionId` text NOT NULL,
	`code` text NOT NULL,
	`displayName` text NOT NULL,
	`description` text,
	`category` text,
	`isSystem` numeric DEFAULT false NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `permissions_pk` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `actions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `permissions_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` text NOT NULL,
	`roleId` text NOT NULL,
	`permissionId` text NOT NULL,
	`dataScope` text DEFAULT 'ALL' NOT NULL,
	`customScope` JSONB,
	`validFrom` numeric,
	`validUntil` numeric,
	`timeRanges` JSONB,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `role_permissions_pk` PRIMARY KEY(`id`),
	CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text NOT NULL,
	`expiresAt` numeric NOT NULL,
	`token` text NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`impersonatedBy` text,
	`activeOrganizationId` text,
	`activeTeamId` text,
	CONSTRAINT `session_pk` PRIMARY KEY(`id`),
	CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` numeric DEFAULT false NOT NULL,
	`image` text,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	`username` text,
	`displayUsername` text,
	`role` text,
	`banned` numeric DEFAULT false,
	`banReason` text,
	`banExpires` numeric,
	CONSTRAINT `user_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` numeric NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `verification_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_role_permissions` (
	`id` text NOT NULL,
	`organizationRoleId` text NOT NULL,
	`permissionId` text NOT NULL,
	`dataScope` text DEFAULT 'ORG' NOT NULL,
	`customScope` JSONB,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `organization_role_permissions_pk` PRIMARY KEY(`id`),
	CONSTRAINT `organization_role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `organization_role_permissions_organizationRoleId_fkey` FOREIGN KEY (`organizationRoleId`) REFERENCES `organizationRole`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text NOT NULL,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL,
	`departmentId` text,
	`organizationRoleId` text,
	`createdAt` numeric NOT NULL,
	CONSTRAINT `member_pk` PRIMARY KEY(`id`),
	CONSTRAINT `member_organizationRoleId_fkey` FOREIGN KEY (`organizationRoleId`) REFERENCES `organizationRole`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `member_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `member_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `organizationRole` (
	`id` text NOT NULL,
	`organizationId` text NOT NULL,
	`role` text NOT NULL,
	`displayName` text,
	`description` text,
	`templateRoleId` text,
	`permission` text,
	`isActive` numeric DEFAULT true NOT NULL,
	`metadata` JSONB,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric,
	CONSTRAINT `organizationRole_pk` PRIMARY KEY(`id`),
	CONSTRAINT `organizationRole_templateRoleId_fkey` FOREIGN KEY (`templateRoleId`) REFERENCES `roles`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `organizationRole_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `actions_resourceId_name_key` ON `actions` (`resourceId`,`name`);--> statement-breakpoint
CREATE INDEX `actions_isSystem_idx` ON `actions` (`isSystem`);--> statement-breakpoint
CREATE INDEX `actions_resourceId_idx` ON `actions` (`resourceId`);--> statement-breakpoint
CREATE INDEX `audit_log_targetType_targetId_idx` ON `audit_log` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `audit_log_actorUserId_idx` ON `audit_log` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `audit_log_createdAt_idx` ON `audit_log` (`createdAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `cross_org_access_role_sourceOrgId_targetOrgId_resource_key` ON `cross_org_access` (`role`,`sourceOrgId`,`targetOrgId`,`resource`);--> statement-breakpoint
CREATE INDEX `cross_org_access_role_idx` ON `cross_org_access` (`role`);--> statement-breakpoint
CREATE UNIQUE INDEX `departments_organizationId_code_key` ON `departments` (`organizationId`,`code`);--> statement-breakpoint
CREATE INDEX `departments_parentId_idx` ON `departments` (`parentId`);--> statement-breakpoint
CREATE INDEX `departments_organizationId_idx` ON `departments` (`organizationId`);--> statement-breakpoint
CREATE UNIQUE INDEX `field_permissions_permissionId_resource_field_key` ON `field_permissions` (`permissionId`,`resource`,`field`);--> statement-breakpoint
CREATE INDEX `field_permissions_resource_field_idx` ON `field_permissions` (`resource`,`field`);--> statement-breakpoint
CREATE INDEX `member_organizationRoleId_idx` ON `member` (`organizationRoleId`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_key` ON `organization` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_role_permissions_organizationRoleId_permissionId_key` ON `organization_role_permissions` (`organizationRoleId`,`permissionId`);--> statement-breakpoint
CREATE INDEX `organization_role_permissions_permissionId_idx` ON `organization_role_permissions` (`permissionId`);--> statement-breakpoint
CREATE INDEX `organization_role_permissions_organizationRoleId_idx` ON `organization_role_permissions` (`organizationRoleId`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizationRole_organizationId_role_key` ON `organizationRole` (`organizationId`,`role`);--> statement-breakpoint
CREATE INDEX `organizationRole_templateRoleId_idx` ON `organizationRole` (`templateRoleId`);--> statement-breakpoint
CREATE INDEX `organizationRole_role_idx` ON `organizationRole` (`role`);--> statement-breakpoint
CREATE INDEX `organizationRole_organizationId_idx` ON `organizationRole` (`organizationId`);--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_resourceId_actionId_key` ON `permissions` (`resourceId`,`actionId`);--> statement-breakpoint
CREATE INDEX `permissions_isSystem_idx` ON `permissions` (`isSystem`);--> statement-breakpoint
CREATE INDEX `permissions_actionId_idx` ON `permissions` (`actionId`);--> statement-breakpoint
CREATE INDEX `permissions_resourceId_idx` ON `permissions` (`resourceId`);--> statement-breakpoint
CREATE INDEX `permissions_code_idx` ON `permissions` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_code_key` ON `permissions` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `qb_tag_name_key` ON `qb_tag` (`name`);--> statement-breakpoint
CREATE INDEX `resources_isSystem_idx` ON `resources` (`isSystem`);--> statement-breakpoint
CREATE INDEX `resources_scope_idx` ON `resources` (`scope`);--> statement-breakpoint
CREATE UNIQUE INDEX `resources_name_key` ON `resources` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `role_nav_group_role_navGroupId_key` ON `role_nav_group` (`role`,`navGroupId`);--> statement-breakpoint
CREATE UNIQUE INDEX `role_permissions_roleId_permissionId_key` ON `role_permissions` (`roleId`,`permissionId`);--> statement-breakpoint
CREATE INDEX `role_permissions_permissionId_idx` ON `role_permissions` (`permissionId`);--> statement-breakpoint
CREATE INDEX `role_permissions_roleId_idx` ON `role_permissions` (`roleId`);--> statement-breakpoint
CREATE INDEX `roles_sortOrder_idx` ON `roles` (`sortOrder`);--> statement-breakpoint
CREATE INDEX `roles_isActive_idx` ON `roles` (`isActive`);--> statement-breakpoint
CREATE INDEX `roles_isTemplate_idx` ON `roles` (`isTemplate`);--> statement-breakpoint
CREATE INDEX `roles_isSystem_idx` ON `roles` (`isSystem`);--> statement-breakpoint
CREATE INDEX `roles_scope_idx` ON `roles` (`scope`);--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_key` ON `roles` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_key` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE INDEX `system_log_userId_idx` ON `system_log` (`userId`);--> statement-breakpoint
CREATE INDEX `system_log_method_path_idx` ON `system_log` (`method`,`path`);--> statement-breakpoint
CREATE INDEX `system_log_createdAt_idx` ON `system_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `team_organizationId_idx` ON `team` (`organizationId`);--> statement-breakpoint
CREATE INDEX `teamMember_userId_idx` ON `teamMember` (`userId`);--> statement-breakpoint
CREATE INDEX `teamMember_teamId_idx` ON `teamMember` (`teamId`);--> statement-breakpoint
CREATE UNIQUE INDEX `translation_locale_key_key` ON `translation` (`locale`,`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_key` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_key` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_role_nav_group_userId_navGroupId_key` ON `user_role_nav_group` (`userId`,`navGroupId`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);
*/