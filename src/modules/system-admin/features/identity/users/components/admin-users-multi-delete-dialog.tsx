import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { toast } from 'sonner'
import { bulkDeleteUsersFn } from '../../../../shared/server-fns/user.fn'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { type AdminUser } from '../data/schema'
import { ADMIN_USERS_QUERY_KEY } from '../hooks/use-admin-users-list-query'

type AdminUserMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function AdminUsersMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: Readonly<AdminUserMultiDeleteDialogProps<TData>>) {
  const queryClient = useQueryClient()

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const bulkDeleteMutation = useMutation({
    mutationFn: async (input: { ids: string[] }) => {
      return await bulkDeleteUsersFn({ data: input })
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      const previous = queryClient.getQueriesData({ queryKey: ADMIN_USERS_QUERY_KEY })

      queryClient.setQueriesData({ queryKey: ADMIN_USERS_QUERY_KEY }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old
        const nextItems = old.items.filter((u: AdminUser) => !input.ids.includes(u.id))
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
      await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
    },
  })

  const handleDelete = () => {
    const selectedUsers = selectedRows.map((row) => row.original as AdminUser)
    const ids = selectedUsers.map((u) => u.id)
    if (ids.length === 0) return

    onOpenChange(false)

    const promise = bulkDeleteMutation.mutateAsync({ ids }).then(() => {
      table.resetRowSelection()
    })

    toast.promise(promise, {
      loading: 'Deleting users...',
      success: () => {
        return `Deleted ${selectedRows.length} ${selectedRows.length > 1 ? 'users' : 'user'}`
      },
      error: String,
    })
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      confirmWord='DELETE'
      itemCount={selectedRows.length}
      itemName='user'
      isLoading={bulkDeleteMutation.isPending}
    />
  )
}







