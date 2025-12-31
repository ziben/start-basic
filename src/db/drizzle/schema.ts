import { sqliteTable, foreignKey, type AnySQLiteColumn, primaryKey, index, uniqueIndex, text, numeric, integer, customType } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const prismaMigrations = sqliteTable("_prisma_migrations", {
	id: text().primaryKey(),
	checksum: text().notNull(),
	finishedAt: numeric("finished_at"),
	migrationName: text("migration_name").notNull(),
	logs: text(),
	rolledBackAt: numeric("rolled_back_at"),
	startedAt: numeric("started_at").default(current_timestamp).notNull(),
	appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const user = sqliteTable("user", {
	id: text().primaryKey(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: numeric().notNull(),
	image: text(),
	createdAt: numeric().notNull(),
	updatedAt: numeric().notNull(),
	role: text(),
	banned: numeric(),
	banReason: text(),
	banExpires: numeric(),
	username: text(),
	displayUsername: text(),
},
(table) => [uniqueIndex("user_username_key").on(table.username),
uniqueIndex("user_email_key").on(table.email),
]);

export const session = sqliteTable("session", {
	id: text().primaryKey(),
	expiresAt: numeric().notNull(),
	token: text().notNull(),
	createdAt: numeric().notNull(),
	updatedAt: numeric().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	impersonatedBy: text(),
	activeOrganizationId: text(),
},
(table) => [uniqueIndex("session_token_key").on(table.token),
]);

export const account = sqliteTable("account", {
	id: text().primaryKey(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: numeric(),
	refreshTokenExpiresAt: numeric(),
	scope: text(),
	password: text(),
	createdAt: numeric().notNull(),
	updatedAt: numeric().notNull(),
});

export const verification = sqliteTable("verification", {
	id: text().primaryKey(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: numeric().notNull(),
	createdAt: numeric(),
	updatedAt: numeric(),
});

export const organization = sqliteTable("organization", {
	id: text().primaryKey(),
	name: text().notNull(),
	slug: text(),
	logo: text(),
	createdAt: numeric().notNull(),
	metadata: text(),
},
(table) => [uniqueIndex("organization_slug_key").on(table.slug),
]);

export const member = sqliteTable("member", {
	id: text().primaryKey(),
	organizationId: text().notNull().references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	userId: text().notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	role: text().notNull(),
	createdAt: numeric().notNull(),
});

export const invitation = sqliteTable("invitation", {
	id: text().primaryKey(),
	organizationId: text().notNull().references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	email: text().notNull(),
	role: text(),
	status: text().notNull(),
	expiresAt: numeric().notNull(),
	inviterId: text().notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
});

export const navItem = sqliteTable("nav_item", {
	id: text().primaryKey(),
	title: text().notNull(),
	url: text(),
	icon: text(),
	badge: text(),
	orderIndex: integer().notNull(),
	isCollapsible: numeric().default(false).notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
	navGroupId: text().references(() => navGroup.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	parentId: text().references((): AnySQLiteColumn => navItem.id, { onDelete: "cascade", onUpdate: "cascade" } ),
});

export const userRoleNavGroup = sqliteTable("user_role_nav_group", {
	id: text().primaryKey(),
	userId: text().notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	navGroupId: text().notNull().references(() => navGroup.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	visible: numeric().default(true).notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
},
(table) => [uniqueIndex("user_role_nav_group_userId_navGroupId_key").on(table.userId, table.navGroupId),
]);

export const translation = sqliteTable("translation", {
	id: text().primaryKey(),
	locale: text().notNull(),
	key: text().notNull(),
	value: text().notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
},
(table) => [uniqueIndex("translation_locale_key_key").on(table.locale, table.key),
]);

export const navGroup = sqliteTable("nav_group", {
	id: text().primaryKey(),
	title: text().notNull(),
	scope: text().default("APP").notNull(),
	orderIndex: integer().notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
});

export const systemLog = sqliteTable("system_log", {
	id: text().primaryKey(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	level: text().default("info").notNull(),
	requestId: text(),
	method: text().notNull(),
	path: text().notNull(),
	query: text(),
	status: integer().notNull(),
	durationMs: integer().notNull(),
	ip: text(),
	userAgent: text(),
	userId: text().references(() => user.id, { onDelete: "set null", onUpdate: "cascade" } ),
	userRole: text(),
	error: text(),
	meta: customType({ dataType: () => 'JSONB' })(),
},
(table) => [index("system_log_userId_idx").on(table.userId),
index("system_log_method_path_idx").on(table.method, table.path),
index("system_log_createdAt_idx").on(table.createdAt),
]);

export const auditLog = sqliteTable("audit_log", {
	id: text().primaryKey(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	actorUserId: text().references(() => user.id, { onDelete: "set null", onUpdate: "cascade" } ),
	actorRole: text(),
	action: text().notNull(),
	targetType: text().notNull(),
	targetId: text(),
	ip: text(),
	userAgent: text(),
	success: numeric().default(true).notNull(),
	message: text(),
	meta: customType({ dataType: () => 'JSONB' })(),
},
(table) => [index("audit_log_targetType_targetId_idx").on(table.targetType, table.targetId),
index("audit_log_actorUserId_idx").on(table.actorUserId),
index("audit_log_createdAt_idx").on(table.createdAt),
]);

export const systemRole = sqliteTable("system_role", {
	id: text().primaryKey(),
	name: text().notNull(),
	label: text().notNull(),
	description: text(),
	isSystem: numeric().default(false).notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [uniqueIndex("system_role_name_key").on(table.name),
]);

export const qbCategory = sqliteTable("qb_category", {
	id: text().primaryKey(),
	name: text().notNull(),
	description: text(),
	orderIndex: integer().default(0).notNull(),
	depth: integer().default(0).notNull(),
	parentId: text().references((): AnySQLiteColumn => qbCategory.id, { onDelete: "set null", onUpdate: "cascade" } ),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
});

export const qbTag = sqliteTable("qb_tag", {
	id: text().primaryKey(),
	name: text().notNull(),
	color: text(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [uniqueIndex("qb_tag_name_key").on(table.name),
]);

export const qbQuestion = sqliteTable("qb_question", {
	id: text().primaryKey(),
	type: text().notNull(),
	content: text().notNull(),
	options: customType({ dataType: () => 'JSONB' })(),
	answer: customType({ dataType: () => 'JSONB' })().notNull(),
	explanation: text(),
	difficulty: integer().default(1).notNull(),
	categoryId: text().references(() => qbCategory.id, { onDelete: "set null", onUpdate: "cascade" } ),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
});

export const qbQuestionTag = sqliteTable("qb_question_tag", {
	questionId: text().notNull().references(() => qbQuestion.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	tagId: text().notNull().references(() => qbTag.id, { onDelete: "cascade", onUpdate: "cascade" } ),
},
(table) => [primaryKey({ columns: [table.questionId, table.tagId], name: "qb_question_tag_pk"}),
]);

export const qbPracticeSession = sqliteTable("qb_practice_session", {
	id: text().primaryKey(),
	userId: text().notNull(),
	type: text().notNull(),
	status: text().default("active").notNull(),
	startTime: numeric().default(CURRENT_TIMESTAMP).notNull(),
	endTime: numeric(),
	totalCount: integer().default(0).notNull(),
	correctCount: integer().default(0).notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
});

export const qbPracticeAttempt = sqliteTable("qb_practice_attempt", {
	id: text().primaryKey(),
	sessionId: text().notNull().references(() => qbPracticeSession.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	questionId: text().notNull().references(() => qbQuestion.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	userAnswer: customType({ dataType: () => 'JSONB' })().notNull(),
	isCorrect: numeric().notNull(),
	durationMs: integer(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
});

export const userToSystemRole = sqliteTable("_UserToSystemRole", {
	a: text("A").notNull().references(() => systemRole.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	b: text("B").notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
},
(table) => [index().on(table.b),
uniqueIndex("_UserToSystemRole_AB_unique").on(table.a, table.b),
]);

export const roleNavGroup = sqliteTable("role_nav_group", {
	id: text().primaryKey(),
	roleName: text(),
	roleId: text().references(() => systemRole.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	navGroupId: text().notNull().references(() => navGroup.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
},
(table) => [uniqueIndex("role_nav_group_roleId_navGroupId_key").on(table.roleId, table.navGroupId),
]);

