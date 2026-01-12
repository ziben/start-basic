import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	navItem: {
		navGroups: r.many.navGroup({
			from: r.navItem.id.through(r.navItem.parentId),
			to: r.navGroup.id.through(r.navItem.navGroupId)
		}),
	},
	navGroup: {
		navItems: r.many.navItem(),
		users: r.many.user({
			from: r.navGroup.id.through(r.userRoleNavGroup.navGroupId),
			to: r.user.id.through(r.userRoleNavGroup.userId)
		}),
		roleNavGroups: r.many.roleNavGroup(),
	},
	user: {
		navGroups: r.many.navGroup(),
		systemLogs: r.many.systemLog(),
		auditLogs: r.many.auditLog(),
		teams: r.many.team({
			from: r.user.id.through(r.teamMember.userId),
			to: r.team.id.through(r.teamMember.teamId)
		}),
		accounts: r.many.account(),
		invitations: r.many.invitation(),
		sessions: r.many.session(),
		members: r.many.member(),
	},
	systemLog: {
		user: r.one.user({
			from: r.systemLog.userId,
			to: r.user.id
		}),
	},
	auditLog: {
		user: r.one.user({
			from: r.auditLog.actorUserId,
			to: r.user.id
		}),
	},
	qbCategory: {
		qbCategory: r.one.qbCategory({
			from: r.qbCategory.parentId,
			to: r.qbCategory.id,
			alias: "qbCategory_parentId_qbCategory_id"
		}),
		qbCategories: r.many.qbCategory({
			alias: "qbCategory_parentId_qbCategory_id"
		}),
		qbQuestions: r.many.qbQuestion(),
	},
	qbQuestion: {
		qbCategory: r.one.qbCategory({
			from: r.qbQuestion.categoryId,
			to: r.qbCategory.id
		}),
		qbTags: r.many.qbTag(),
		qbPracticeSessions: r.many.qbPracticeSession({
			from: r.qbQuestion.id.through(r.qbPracticeAttempt.questionId),
			to: r.qbPracticeSession.id.through(r.qbPracticeAttempt.sessionId)
		}),
	},
	qbTag: {
		qbQuestions: r.many.qbQuestion({
			from: r.qbTag.id.through(r.qbQuestionTag.tagId),
			to: r.qbQuestion.id.through(r.qbQuestionTag.questionId)
		}),
	},
	qbPracticeSession: {
		qbQuestions: r.many.qbQuestion(),
	},
	departments: {
		organizations: r.many.organization({
			from: r.departments.id.through(r.departments.parentId),
			to: r.organization.id.through(r.departments.organizationId)
		}),
		members: r.many.member(),
	},
	organization: {
		departments: r.many.departments(),
		teams: r.many.team(),
		invitations: r.many.invitation(),
		members: r.many.member(),
		roles: r.many.roles(),
	},
	fieldPermissions: {
		permission: r.one.permissions({
			from: r.fieldPermissions.permissionId,
			to: r.permissions.id
		}),
	},
	permissions: {
		fieldPermissions: r.many.fieldPermissions(),
		roles: r.many.roles({
			from: r.permissions.id.through(r.rolePermissions.permissionId),
			to: r.roles.id.through(r.rolePermissions.roleId)
		}),
		organizationRoles: r.many.organizationRole({
			from: r.permissions.id.through(r.organizationRolePermissions.permissionId),
			to: r.organizationRole.id.through(r.organizationRolePermissions.organizationRoleId)
		}),
	},
	roleNavGroup: {
		navGroup: r.one.navGroup({
			from: r.roleNavGroup.navGroupId,
			to: r.navGroup.id
		}),
	},
	team: {
		organization: r.one.organization({
			from: r.team.organizationId,
			to: r.organization.id
		}),
		users: r.many.user(),
		invitations: r.many.invitation(),
	},
	actions: {
		resource: r.one.resources({
			from: r.actions.resourceId,
			to: r.resources.id,
			alias: "actions_resourceId_resources_id"
		}),
		resources: r.many.resources({
			from: r.actions.id.through(r.permissions.actionId),
			to: r.resources.id.through(r.permissions.resourceId),
			alias: "actions_id_resources_id_via_permissions"
		}),
	},
	resources: {
		actionsResourceId: r.many.actions({
			alias: "actions_resourceId_resources_id"
		}),
		actionsViaPermissions: r.many.actions({
			alias: "actions_id_resources_id_via_permissions"
		}),
	},
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id
		}),
	},
	invitation: {
		user: r.one.user({
			from: r.invitation.inviterId,
			to: r.user.id
		}),
		team: r.one.team({
			from: r.invitation.teamId,
			to: r.team.id
		}),
		organization: r.one.organization({
			from: r.invitation.organizationId,
			to: r.organization.id
		}),
	},
	roles: {
		permissions: r.many.permissions(),
		organizations: r.many.organization({
			from: r.roles.id.through(r.organizationRole.templateRoleId),
			to: r.organization.id.through(r.organizationRole.organizationId)
		}),
	},
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id
		}),
	},
	organizationRole: {
		permissions: r.many.permissions(),
		members: r.many.member(),
	},
	member: {
		organizationRole: r.one.organizationRole({
			from: r.member.organizationRoleId,
			to: r.organizationRole.id
		}),
		department: r.one.departments({
			from: r.member.departmentId,
			to: r.departments.id
		}),
		user: r.one.user({
			from: r.member.userId,
			to: r.user.id
		}),
		organization: r.one.organization({
			from: r.member.organizationId,
			to: r.organization.id
		}),
	},
}))