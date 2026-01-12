import { OrgRoleMutateDialog } from './org-role-mutate-dialog'
import { OrgRoleDeleteDialog } from './org-role-delete-dialog'
import { OrgRolePermissionsDialog } from './org-role-permissions-dialog'

export function OrgRolesDialogs() {
  return (
    <>
      <OrgRoleMutateDialog />
      <OrgRoleDeleteDialog />
      <OrgRolePermissionsDialog />
    </>
  )
}
