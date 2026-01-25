import { RoleMutateDialog } from './role-mutate-dialog'
import { RoleDeleteDialog } from './role-delete-dialog'
import { RolePermissionsDialog } from './role-permissions-dialog'

export function RolesDialogs() {
  return (
    <>
      <RoleMutateDialog />
      <RoleDeleteDialog />
      <RolePermissionsDialog />
    </>
  )
}
