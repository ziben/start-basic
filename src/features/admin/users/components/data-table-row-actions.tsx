import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useMutation } from '@tanstack/react-query'
import { type Row } from '@tanstack/react-table'
import { Trash2, UserPen, Ban } from 'lucide-react'
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
import { ADMIN_USERS_QUERY_KEY } from '../hooks/use-admin-users-list-query'
import { useUsersOptimisticUpdate, createBulkBanUpdateFn } from '../hooks/use-users-optimistic-update'
import { useAdminUsers } from './admin-users-provider'

type DataTableRowActionsProps<TData> = {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {  
  const user = row.original as AdminUsers

  const { setOpen, setCurrentRow } = useAdminUsers()
  const { getOptimisticMutationOptions } = useUsersOptimisticUpdate()

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
      queryKey: ADMIN_USERS_QUERY_KEY,
      updateFn: (users, variables) => createBulkBanUpdateFn(users, [variables.id], variables.banned),
    }),
  })

  const runBanToggle = (nextBanned: boolean) => {
    const promise = banMutation.mutateAsync({ id: user.id, banned: nextBanned })
    toast.promise(promise, {
      loading: nextBanned ? '封禁用户...' : '解封用户...',
      success: nextBanned ? '用户已封禁' : '用户已解封',
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
      <DropdownMenuContent align='end' className='w-[60px]'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(user)
            runBanToggle(!user.banned)
          }}
        >
          {user.banned ? '解封' : '封禁'}
          <DropdownMenuShortcut>
            <Ban size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(user)
            setOpen('update')
          }}
        >
          编辑
          <DropdownMenuShortcut>
            <UserPen size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(user)
            setOpen('delete')
          }}
          className='text-red-500!'
        >
          删除
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
