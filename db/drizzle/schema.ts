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

export const departments = sqliteTable("departments", {
	id: text().primaryKey(),
	name: text().notNull(),
	code: text().notNull(),
	organizationId: text().notNull().references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	parentId: text().references((): AnySQLiteColumn => departments.id, { onDelete: "set null", onUpdate: "cascade" } ),
	level: integer().default(1).notNull(),
	sort: integer().default(0).notNull(),
	leader: text(),
	phone: text(),
	email: text(),
	status: text().default("ACTIVE").notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [uniqueIndex("departments_organizationId_code_key").on(table.organizationId, table.code),
index("departments_parentId_idx").on(table.parentId),
index("departments_organizationId_idx").on(table.organizationId),
]);

export const fieldPermissions = sqliteTable("field_permissions", {
	id: text().primaryKey(),
	permissionId: text().notNull().references(() => permissions.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	resource: text().notNull(),
	field: text().notNull(),
	access: text().notNull(),
	condition: customType({ dataType: () => 'JSONB' })(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [uniqueIndex("field_permissions_permissionId_resource_field_key").on(table.permissionId, table.resource, table.field),
index("field_permissions_resource_field_idx").on(table.resource, table.field),
]);

export const crossOrgAccess = sqliteTable("cross_org_access", {
	id: text().primaryKey(),
	role: text().notNull(),
	sourceOrgId: text().notNull(),
	targetOrgId: text().notNull(),
	resource: text().notNull(),
	accessLevel: text().notNull(),
	sourceDeptId: text(),
	targetDeptId: text(),
	validFrom: numeric(),
	validUntil: numeric(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [uniqueIndex("cross_org_access_role_sourceOrgId_targetOrgId_resource_key").on(table.role, table.sourceOrgId, table.targetOrgId, table.resource),
index("cross_org_access_role_idx").on(table.role),
]);

export const roleNavGroup = sqliteTable("role_nav_group", {
	id: text().primaryKey(),
	role: text().notNull(),
	navGroupId: text().notNull().references(() => navGroup.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
},
(table) => [uniqueIndex("role_nav_group_role_navGroupId_key").on(table.role, table.navGroupId),
]);

export const team = sqliteTable("team", {
	id: text().primaryKey(),
	name: text().notNull(),
	organizationId: text().notNull().references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	createdAt: numeric().notNull(),
	updatedAt: numeric(),
},
(table) => [index("team_organizationId_idx").on(table.organizationId),
]);

export const teamMember = sqliteTable("teamMember", {
	id: text().primaryKey(),
	teamId: text().notNull().references(() => team.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	userId: text().notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	createdAt: numeric(),
},
(table) => [index("teamMember_userId_idx").on(table.userId),
index("teamMember_teamId_idx").on(table.teamId),
]);

export const roles = sqliteTable("roles", {
	id: text().primaryKey(),
	name: text().notNull(),
	displayName: text().notNull(),
	description: text(),
	scope: text().notNull(),
	isSystem: numeric().default(false).notNull(),
	isTemplate: numeric().default(false).notNull(),
	isActive: numeric().default(true).notNull(),
	sortOrder: integer().default(0).notNull(),
	category: text(),
	metadata: customType({ dataType: () => 'JSONB' })(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [index("roles_sortOrder_idx").on(table.sortOrder),
index("roles_isActive_idx").on(table.isActive),
index("roles_isTemplate_idx").on(table.isTemplate),
index("roles_isSystem_idx").on(table.isSystem),
index("roles_scope_idx").on(table.scope),
uniqueIndex("roles_name_key").on(table.name),
]);

export const resources = sqliteTable("resources", {
	id: text().primaryKey(),
	name: text().notNull(),
	displayName: text().notNull(),
	description: text(),
	scope: text().notNull(),
	isSystem: numeric().default(false).notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [index("resources_isSystem_idx").on(table.isSystem),
index("resources_scope_idx").on(table.scope),
uniqueIndex("resources_name_key").on(table.name),
]);

export const actions = sqliteTable("actions", {
	id: text().primaryKey(),
	resourceId: text().notNull().references(() => resources.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	name: text().notNull(),
	displayName: text().notNull(),
	description: text(),
	isSystem: numeric().default(false).notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [uniqueIndex("actions_resourceId_name_key").on(table.resourceId, table.name),
index("actions_isSystem_idx").on(table.isSystem),
index("actions_resourceId_idx").on(table.resourceId),
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
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [index("account_userId_idx").on(table.userId),
]);

export const invitation = sqliteTable("invitation", {
	id: text().primaryKey(),
	organizationId: text().notNull().references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	email: text().notNull(),
	role: text(),
	teamId: text().references(() => team.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	status: text().notNull(),
	expiresAt: numeric().notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	inviterId: text().notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
});

export const organization = sqliteTable("organization", {
	id: text().primaryKey(),
	name: text().notNull(),
	slug: text(),
	logo: text(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric(),
	metadata: text(),
},
(table) => [uniqueIndex("organization_slug_key").on(table.slug),
]);

export const permissions = sqliteTable("permissions", {
	id: text().primaryKey(),
	resourceId: text().notNull().references(() => resources.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	actionId: text().notNull().references(() => actions.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	code: text().notNull(),
	displayName: text().notNull(),
	description: text(),
	category: text(),
	isSystem: numeric().default(false).notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [uniqueIndex("permissions_resourceId_actionId_key").on(table.resourceId, table.actionId),
index("permissions_isSystem_idx").on(table.isSystem),
index("permissions_actionId_idx").on(table.actionId),
index("permissions_resourceId_idx").on(table.resourceId),
index("permissions_code_idx").on(table.code),
uniqueIndex("permissions_code_key").on(table.code),
]);

export const rolePermissions = sqliteTable("role_permissions", {
	id: text().primaryKey(),
	roleId: text().notNull().references(() => roles.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	permissionId: text().notNull().references(() => permissions.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	dataScope: text().default("ALL").notNull(),
	customScope: customType({ dataType: () => 'JSONB' })(),
	validFrom: numeric(),
	validUntil: numeric(),
	timeRanges: customType({ dataType: () => 'JSONB' })(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [uniqueIndex("role_permissions_roleId_permissionId_key").on(table.roleId, table.permissionId),
index("role_permissions_permissionId_idx").on(table.permissionId),
index("role_permissions_roleId_idx").on(table.roleId),
]);

export const session = sqliteTable("session", {
	id: text().primaryKey(),
	expiresAt: numeric().notNull(),
	token: text().notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	impersonatedBy: text(),
	activeOrganizationId: text(),
	activeTeamId: text(),
},
(table) => [uniqueIndex("session_token_key").on(table.token),
index("session_userId_idx").on(table.userId),
]);

export const user = sqliteTable("user", {
	id: text().primaryKey(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: numeric().default(false).notNull(),
	image: text(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
	username: text(),
	displayUsername: text(),
	role: text(),
	banned: numeric().default(false),
	banReason: text(),
	banExpires: numeric(),
},
(table) => [uniqueIndex("user_username_key").on(table.username),
uniqueIndex("user_email_key").on(table.email),
]);

export const verification = sqliteTable("verification", {
	id: text().primaryKey(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: numeric().notNull(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [index("verification_identifier_idx").on(table.identifier),
]);

export const organizationRolePermissions = sqliteTable("organization_role_permissions", {
	id: text().primaryKey(),
	organizationRoleId: text().notNull().references(() => organizationRole.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	permissionId: text().notNull().references(() => permissions.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	dataScope: text().default("ORG").notNull(),
	customScope: customType({ dataType: () => 'JSONB' })(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [uniqueIndex("organization_role_permissions_organizationRoleId_permissionId_key").on(table.organizationRoleId, table.permissionId),
index("organization_role_permissions_permissionId_idx").on(table.permissionId),
index("organization_role_permissions_organizationRoleId_idx").on(table.organizationRoleId),
]);

export const member = sqliteTable("member", {
	id: text().primaryKey(),
	organizationId: text().notNull().references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	userId: text().notNull().references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	role: text().notNull(),
	departmentId: text().references(() => departments.id, { onDelete: "set null", onUpdate: "cascade" } ),
	organizationRoleId: text().references(() => organizationRole.id, { onDelete: "set null", onUpdate: "cascade" } ),
	createdAt: numeric().notNull(),
},
(table) => [index("member_organizationRoleId_idx").on(table.organizationRoleId),
]);

export const organizationRole = sqliteTable("organizationRole", {
	id: text().primaryKey(),
	organizationId: text().notNull().references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	role: text().notNull(),
	displayName: text(),
	description: text(),
	templateRoleId: text().references(() => roles.id, { onDelete: "set null", onUpdate: "cascade" } ),
	permission: text(),
	isActive: numeric().default(true).notNull(),
	metadata: customType({ dataType: () => 'JSONB' })(),
	createdAt: numeric().default(CURRENT_TIMESTAMP).notNull(),
	updatedAt: numeric(),
},
(table) => [uniqueIndex("organizationRole_organizationId_role_key").on(table.organizationId, table.role),
index("organizationRole_templateRoleId_idx").on(table.templateRoleId),
index("organizationRole_role_idx").on(table.role),
index("organizationRole_organizationId_idx").on(table.organizationId),
]);

