import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { cn, formatDate } from '@/shared/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
            aria-label='Select all'
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
            aria-label='Select row'
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
          return (
            <div className='ps-2 text-nowrap' title={value}>
              {value?.length > 20 ? `${value.slice(0, 20)}...` : value}
            </div>
          )
        },
        meta: { className: 'w-32', title: '姓名' },
      },
      {
        accessorKey: 'username',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.username')} />,
        cell: ({ row }) => {
          const value = row.getValue('username') as string | null
          return <div className='text-muted-foreground'>{value || '-'}</div>
        },
        meta: { className: 'w-32', title: '用户名' },
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.email')} />,
        cell: ({ row }) => <div className='w-fit ps-2 text-nowrap'>{row.getValue('email')}</div>,
        meta: { className: 'w-48', title: '邮箱' },
      },
      {
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.role')} />,
        cell: ({ row }) => {
          const value = row.getValue('role') as string
          return (
            <Badge
              variant='outline'
              className={cn('capitalize', value === 'admin' && 'border-primary bg-primary/10 text-primary')}
            >
              {value}
            </Badge>
          )
        },
        meta: { className: 'w-24', title: '角色' },
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
        meta: { className: 'w-24', title: '状态' },
      },
      {
        accessorKey: 'banReason',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.banReason')} />,
        cell: ({ row }) => {
          const value = row.getValue('banReason') as string | null
          return <div className='text-muted-foreground'>{value || '-'}</div>
        },
        meta: { className: 'w-32', title: '封禁原因' },
      },
      {
        accessorKey: 'banExpires',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.banExpires')} />,
        cell: ({ row }) => {
          const value = formatDate(row.getValue('banExpires'))
          return <div className='text-muted-foreground'>{value}</div>
        },
        meta: { className: 'w-32', title: '封禁到期' },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.createdAt')} />,
        cell: ({ row }) => <div className='text-muted-foreground'>{formatDate(row.getValue('createdAt'))}</div>,
        meta: { className: 'w-32', title: '创建时间' },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.user.table.updatedAt')} />,
        cell: ({ row }) => <div className='text-muted-foreground'>{formatDate(row.getValue('updatedAt'))}</div>,
        meta: { className: 'w-32', title: '更新时间' },
      },
      {
        id: 'actions',
        cell: DataTableRowActions,
      },
    ],
    [t]
  )
}








