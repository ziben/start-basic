import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { cn, formatDate } from '@/shared/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTableColumnHeader } from '@/components/data-table'
import { type AdminUser } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export function useAdminUsersColumns(): ColumnDef<AdminUser>[] {
  const { t } = useTranslation()

  return useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t('admin.table.selectAll')}
            className='translate-y-[2px]'
          />
        ),
        meta: {
          className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
        },
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('admin.table.selectRow')}
            className='translate-y-[2px]'
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.name')} />,
        cell: ({ row }) => {
          const value = row.getValue('name') as string
          const userId = row.original.id
          return (
            <Link
              to='/admin/account'
              search={{ userId }}
              className='ps-2 text-nowrap text-primary hover:underline'
              title={value}
            >
              {value?.length > 20 ? `${value.slice(0, 20)}...` : value}
            </Link>
          )
        },
        meta: { className: 'w-32', title: t('admin.user.table.name') },
      },
      {
        accessorKey: 'username',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.username')} />,
        cell: ({ row }) => {
          const value = row.getValue('username') as string | null
          return <div className='text-muted-foreground'>{value || '-'}</div>
        },
        meta: { className: 'w-32', title: t('admin.user.table.username') },
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.email')} />,
        cell: ({ row }) => <div className='w-fit ps-2 text-nowrap'>{row.getValue('email')}</div>,
        meta: { className: 'w-48', title: t('admin.user.table.email') },
      },
      {
        accessorKey: 'accounts',
        header: ({ column }) => <DataTableColumnHeader column={column} title="登录方式" />,
        cell: ({ row }) => {
          const accounts = row.original.accounts || []

          if (accounts.length === 0) {
            return <div className="text-muted-foreground">-</div>
          }

          // Provider ID 到中文映射
          const providerLabels: Record<string, string> = {
            wechat: '微信',
            username: '用户名',
            email: '邮箱',
            google: 'Google',
            github: 'GitHub',
          }

          return (
            <div className="flex flex-wrap gap-1">
              {accounts.map((account) => (
                <TooltipProvider key={account.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="cursor-help">
                        {providerLabels[account.providerId] || account.providerId}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-1">
                        <div className="font-medium">
                          {providerLabels[account.providerId] || account.providerId}登录
                        </div>
                        {account.providerId !== 'username' && account.providerId !== 'email' && (
                          <div className="text-muted-foreground">
                            ID: {account.accountId.substring(0, 12)}...
                          </div>
                        )}
                        {(account.providerId === 'username' || account.providerId === 'email') && (
                          <div>
                            {account.providerId === 'username' ? '用户名' : '邮箱'}: {account.accountId}
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          绑定于: {formatDate(account.createdAt)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {accounts.length > 1 && (
                <Badge variant="outline" className="text-muted-foreground">
                  ({accounts.length})
                </Badge>
              )}
            </div>
          )
        },
        meta: { className: 'w-40', title: '登录方式' },
      },
      {
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.role')} />,
        cell: ({ row }) => {
          const role = row.getValue('role') as string
          const systemRoles = row.original.systemRoles || []

          // 如果有详细的 systemRoles 信息，优先使用它
          if (systemRoles.length > 0) {
            return (
              <div className='flex flex-wrap gap-1'>
                {systemRoles.map((r) => {
                  const isSystemAdmin = r.name === 'admin' || r.name === 'superadmin'
                  return (
                    <Badge
                      key={r.id}
                      variant='outline'
                      className={cn('capitalize', isSystemAdmin && 'border-primary bg-primary/10 text-primary')}
                    >
                      {r.label || r.name}
                    </Badge>
                  )
                })}
              </div>
            )
          }

          // 回退到解析逗号分隔的 role 字符串
          const roles = role ? role.split(',').map((r) => r.trim()) : []
          const roleLabels: Record<string, string> = {
            superadmin: t('admin.user.roles.superadmin'),
            admin: t('admin.user.roles.admin'),
            user: t('admin.user.roles.user'),
          }

          return (
            <div className='flex flex-wrap gap-1'>
              {roles.map((r, index) => {
                const isSystemAdmin = r === 'admin' || r === 'superadmin'
                return (
                  <Badge
                    key={index}
                    variant='outline'
                    className={cn('capitalize', isSystemAdmin && 'border-primary bg-primary/10 text-primary')}
                  >
                    {roleLabels[r] || r}
                  </Badge>
                )
              })}
            </div>
          )
        },
        meta: { className: 'w-40', title: t('admin.user.table.role') },
      },
      {
        accessorKey: 'banned',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.status')} />,
        cell: ({ row }) => (
          <Badge
            variant='outline'
            className={cn('capitalize', {
              'border-red-300 bg-red-50 text-red-700': row.getValue('banned'),
              'border-green-300 bg-green-50 text-green-700': !row.getValue('banned'),
            })}
          >
            {row.getValue('banned') ? t('admin.user.table.status.banned') : t('admin.user.table.status.normal')}
          </Badge>
        ),
        meta: { className: 'w-24', title: t('admin.user.table.status') },
      },
      {
        accessorKey: 'banReason',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.banReason')} />,
        cell: ({ row }) => {
          const value = row.getValue('banReason') as string | null
          return <div className='text-muted-foreground'>{value || '-'}</div>
        },
        meta: { className: 'w-32', title: t('admin.user.table.banReason') },
      },
      {
        accessorKey: 'banExpires',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.banExpires')} />,
        cell: ({ row }) => {
          const value = formatDate(row.getValue('banExpires'))
          return <div className='text-muted-foreground'>{value}</div>
        },
        meta: { className: 'w-32', title: t('admin.user.table.banExpires') },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.createdAt')} />,
        cell: ({ row }) => <div className='text-muted-foreground'>{formatDate(row.getValue('createdAt'))}</div>,
        meta: { className: 'w-32', title: t('admin.user.table.createdAt') },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.updatedAt')} />,
        cell: ({ row }) => <div className='text-muted-foreground'>{formatDate(row.getValue('updatedAt'))}</div>,
        meta: { className: 'w-32', title: t('admin.user.table.updatedAt') },
      },
      {
        id: 'actions',
        cell: DataTableRowActions,
      },
    ],
    [t]
  )
}








