import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AdminNavgroup } from '../data/schema'
import { useTranslation } from '~/hooks/useTranslation'
import { DataTableRowActions } from './admin-navgroup-row-actions'

export function useAdminNavgroupColumns() {
  const { t } = useTranslation()
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
  }

  const columns: ColumnDef<AdminNavgroup>[] = [
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
      accessorKey: 'id',
      header: () => t('admin.navgroup.table.id', { defaultMessage: 'ID' }),
      cell: ({ row }) => <div className="truncate max-w-[120px]">{row.getValue('id')}</div>,
      meta: { className: 'w-24' },
    },
    {
      accessorKey: 'title',
      header: () => t('admin.navgroup.table.title', { defaultMessage: '标题' }),
      cell: ({ row }) => t(row.getValue<string>('title')),
      meta: { className: 'w-40' },
    },
    {
      accessorKey: 'orderIndex',
      header: () => t('admin.navgroup.table.orderIndex', { defaultMessage: '排序' }),
      cell: ({ row }) => row.getValue('orderIndex'),
      meta: { className: 'w-20' },
    },
    {
      id: 'roles',
      header: () => t('admin.navgroup.table.roles', { defaultMessage: '角色' }),
      cell: ({ row }) => {
        const roleNavGroups = row.original.roleNavGroups || []
        return (
          <div className="flex flex-wrap gap-1">
            {roleNavGroups.map((rng) => (
              <Badge key={rng.id} variant='outline' className="bg-blue-50 text-blue-700 border-blue-300">
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
      header: () => t('admin.navgroup.table.navItems', { defaultMessage: '导航项' }),
      cell: ({ row }) => {
        const navItems = row.original.navItems || []
        return (
          <div>
            {navItems.length > 0 
              ? `${navItems.length} ${t('admin.navgroup.table.itemsCount', { defaultMessage: '项' })}`
              : '-'}
          </div>
        )
      },
      meta: { className: 'w-24' },
    },
    {
      accessorKey: 'createdAt',
      header: () => t('admin.navgroup.table.createdAt', { defaultMessage: '创建时间' }),
      cell: ({ row }) => formatDate(row.getValue('createdAt')),
      meta: { className: 'w-32' },
    },
    {
      accessorKey: 'updatedAt',
      header: () => t('admin.navgroup.table.updatedAt', { defaultMessage: '更新时间' }),
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
