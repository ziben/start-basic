import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Row } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '~/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { adminUsersSchema } from '../data/schema'
import { useAdminUsers } from './admin-users-provider'

type DataTableRowActionsProps<TData> = {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const task = adminUsersSchema.parse(row.original)

  const { setOpen, setCurrentRow } = useAdminUsers()
  const queryClient = useQueryClient()

  const banMutation = useMutation({
    mutationFn: async (input: { id: string; banned: boolean }) => {
      return await apiClient.users.bulkBan({
        ids: [input.id],
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
          items: old.items.map((u: any) =>
            u.id === input.id
              ? {
                  ...u,
                  banned: input.banned,
                  banReason: input.banned ? (u.banReason ?? null) : null,
                  banExpires: input.banned ? (u.banExpires ?? null) : null,
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
        <Button variant='ghost' className='data-[state=open]:bg-muted flex h-8 w-8 p-0'>
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
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runBanToggle(!task.banned)}>{task.banned ? 'Unban' : 'Ban'}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(task)
            setOpen('delete')
          }}
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
