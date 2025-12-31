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
CREATE TABLE `user` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` numeric NOT NULL,
	`image` text,
	`createdAt` numeric NOT NULL,
	`updatedAt` numeric NOT NULL,
	`role` text,
	`banned` numeric,
	`banReason` text,
	`banExpires` numeric,
	`username` text,
	`displayUsername` text,
	CONSTRAINT `user_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text NOT NULL,
	`expiresAt` numeric NOT NULL,
	`token` text NOT NULL,
	`createdAt` numeric NOT NULL,
	`updatedAt` numeric NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`impersonatedBy` text,
	`activeOrganizationId` text,
	CONSTRAINT `session_pk` PRIMARY KEY(`id`),
	CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
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
	`createdAt` numeric NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `account_pk` PRIMARY KEY(`id`),
	CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` numeric NOT NULL,
	`createdAt` numeric,
	`updatedAt` numeric,
	CONSTRAINT `verification_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`logo` text,
	`createdAt` numeric NOT NULL,
	`metadata` text,
	CONSTRAINT `organization_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text NOT NULL,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL,
	`createdAt` numeric NOT NULL,
	CONSTRAINT `member_pk` PRIMARY KEY(`id`),
	CONSTRAINT `member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `member_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text NOT NULL,
	`organizationId` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text NOT NULL,
	`expiresAt` numeric NOT NULL,
	`inviterId` text NOT NULL,
	CONSTRAINT `invitation_pk` PRIMARY KEY(`id`),
	CONSTRAINT `invitation_inviterId_fkey` FOREIGN KEY (`inviterId`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `invitation_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
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
CREATE TABLE `system_role` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`label` text NOT NULL,
	`description` text,
	`isSystem` numeric DEFAULT false NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` numeric NOT NULL,
	CONSTRAINT `system_role_pk` PRIMARY KEY(`id`)
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
CREATE TABLE `_UserToSystemRole` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	CONSTRAINT `_UserToSystemRole_B_fkey` FOREIGN KEY (`B`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `_UserToSystemRole_A_fkey` FOREIGN KEY (`A`) REFERENCES `system_role`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `role_nav_group` (
	`id` text NOT NULL,
	`roleName` text,
	`roleId` text,
	`navGroupId` text NOT NULL,
	`createdAt` numeric DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `role_nav_group_pk` PRIMARY KEY(`id`),
	CONSTRAINT `role_nav_group_navGroupId_fkey` FOREIGN KEY (`navGroupId`) REFERENCES `nav_group`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `role_nav_group_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `system_role`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `_UserToSystemRole_B_index` ON `_UserToSystemRole` (`B`);--> statement-breakpoint
CREATE UNIQUE INDEX `_UserToSystemRole_AB_unique` ON `_UserToSystemRole` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `audit_log_targetType_targetId_idx` ON `audit_log` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `audit_log_actorUserId_idx` ON `audit_log` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `audit_log_createdAt_idx` ON `audit_log` (`createdAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_key` ON `organization` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `qb_tag_name_key` ON `qb_tag` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `role_nav_group_roleId_navGroupId_key` ON `role_nav_group` (`roleId`,`navGroupId`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_key` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `system_log_userId_idx` ON `system_log` (`userId`);--> statement-breakpoint
CREATE INDEX `system_log_method_path_idx` ON `system_log` (`method`,`path`);--> statement-breakpoint
CREATE INDEX `system_log_createdAt_idx` ON `system_log` (`createdAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `system_role_name_key` ON `system_role` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `translation_locale_key_key` ON `translation` (`locale`,`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_key` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_key` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_role_nav_group_userId_navGroupId_key` ON `user_role_nav_group` (`userId`,`navGroupId`);
*/