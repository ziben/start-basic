import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { Trash2, CircleArrowUp, Download } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '~/lib/api-client'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type AdminUsers } from '../data/schema'
import { useUsersOptimisticUpdate, createBulkBanUpdateFn } from '../hooks/use-users-optimistic-update'
import { AdminUsersMultiDeleteDialog } from './admin-users-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({ table }: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const { getOptimisticMutationOptions } = useUsersOptimisticUpdate<{ ids: string[]; banned: boolean }>()

  const bulkBanMutation = useMutation({
    mutationFn: async (input: { ids: string[]; banned: boolean }) => {
      return await apiClient.users.bulkBan({
        ids: input.ids,
        banned: input.banned,
        banReason: null,
        banExpires: null,
      })
    },
    ...getOptimisticMutationOptions({
      queryKey: ['admin-users'],
      updateFn: (users, variables) => createBulkBanUpdateFn(users, variables.ids, variables.banned),
    }),
  })

  const runBulkBan = async () => {
    const selectedUsers = selectedRows.map((row) => row.original as AdminUsers)
    if (selectedUsers.length === 0) return
    const ids = selectedUsers.map((u) => u.id)

    const promise = bulkBanMutation.mutateAsync({ ids, banned: true }).then(() => {
      table.resetRowSelection()
    })

    toast.promise(promise, {
      loading: 'Banning users...',
      success: () => `Banned ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}.`,
      error: String,
    })
  }

  const runBulkUnban = async () => {
    const selectedUsers = selectedRows.map((row) => row.original as AdminUsers)
    if (selectedUsers.length === 0) return
    const ids = selectedUsers.map((u) => u.id)

    const promise = bulkBanMutation.mutateAsync({ ids, banned: false }).then(() => {
      table.resetRowSelection()
    })

    toast.promise(promise, {
      loading: 'Unbanning users...',
      success: () => `Unbanned ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}.`,
      error: String,
    })
  }

  const handleBulkExport = () => {
    const selectedUsers = selectedRows.map((row) => row.original as AdminUsers)
    toast.promise(Promise.resolve(), {
      loading: 'Exporting users...',
      success: () => {
        table.resetRowSelection()
        return `Exported ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} to CSV.`
      },
      error: 'Error',
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='user'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              aria-label='Ban/unban users'
              title='Ban/unban users'
            >
              <CircleArrowUp />
              <span className='sr-only'>Ban/unban users</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={14}>
            <DropdownMenuItem onClick={() => void runBulkBan()}>Ban selected</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void runBulkUnban()}>Unban selected</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkExport()}
              className='size-8'
              aria-label='Export users'
              title='Export users'
            >
              <Download />
              <span className='sr-only'>Export users</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export users</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Delete selected users'
              title='Delete selected users'
            >
              <Trash2 />
              <span className='sr-only'>Delete selected users</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected users</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <AdminUsersMultiDeleteDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} table={table} />
    </>
  )
}
