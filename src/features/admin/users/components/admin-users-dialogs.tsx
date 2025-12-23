import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '~/lib/api-client'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type AdminUsers } from '../data/schema'
import { useUsersOptimisticUpdate, createBulkDeleteUpdateFn } from '../hooks/use-users-optimistic-update'
import { AdminUserImportDialog } from './admin-users-import-dialog'
import { AdminUsersMutateDialog } from './admin-users-mutate-dialog'
import { useAdminUsers } from './admin-users-provider'

export function AdminUsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useAdminUsers()
  const { getOptimisticMutationOptions } = useUsersOptimisticUpdate<{ id: string }>()

  const deleteOneMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await apiClient.users.bulkDelete({ ids: [input.id] })
    },
    ...getOptimisticMutationOptions({
      queryKey: ['admin-users'],
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
                loading: 'Deleting user...',
                success: () => `Deleted ${id}`,
                error: String,
              })
            }}
            className='max-w-md'
            title={`Delete this user: ${currentRow.id} ?`}
            desc={
              <>
                You are about to delete a user with the ID <strong>{currentRow.id}</strong>. <br />
                This action cannot be undone.
              </>
            }
            confirmText='Delete'
          />
        </>
      )}
    </>
  )
}
