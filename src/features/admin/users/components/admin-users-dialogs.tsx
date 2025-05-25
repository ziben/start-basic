import { useAdminUsers } from '../context/admin-users-context'
import { AdminUsersActionDialog } from './admin-users-action-dialog'
import { AdminUsersDeleteDialog } from './admin-users-delete-dialog'

export default function AdminUsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useAdminUsers()
  return (
    <>
      <AdminUsersActionDialog
        key='admin-users-add'
        open={open === 'add'}
        onOpenChange={() => setOpen(null)}
      />
      {currentRow && (
        <>
          <AdminUsersActionDialog
            key={`admin-users-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen(null)
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />
          <AdminUsersDeleteDialog
            key={`admin-users-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen(null)
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
} 