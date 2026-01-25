import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useMutation } from '@tanstack/react-query'
import { type Row } from '@tanstack/react-table'
import { Trash2, UserPen, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { bulkBanUsersFn } from '../../../../shared/server-fns/user.fn'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type AdminUser } from '../data/schema'
import { adminUsersQueryKeys } from '~/shared/lib/query-keys'
import { useUsersOptimisticUpdate, createBulkBanUpdateFn } from '../hooks/use-users-optimistic-update'
import { useAdminUsers } from './admin-users-provider'

type DataTableRowActionsProps<TData> = {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const user = row.original as AdminUser

  const { setOpen, setCurrentRow } = useAdminUsers()
  const { getOptimisticMutationOptions } = useUsersOptimisticUpdate()
  const { t } = useTranslation()

  const banMutation = useMutation({
    mutationFn: async (input: { id: string; banned: boolean }) => {
      return await bulkBanUsersFn({
        data: {
          ids: [input.id],
          banned: input.banned,
          banReason: undefined,
        }
      })
    },
    ...getOptimisticMutationOptions({
      queryKey: adminUsersQueryKeys.all,
      updateFn: (users, variables) => createBulkBanUpdateFn(users, [variables.id], variables.banned),
    }),
  })

  const runBanToggle = (nextBanned: boolean) => {
    const promise = banMutation.mutateAsync({ id: user.id, banned: nextBanned })
    toast.promise(promise, {
      loading: nextBanned ? t('admin.user.toast.ban.loading') : t('admin.user.toast.unban.loading'),
      success: nextBanned ? t('admin.user.toast.ban.success') : t('admin.user.toast.unban.success'),
      error: String,
    })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>{t('admin.user.actions.openMenu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[60px]'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(user)
            runBanToggle(!user.banned)
          }}
        >
          {user.banned ? t('admin.user.actions.unban') : t('admin.user.actions.ban')}
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
          {t('admin.user.actions.edit')}
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
          {t('admin.user.actions.delete')}
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}







