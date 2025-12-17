import React, { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, CircleArrowUp, Download } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type AdminUsers } from '../data/schema'
import { AdminUsersMultiDeleteDialog } from './admin-users-multi-delete-dialog'
import { apiClient } from '~/lib/api-client'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

function DataTableBulkActionsInner<TData>({
  table,
}: Readonly<DataTableBulkActionsProps<TData>>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const queryClient = useQueryClient()

  const bulkBanMutation = useMutation({
    mutationFn: async (input: { ids: string[]; banned: boolean }) => {
      return await apiClient.users.bulkBan({
        ids: input.ids,
        banned: input.banned,
        banReason: null,
        banExpires: null,
      })
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] })
      const previous = queryClient.getQueriesData({ queryKey: ['admin-users'] })

      queryClient.setQueriesData({ queryKey: ['admin-users'] }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old
        return {
          ...old,
          items: old.items.map((u: AdminUsers) =>
            input.ids.includes(u.id)
              ? {
                  ...u,
                  banned: input.banned,
                  banReason: input.banned ? u.banReason ?? null : null,
                  banExpires: input.banned ? u.banExpires ?? null : null,
                }
              : u
          ),
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

  const runBulkBan = async () => {
    const selectedUsers = selectedRows.map((row) => row.original as AdminUsers)
    if (selectedUsers.length === 0) return
    const ids = selectedUsers.map((u) => u.id)

    const promise = bulkBanMutation.mutateAsync({ ids, banned: true }).then(() => {
      table.resetRowSelection()
    })

    const noun = selectedUsers.length > 1 ? 'users' : 'user'
    const verb = 'Banned'
    const loading = 'Banning users...'

    toast.promise(promise, {
      loading,
      success: () => {
        return `${verb} ${selectedUsers.length} ${noun}.`
      },
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

    const noun = selectedUsers.length > 1 ? 'users' : 'user'
    const verb = 'Unbanned'
    const loading = 'Unbanning users...'

    toast.promise(promise, {
      loading,
      success: () => {
        return `${verb} ${selectedUsers.length} ${noun}.`
      },
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
            <DropdownMenuItem onClick={() => void runBulkBan()}>
              Ban selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void runBulkUnban()}>
              Unban selected
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

      <AdminUsersMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  )
}

// 使用 memo 优化，避免不必要的重渲染
export const DataTableBulkActions = React.memo(
  DataTableBulkActionsInner
) as typeof DataTableBulkActionsInner
