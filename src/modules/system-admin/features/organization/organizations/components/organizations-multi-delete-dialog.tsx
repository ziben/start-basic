import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { toast } from 'sonner'
import { bulkDeleteOrganizationsFn } from '../../../../shared/server-fns/organization.fn'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { type Organization } from '../data/schema'
import { ORGANIZATIONS_QUERY_KEY } from '../hooks/use-organizations-list-query'

type OrganizationsMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function OrganizationsMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: Readonly<OrganizationsMultiDeleteDialogProps<TData>>) {
  const queryClient = useQueryClient()

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const bulkDeleteMutation = useMutation({
    mutationFn: async (input: { ids: string[] }) => {
      return await bulkDeleteOrganizationsFn({ data: input })
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ORGANIZATIONS_QUERY_KEY })
      const previous = queryClient.getQueriesData({ queryKey: ORGANIZATIONS_QUERY_KEY })

      queryClient.setQueriesData({ queryKey: ORGANIZATIONS_QUERY_KEY }, (old: any) => {
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
      await queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY })
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
      loading: '删除中...',
      success: () => {
        return `已删除 ${selectedRows.length} 个组织`
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
      itemName='组织'
      isLoading={bulkDeleteMutation.isPending}
    />
  )
}
