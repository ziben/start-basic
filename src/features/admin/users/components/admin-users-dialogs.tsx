import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '~/lib/api-client'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type AdminUsers } from '../data/schema'
import { AdminUserImportDialog } from './admin-users-import-dialog'
import { AdminUsersMutateDrawer } from './admin-users-mutate-drawer'
import { useAdminUsers } from './admin-users-provider'

export function AdminUsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useAdminUsers()
  const queryClient = useQueryClient()

  const deleteOneMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await apiClient.users.bulkDelete({ ids: [input.id] })
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] })
      const previous = queryClient.getQueriesData({ queryKey: ['admin-users'] })

      queryClient.setQueriesData({ queryKey: ['admin-users'] }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old
        const nextItems = old.items.filter((u: AdminUsers) => u.id !== input.id)
        const deleted = old.items.length - nextItems.length

        const total = typeof old.total === 'number' ? Math.max(0, old.total - deleted) : old.total
        const pageSize = typeof old.pageSize === 'number' ? old.pageSize : undefined
        const pageCount =
          typeof total === 'number' && typeof pageSize === 'number' && pageSize > 0
            ? Math.ceil(total / pageSize)
            : old.pageCount

        return {
          ...old,
          items: nextItems,
          total,
          pageCount,
        }
      })

      return { previous }
    },
    onError: (_err, _input, ctx) => {
      for (const [key, data] of ctx?.previous ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  return (
    <>
      <AdminUsersMutateDrawer
        key='task-create'
        open={open === 'create'}
        onOpenChange={(nextOpen) => setOpen(nextOpen ? 'create' : null)}
      />

      <AdminUserImportDialog
        key='tasks-import'
        open={open === 'import'}
        onOpenChange={(nextOpen) => setOpen(nextOpen ? 'import' : null)}
      />

      {currentRow && (
        <>
          <AdminUsersMutateDrawer
            key={`task-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen ? 'update' : null)
              if (!nextOpen) {
                setTimeout(() => {
                  setCurrentRow(null)
                }, 500)
              }
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key='task-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen ? 'delete' : null)
              if (!nextOpen) {
                setTimeout(() => {
                  setCurrentRow(null)
                }, 500)
              }
            }}
            handleConfirm={() => {
              const id = currentRow.id
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)

              const promise = deleteOneMutation.mutateAsync({ id })
              toast.promise(promise, {
                loading: 'Deleting user...',
                success: () => {
                  return `Deleted ${id}`
                },
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
