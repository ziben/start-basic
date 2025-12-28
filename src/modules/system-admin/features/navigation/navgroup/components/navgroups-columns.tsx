import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from '~/hooks/useTranslation'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { type AdminNavgroup } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

export function useNavGroupColumns(): ColumnDef<AdminNavgroup>[] {
  const { t } = useTranslation()

  return [
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
      accessorKey: 'title',
      header: () => t('admin.navgroup.table.title'),
      cell: ({ row }) => t(row.getValue<string>('title')),
      meta: { className: 'w-40' },
    },
    {
      accessorKey: 'orderIndex',
      header: () => t('admin.navgroup.table.orderIndex'),
      cell: ({ row }) => row.getValue('orderIndex'),
      meta: { className: 'w-20' },
    },
    {
      id: 'roles',
      header: () => t('admin.navgroup.table.roles'),
      cell: ({ row }) => {
        const roleNavGroups = row.original.roleNavGroups || []
        return (
          <div className='flex flex-wrap gap-1'>
            {roleNavGroups.map((rng) => (
              <Badge key={rng.id} variant='outline' className='border-blue-300 bg-blue-50 text-blue-700'>
                {rng.role}
              </Badge>
            ))}
            {roleNavGroups.length === 0 && '-'}
          </div>
        )
      },
      meta: { className: 'w-40' },
    },
    {
      id: 'navItems',
      header: () => t('admin.navgroup.table.navItems'),
      cell: ({ row }) => {
        const navItems = row.original.navItems || []
        return <div>{navItems.length > 0 ? `${navItems.length} ${t('admin.navgroup.table.itemsCount')}` : '-'}</div>
      },
      meta: { className: 'w-24' },
    },
    {
      accessorKey: 'createdAt',
      header: () => t('admin.navgroup.table.createdAt'),
      cell: ({ row }) => formatDate(row.getValue('createdAt')),
      meta: { className: 'w-32' },
    },
    {
      accessorKey: 'updatedAt',
      header: () => t('admin.navgroup.table.updatedAt'),
      cell: ({ row }) => formatDate(row.getValue('updatedAt')),
      meta: { className: 'w-32' },
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ]
}
