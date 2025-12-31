import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id
		}),
	},
	user: {
		sessions: r.many.session(),
		accounts: r.many.account(),
		organizationsViaMember: r.many.organization({
			from: r.user.id.through(r.member.userId),
			to: r.organization.id.through(r.member.organizationId),
			alias: "user_id_organization_id_via_member"
		}),
		organizationsViaInvitation: r.many.organization({
			from: r.user.id.through(r.invitation.inviterId),
			to: r.organization.id.through(r.invitation.organizationId),
			alias: "user_id_organization_id_via_invitation"
		}),
		navGroups: r.many.navGroup(),
		systemLogs: r.many.systemLog(),
		auditLogs: r.many.auditLog(),
		systemRoles: r.many.systemRole({
			from: r.user.id.through(r.userToSystemRole.b),
			to: r.systemRole.id.through(r.userToSystemRole.a)
		}),
	},
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id
		}),
	},
	organization: {
		usersViaMember: r.many.user({
			alias: "user_id_organization_id_via_member"
		}),
		usersViaInvitation: r.many.user({
			alias: "user_id_organization_id_via_invitation"
		}),
	},
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
		systemRoles: r.many.systemRole({
			from: r.navGroup.id.through(r.roleNavGroup.navGroupId),
			to: r.systemRole.id.through(r.roleNavGroup.roleId)
		}),
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
	systemRole: {
		users: r.many.user(),
		navGroups: r.many.navGroup(),
	},
}))