import { ResourceMutateDialog } from './resource-mutate-dialog'
import { ActionMutateDialog } from './action-mutate-dialog'
import { PermissionMutateDialog } from './permission-mutate-dialog'

export function PermissionsDialogs() {
  return (
    <>
      <ResourceMutateDialog />
      <ActionMutateDialog />
      <PermissionMutateDialog />
    </>
  )
}
