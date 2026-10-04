import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { User, Building2, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTableRowActions } from './data-table-row-actions'
import { type Member } from '../data/schema'

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  member: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

export function useMembersColumns() {
  return useMemo<ColumnDef<Member>[]>(
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
          className: 'w-[50px]',
        },
      },
      {
        accessorKey: 'username',
        header: ({ column }) => <DataTableColumnHeader column={column} title='用户' />,
        cell: ({ row }) => {
          const username = row.getValue('username') as string
          const email = row.original.email
          return (
            <div className='flex items-center gap-2'>
              <User className='h-4 w-4 text-muted-foreground' />
              <div className='flex flex-col'>
                <span className='font-medium'>{username}</span>
                <span className='text-xs text-muted-foreground'>{email}</span>
              </div>
            </div>
          )
        },
        meta: {
          className: 'min-w-[200px]',
        },
      },
      {
        accessorKey: 'organizationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='组织' />,
        cell: ({ row }) => {
          const orgName = row.getValue('organizationName') as string
          const orgSlug = row.original.organizationSlug
          return (
            <div className='flex items-center gap-2'>
              <Building2 className='h-4 w-4 text-muted-foreground' />
              <div className='flex flex-col'>
                <span className='font-medium'>{orgName}</span>
                {orgSlug && <span className='text-xs text-muted-foreground'>@{orgSlug}</span>}
              </div>
            </div>
          )
        },
        meta: {
          className: 'min-w-[180px]',
        },
      },
      {
        accessorKey: 'department',
        header: ({ column }) => <DataTableColumnHeader column={column} title='部门' />,
        cell: ({ row }) => {
          const department = row.original.department
          if (!department) {
            return <span className='text-muted-foreground'>-</span>
          }
          return (
            <div className='flex items-center gap-2'>
              <Building2 className='h-4 w-4 text-muted-foreground' />
              <div className='flex flex-col'>
                <span className='font-medium'>{department.name}</span>
                <span className='text-xs text-muted-foreground'>{department.code}</span>
              </div>
            </div>
          )
        },
        meta: {
          className: 'min-w-[150px]',
        },
      },
      {
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} title='角色' />,
        cell: ({ row }) => {
          const role = row.getValue('role') as string
          const roleLabels: Record<string, string> = {
            owner: '所有者',
            admin: '管理员',
            member: '成员',
          }

          return (
            <div className='flex items-center gap-2'>
              <Shield className='h-4 w-4 text-muted-foreground' />
              <Badge variant='outline' className={roleColors[role] || roleColors.member}>
                {roleLabels[role] || role}
              </Badge>
            </div>
          )
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id))
        },
        meta: {
          className: 'w-[150px]',
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='加入时间' />,
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
