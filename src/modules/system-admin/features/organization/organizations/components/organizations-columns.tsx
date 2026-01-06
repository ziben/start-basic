import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Building2, Users, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTableRowActions } from './data-table-row-actions'
import { type Organization } from '../data/schema'

export function useOrganizationsColumns() {
  return useMemo<ColumnDef<Organization>[]>(
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
        meta: {
          className: 'w-[40px]',
        },
      },
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='组织名称' />,
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
        header: ({ column }) => <DataTableColumnHeader column={column} title='标识符' />,
        cell: ({ row }) => {
          const slug = row.getValue('slug') as string | null
          return slug ? (
            <Badge variant='outline' className='font-mono text-xs'>
              {slug}
            </Badge>
          ) : (
            <span className='text-muted-foreground'>-</span>
          )
        },
        meta: {
          className: 'min-w-[150px]',
        },
      },
      {
        id: 'members',
        accessorFn: (row) => row._count?.members ?? 0,
        header: ({ column }) => <DataTableColumnHeader column={column} title='成员数' />,
        cell: ({ row }) => {
          const count = row.original._count?.members ?? 0
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
        accessorFn: (row) => row._count?.departments ?? 0,
        header: ({ column }) => <DataTableColumnHeader column={column} title='部门数' />,
        cell: ({ row }) => {
          const count = row.original._count?.departments ?? 0
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
        header: ({ column }) => <DataTableColumnHeader column={column} title='创建时间' />,
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
    []
  )
}
