import { AdminRolesMutateDialog } from './admin-roles-mutate-dialog'
import { AdminRolesDeleteDialog } from './admin-roles-delete-dialog'
import { AdminRolesAssignDialog } from './admin-roles-assign-dialog'

export function AdminRolesDialogs() {
    return (
        <>
            <AdminRolesMutateDialog />
            <AdminRolesDeleteDialog />
            <AdminRolesAssignDialog />
        </>
    )
}
