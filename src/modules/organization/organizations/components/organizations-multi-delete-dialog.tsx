import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { organizationQueryKeys } from '~/shared/lib/query-keys'
import type { RowData } from '~/shared/lib/tanstack-table'
import { type Table } from '~/shared/lib/tanstack-table'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { type Organization } from '../data/schema'
import { bulkDeleteOrganizationsFn } from '../server-fns/organization.fn'

type OrganizationsMultiDeleteDialogProps<TData extends RowData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function OrganizationsMultiDeleteDialog<TData extends RowData>({
  open,
  onOpenChange,
  table,
}: Readonly<OrganizationsMultiDeleteDialogProps<TData>>) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const bulkDeleteMutation = useMutation({
    mutationFn: async (input: { ids: string[] }) => {
      return await bulkDeleteOrganizationsFn({ data: input })
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: organizationQueryKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: organizationQueryKeys.all })

      queryClient.setQueriesData({ queryKey: organizationQueryKeys.all }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old
        const nextItems = old.items.filter((org: Organization) => !input.ids.includes(org.id))
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
      await queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
    },
  })

  const handleDelete = () => {
    const selectedOrgs = selectedRows.map((row) => row.original as Organization)
    const ids = selectedOrgs.map((org) => org.id)
    if (ids.length === 0) return

    onOpenChange(false)

    const promise = bulkDeleteMutation.mutateAsync({ ids }).then(() => {
      table.resetRowSelection()
    })

    toast.promise(promise, {
      loading: t('admin.organization.bulk.delete.loading'),
      success: () => {
        return t('admin.organization.bulk.delete.success', { count: selectedRows.length })
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
      itemName={t('admin.organization.entity')}
      isLoading={bulkDeleteMutation.isPending}
    />
  )
}
