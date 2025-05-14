import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AdminUser } from '../data/schema'
import { useTranslation } from '~/hooks/useTranslation'
import { DataTableRowActions } from './admin-user-row-actions'

export function useAdminUserColumns() {
  const { t } = useTranslation()
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
      meta: { className: 'sticky left-0 z-10 bg-background' },
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
      accessorKey: 'status',
      header: () => t('admin.user.table.status'),
      cell: ({ row }) => (
        <Badge variant='outline' className='capitalize'>
          {row.getValue('status')}
        </Badge>
      ),
      meta: { className: 'w-24' },
    },
    {
      id: 'actions',
      cell: DataTableRowActions,
      meta: { className: 'w-12' },
    },
  ]
  return columns
} 