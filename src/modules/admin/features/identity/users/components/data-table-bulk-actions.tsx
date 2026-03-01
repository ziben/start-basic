import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { Trash2, CircleArrowUp, Download } from 'lucide-react'
import { toast } from 'sonner'
import { bulkBanUsersFn } from '~/modules/admin/features/identity/users/server-fns/user.fn'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type AdminUser } from '../data/schema'
import { adminUsersQueryKeys } from '~/shared/lib/query-keys'
import { useUsersOptimisticUpdate, createBulkBanUpdateFn } from '../hooks/use-users-optimistic-update'
import { AdminUsersMultiDeleteDialog } from './admin-users-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({ table }: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const { getOptimisticMutationOptions } = useUsersOptimisticUpdate()
  const { t } = useTranslation()

  const bulkBanMutation = useMutation({
    mutationFn: async (input: { ids: string[]; banned: boolean }) => {
      return await bulkBanUsersFn({
        data: {
          ids: input.ids,
          banned: input.banned,
          banReason: undefined,
        }
      })
    },
    ...getOptimisticMutationOptions({
      queryKey: adminUsersQueryKeys.all,
      updateFn: (users, variables) => createBulkBanUpdateFn(users, variables.ids, variables.banned),
    }),
  })

  const runBulkBan = async () => {
    const selectedUsers = selectedRows.map((row) => row.original as AdminUser)
    if (selectedUsers.length === 0) return
    const ids = selectedUsers.map((u) => u.id)

    const promise = bulkBanMutation.mutateAsync({ ids, banned: true }).then(() => {
      table.resetRowSelection()
    })

    toast.promise(promise, {
      loading: t('admin.user.bulk.ban.loading'),
      success: () => t('admin.user.bulk.ban.success', { count: selectedUsers.length }),
      error: String,
    })
  }

  const runBulkUnban = async () => {
    const selectedUsers = selectedRows.map((row) => row.original as AdminUser)
    if (selectedUsers.length === 0) return
    const ids = selectedUsers.map((u) => u.id)

    const promise = bulkBanMutation.mutateAsync({ ids, banned: false }).then(() => {
      table.resetRowSelection()
    })

    toast.promise(promise, {
      loading: t('admin.user.bulk.unban.loading'),
      success: () => t('admin.user.bulk.unban.success', { count: selectedUsers.length }),
      error: String,
    })
  }

  const handleBulkExport = () => {
    const selectedUsers = selectedRows.map((row) => row.original as AdminUser)
    toast.promise(Promise.resolve(), {
      loading: t('admin.user.bulk.export.loading'),
      success: () => {
        table.resetRowSelection()
        return t('admin.user.bulk.export.success', { count: selectedUsers.length })
      },
      error: t('admin.common.error'),
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName={t('admin.user.entity')} placement='content'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              aria-label={t('admin.user.bulk.banToggle.label')}
              title={t('admin.user.bulk.banToggle.label')}
            >
              <CircleArrowUp />
              <span className='sr-only'>{t('admin.user.bulk.banToggle.label')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={14}>
            <DropdownMenuItem onClick={() => void runBulkBan()}>
              {t('admin.user.bulk.banSelected')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void runBulkUnban()}>
              {t('admin.user.bulk.unbanSelected')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkExport()}
              className='size-8'
              aria-label={t('admin.user.bulk.export.label')}
              title={t('admin.user.bulk.export.label')}
            >
              <Download />
              <span className='sr-only'>{t('admin.user.bulk.export.label')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('admin.user.bulk.export.label')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label={t('admin.user.bulk.delete.label')}
              title={t('admin.user.bulk.delete.label')}
            >
              <Trash2 />
              <span className='sr-only'>{t('admin.user.bulk.delete.label')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('admin.user.bulk.delete.label')}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <AdminUsersMultiDeleteDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} table={table} />
    </>
  )
}







