// Organization Module - 按子功能独立导出，避免同名组件冲突
// 请直接从具体子模块导入，例如:
//   import { OrganizationsPage } from './organizations'
//   import { MembersPage } from './members'

export { default as DepartmentsPage } from './departments/departments-page'
export { default as OrganizationsPage } from './organizations/organizations-page'
export { default as MembersPage } from './members/members-page'
export { default as AdminInvitation } from './invitation/invitation-page'

