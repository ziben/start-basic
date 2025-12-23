import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useMutation } from '@tanstack/react-query'
import { type Row } from '@tanstack/react-table'
import { Trash2, UserPen } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '~/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { adminUsersSchema, type AdminUsers } from '../data/schema'
import { useUsersOptimisticUpdate, createBulkBanUpdateFn } from '../hooks/use-users-optimistic-update'
import { useAdminUsers } from './admin-users-provider'

type DataTableRowActionsProps<TData> = {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const task = adminUsersSchema.parse(row.original)

  const { setOpen, setCurrentRow } = useAdminUsers()
  const { getOptimisticMutationOptions } = useUsersOptimisticUpdate<{ id: string; banned: boolean }>()

  const banMutation = useMutation({
    mutationFn: async (input: { id: string; banned: boolean }) => {
      return await apiClient.users.bulkBan({
        ids: [input.id],
        banned: input.banned,
        banReason: null,
        banExpires: null,
      })
    },
    ...getOptimisticMutationOptions({
      queryKey: ['admin-users'],
      updateFn: (users, variables) => createBulkBanUpdateFn(users, [variables.id], variables.banned),
    }),
  })

  const runBanToggle = (nextBanned: boolean) => {
    const promise = banMutation.mutateAsync({ id: task.id, banned: nextBanned })
    toast.promise(promise, {
      loading: nextBanned ? 'Banning user...' : 'Unbanning user...',
      success: nextBanned ? 'User banned' : 'User unbanned',
      error: String,
    })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(task)
            setOpen('update')
          }}
        >
          Edit
          <DropdownMenuShortcut>
            <UserPen size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(task)
            setOpen('delete')
          }}
          className='text-red-500!'
        >
          Delete
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
