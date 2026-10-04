import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Building2, Users, Layers } from 'lucide-react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTableRowActions } from './data-table-row-actions'
import { type Organization } from '../data/schema'

export function useOrganizationsColumns() {
  const { t } = useTranslation()
  return useMemo<ColumnDef<Organization>[]>(
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
        meta: {
          className: 'w-[40px]',
        },
      },
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.organization.table.name')} />,
        cell: ({ row }) => {
          return (
            <div className='flex items-center gap-2'>
              <Building2 className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium'>{row.getValue('name')}</span>
            </div>
          )
        },
        meta: {
          className: 'min-w-[200px]',
        },
      },
      {
        accessorKey: 'slug',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.organization.table.slug')} />,
        cell: ({ row }) => {
          const slug = row.getValue('slug') as string | null
          return slug ? (
            <Badge variant='outline' className='font-mono text-xs'>
              {slug}
            </Badge>
          ) : (
            <span className='text-muted-foreground'>{t('admin.common.empty')}</span>
          )
        },
        meta: {
          className: 'min-w-[150px]',
        },
      },
      {
        id: 'members',
        accessorFn: (row) => row.memberCount ?? 0,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.organization.table.members')} />,
        cell: ({ row }) => {
          const count = row.original.memberCount ?? 0
          return (
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span>{count}</span>
            </div>
          )
        },
        meta: {
          className: 'w-[100px]',
        },
      },
      {
        id: 'departments',
        accessorFn: (row) => row.departmentCount ?? 0,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.organization.table.departments')} />,
        cell: ({ row }) => {
          const count = row.original.departmentCount ?? 0
          return (
            <div className='flex items-center gap-2'>
              <Layers className='h-4 w-4 text-muted-foreground' />
              <span>{count}</span>
            </div>
          )
        },
        meta: {
          className: 'w-[100px]',
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin.organization.table.createdAt')} />,
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as string
          return <span className='text-muted-foreground'>{format(new Date(date), 'yyyy-MM-dd HH:mm')}</span>
        },
        meta: {
          className: 'min-w-[150px]',
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => <DataTableRowActions row={row} />,
        meta: {
          className: 'w-[60px]',
        },
      },
    ],
    [t]
  )
}
