import { DataTableColumnHeader } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from '~/hooks/useTranslation'
import { type AdminUsers } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { cn } from '~/lib/utils'
import { useMemo } from 'react'

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

export function useAdminUsersColumns(): ColumnDef<AdminUsers>[] {
  const { t } = useTranslation()

  return useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
          className='translate-y-[2px]'
        />
      ),
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
      header: () => t('admin.user.table.name'),
      cell: ({ row }) => row.getValue('name'),
      meta: { className: 'w-32' },
    },
    {
      accessorKey: 'username',
      header: () => t('admin.user.table.username'),
      cell: ({ row }) => row.getValue('username'),
      meta: { className: 'w-32' },
    },
    {
      accessorKey: 'email',
      header: () => t('admin.user.table.email'),
      cell: ({ row }) => row.getValue('email'),
      meta: { className: 'w-48' },
    },
    {
      accessorKey: 'role',
      header: () => t('admin.user.table.role'),
      cell: ({ row }) => row.getValue('role'),
      meta: { className: 'w-24' },
    },
    {
      accessorKey: 'banned',
      header: () => t('admin.user.table.status'),
      cell: ({ row }) => (
        <Badge variant='outline' className={cn('capitalize', {
          'bg-red-50 text-red-700 border-red-300': row.getValue('banned'),
          'bg-green-50 text-green-700 border-green-300': !row.getValue('banned')
        })}>
          {row.getValue('banned') ? t('admin.user.table.status.banned') : t('admin.user.table.status.normal')}
        </Badge>
      ),
      meta: { className: 'w-24' },
    },
    {
      accessorKey: 'banReason',
      header: () => t('admin.user.table.banReason'),
      cell: ({ row }) => row.getValue('banReason') || '-',
      meta: { className: 'w-32' },
    },
    {
      accessorKey: 'banExpires',
      header: () => t('admin.user.table.banExpires'),
      cell: ({ row }) => formatDate(row.getValue('banExpires')),
      meta: { className: 'w-32' },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('admin.user.table.createdAt')} />
      ),
      cell: ({ row }) => formatDate(row.getValue('createdAt')),
      meta: { className: 'w-32' },
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('admin.user.table.updatedAt')} />
      ),
      cell: ({ row }) => formatDate(row.getValue('updatedAt')),
      meta: { className: 'w-32' },
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ], [t])
}
