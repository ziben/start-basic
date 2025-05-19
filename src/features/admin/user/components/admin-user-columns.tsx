import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AdminUser } from '../data/schema'
import { useTranslation } from '~/hooks/useTranslation'
import { DataTableRowActions } from './admin-user-row-actions'

export function useAdminUserColumns() {
  const { t } = useTranslation()
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
  }

  const columns: ColumnDef<AdminUser>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('common.selectAll')}
          className='translate-y-[2px]'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t('common.selectRow')}
          className='translate-y-[2px]'
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { className: 'w-10 sticky left-0 z-10 bg-background' },
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
      header: () => t('admin.user.table.createdAt'),
      cell: ({ row }) => formatDate(row.getValue('createdAt')),
      meta: { className: 'w-32' },
    },
    {
      accessorKey: 'updatedAt',
      header: () => t('admin.user.table.updatedAt'),
      cell: ({ row }) => formatDate(row.getValue('updatedAt')),
      meta: { className: 'w-32' },
    },
    {
      id: 'actions',
      cell: DataTableRowActions,
      meta: { className: 'w-12' },
    },
  ]
  return columns
} 