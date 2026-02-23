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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type AdminUser } from '../data/schema'
import { adminUsersQueryKeys } from '~/shared/lib/query-keys'
import { useUsersOptimisticUpdate, createBulkBanUpdateFn } from '../hooks/use-users-optimistic-update'
import { useAdminUsers } from './admin-users-provider'
import { PermissionGuard } from '@/shared/components/permission-guard'

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
    <div className='flex items-center justify-end gap-2'>
      <PermissionGuard permission="user:update">
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8'
          onClick={(e) => {
            e.stopPropagation()
            setCurrentRow(user)
            setOpen('update')
          }}
        >
          <UserPen className='h-4 w-4 text-muted-foreground' />
          <span className='sr-only'>{t('admin.user.actions.edit')}</span>
        </Button>
      </PermissionGuard>

      <PermissionGuard permission="user:delete">
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8'
          onClick={(e) => {
            e.stopPropagation()
            setCurrentRow(user)
            setOpen('delete')
          }}
        >
          <Trash2 className='h-4 w-4 text-destructive' />
          <span className='sr-only'>{t('admin.user.actions.delete')}</span>
        </Button>
      </PermissionGuard>

      <PermissionGuard permission="user:update">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted' onClick={(e) => e.stopPropagation()}>
              <DotsHorizontalIcon className='h-4 w-4' />
              <span className='sr-only'>{t('admin.user.actions.openMenu')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-[160px]'>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setCurrentRow(user)
                runBanToggle(!user.banned)
              }}
            >
              <Ban className='mr-2 h-4 w-4 text-muted-foreground' />
              {user.banned ? t('admin.user.actions.unban') : t('admin.user.actions.ban')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PermissionGuard>
    </div>
  )
}
