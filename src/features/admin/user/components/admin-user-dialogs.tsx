import { useAdminUser } from '../context/admin-user-context'
import { AdminUserActionDialog } from './admin-user-action-dialog'
import { AdminUserDeleteDialog } from './admin-user-delete-dialog'

export default function AdminUserDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useAdminUser()
  return (
    <>
      <AdminUserActionDialog
        key='admin-user-add'
        open={open === 'add'}
        onOpenChange={() => setOpen(null)}
      />
      {currentRow && (
        <>
          <AdminUserActionDialog
            key={`admin-user-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen(null)
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />
          <AdminUserDeleteDialog
            key={`admin-user-delete-${currentRow.id}`}
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