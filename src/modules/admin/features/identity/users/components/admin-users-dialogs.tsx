import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bulkDeleteUsersFn } from '../../../../shared/server-fns/user.fn'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { adminUsersQueryKeys } from '~/shared/lib/query-keys'
import { useUsersOptimisticUpdate, createBulkDeleteUpdateFn } from '../hooks/use-users-optimistic-update'
import { AdminUserImportDialog } from './admin-users-import-dialog'
import { AdminUsersMutateDialog } from './admin-users-mutate-dialog'
import { useAdminUsers } from './admin-users-provider'

export function AdminUsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useAdminUsers()
  const { getOptimisticMutationOptions } = useUsersOptimisticUpdate()
  const { t } = useTranslation()

  const deleteOneMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await bulkDeleteUsersFn({ data: { ids: [input.id] } })
    },
    ...getOptimisticMutationOptions({
      queryKey: adminUsersQueryKeys.all,
      updateFn: (users, variables) => createBulkDeleteUpdateFn(users, [variables.id]),
    }),
  })

  // Clear currentRow when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentRow(null)
    }
  }, [open, setCurrentRow])

  return (
    <>
      <AdminUsersMutateDialog
        key='user-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      <AdminUserImportDialog
        key='user-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      {currentRow && (
        <>
          <AdminUsersMutateDialog
            key={`user-edit-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => setOpen('update')}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key={`user-delete-${currentRow.id}`}
            destructive
            open={open === 'delete'}
            onOpenChange={() => setOpen('delete')}
            handleConfirm={() => {
              const id = currentRow.id
              setOpen(null)

              const promise = deleteOneMutation.mutateAsync({ id })
              toast.promise(promise, {
                loading: t('admin.user.toast.delete.loading'),
                success: () => t('admin.user.toast.delete.success', { id }),
                error: String,
              })
            }}
            className='max-w-md'
            title={t('admin.user.dialog.delete.title', { id: currentRow.id })}
            desc={
              <>
                {t('admin.user.dialog.delete.desc', { id: currentRow.id })} <br />
                {t('admin.user.dialog.delete.cannotUndo')}
              </>
            }
            confirmText={t('common.buttons.delete')}
            cancelBtnText={t('common.buttons.cancel')}
          />
        </>
      )}
    </>
  )
}






