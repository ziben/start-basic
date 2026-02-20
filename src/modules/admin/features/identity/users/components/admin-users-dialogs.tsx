import { useEffect } from 'react'
import { useAdminUsers } from './admin-users-provider'
import { AdminUserImportDialog } from './admin-users-import-dialog'
import { AdminUsersMutateDialog } from './admin-users-mutate-dialog'
import { AdminUsersDeleteDialog } from './admin-users-delete-dialog'

export function AdminUsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useAdminUsers()

  const close = () => setOpen(null)

  // Clear currentRow when dialog fully closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setCurrentRow(null), 150)
      return () => clearTimeout(timer)
    }
  }, [open, setCurrentRow])

  return (
    <>
      {/* 创建 */}
      <AdminUsersMutateDialog
        key='user-create'
        open={open === 'create'}
        onOpenChange={(o) => { if (!o) close() }}
      />

      {/* 导入 */}
      <AdminUserImportDialog
        key='user-import'
        open={open === 'import'}
        onOpenChange={(o) => { if (!o) close() }}
      />

      {/* 编辑 */}
      {currentRow && (
        <AdminUsersMutateDialog
          key={`user-edit-${currentRow.id}`}
          open={open === 'update'}
          onOpenChange={(o) => { if (!o) close() }}
          currentRow={currentRow}
        />
      )}

      {/* 删除 */}
      <AdminUsersDeleteDialog
        row={currentRow}
        open={open === 'delete'}
        onClose={close}
      />
    </>
  )
}






