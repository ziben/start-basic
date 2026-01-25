import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Building2, Users, Phone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTableRowActions } from './data-table-row-actions'
import { type Department } from '../data/schema'

export function useDepartmentsColumns() {
  return useMemo<ColumnDef<Department>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='部门名称' />,
        cell: ({ row }) => {
          const name = row.getValue('name') as string
          const level = row.original.level
          const code = row.original.code
          const memberCount = row.original.memberCount
          return (
            <div className='flex items-center gap-2'>
              <Building2 className='h-4 w-4 text-muted-foreground' />
              <div className='flex flex-col'>
                <div className='flex items-center gap-2'>
                  <span style={{ paddingLeft: `${(level - 1) * 16}px` }} className='font-medium'>
                    {name}
                  </span>
                  {memberCount !== undefined && memberCount > 0 && (
                    <Badge variant='secondary' className='text-xs'>
                      {memberCount} 人
                    </Badge>
                  )}
                </div>
                <span className='text-xs text-muted-foreground'>{code}</span>
              </div>
            </div>
          )
        },
        meta: {
          className: 'min-w-[200px]',
        },
      },
      {
        accessorKey: 'leader',
        header: ({ column }) => <DataTableColumnHeader column={column} title='负责人' />,
        cell: ({ row }) => {
          const leader = row.getValue('leader') as string | null
          return leader ? (
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span>{leader}</span>
            </div>
          ) : (
            <span className='text-muted-foreground'>-</span>
          )
        },
        meta: {
          className: 'w-[120px]',
        },
      },
      {
        accessorKey: 'phone',
        header: ({ column }) => <DataTableColumnHeader column={column} title='联系电话' />,
        cell: ({ row }) => {
          const phone = row.getValue('phone') as string | null
          return phone ? (
            <div className='flex items-center gap-2'>
              <Phone className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>{phone}</span>
            </div>
          ) : (
            <span className='text-muted-foreground'>-</span>
          )
        },
        meta: {
          className: 'w-[150px]',
        },
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title='邮箱' />,
        cell: ({ row }) => {
          const email = row.getValue('email') as string | null
          return email ? (
            <div className='flex items-center gap-2'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>{email}</span>
            </div>
          ) : (
            <span className='text-muted-foreground'>-</span>
          )
        },
        meta: {
          className: 'min-w-[180px]',
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='状态' />,
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          return (
            <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
              {status === 'ACTIVE' ? '启用' : '停用'}
            </Badge>
          )
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id))
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
          return <span className='text-muted-foreground'>{format(new Date(date), 'yyyy-MM-dd')}</span>
        },
        meta: {
          className: 'w-[120px]',
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
