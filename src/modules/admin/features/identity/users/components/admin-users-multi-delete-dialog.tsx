import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { toast } from 'sonner'
import { bulkDeleteUsersFn } from '../../../../shared/server-fns/user.fn'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { type AdminUser } from '../data/schema'
import { adminUsersQueryKeys } from '~/shared/lib/query-keys'

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
  const { t } = useTranslation()

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const bulkDeleteMutation = useMutation({
    mutationFn: async (input: { ids: string[] }) => {
      return await bulkDeleteUsersFn({ data: input })
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: adminUsersQueryKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: adminUsersQueryKeys.all })

      queryClient.setQueriesData({ queryKey: adminUsersQueryKeys.all }, (old: any) => {
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
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.all })
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
      loading: t('admin.user.bulk.delete.loading'),
      success: () => t('admin.user.bulk.delete.success', { count: selectedRows.length }),
      error: String,
    })
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      title={t('admin.user.bulk.delete.title')}
      description={
        <>
          {t('admin.user.bulk.delete.desc', { count: selectedRows.length })} <br />
          {t('admin.user.dialog.delete.cannotUndo')}
        </>
      }
      confirmText={t('common.buttons.delete')}
      cancelText={t('common.buttons.cancel')}
      confirmWord='DELETE'
      itemCount={selectedRows.length}
      itemName={t('admin.user.entity')}
      isLoading={bulkDeleteMutation.isPending}
    />
  )
}







