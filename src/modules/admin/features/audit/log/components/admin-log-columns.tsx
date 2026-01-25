import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { type AdminAuditLog, type AdminSystemLog } from '~/modules/admin/shared/hooks/use-admin-log-api'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'

export function useSystemLogColumns() {
  return useMemo<ColumnDef<AdminSystemLog>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='时间' />,
        cell: ({ row }) => <span className='text-sm'>{new Date(row.original.createdAt).toLocaleString()}</span>,
        meta: {
          className: 'w-[180px]',
        },
      },
      {
        accessorKey: 'level',
        header: ({ column }) => <DataTableColumnHeader column={column} title='级别' />,
        cell: ({ row }) => {
          const v = row.original.level
          return (
            <Badge variant={v === 'error' ? 'destructive' : v === 'warn' ? 'secondary' : 'outline'}>{v}</Badge>
          )
        },
        meta: {
          className: 'w-[100px]',
        },
      },
      {
        id: 'req',
        accessorFn: (row) => `${row.method} ${row.path}`,
        header: '请求',
        cell: ({ row }) => (
          <div>
            <div className='font-mono text-xs text-muted-foreground'>{row.original.requestId || '-'}</div>
            <div className='font-medium'>
              {row.original.method} {row.original.path}
            </div>
            <div className='text-sm text-muted-foreground'>{row.original.query || ''}</div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='状态' />,
        cell: ({ row }) => <span className='text-sm'>{row.original.status}</span>,
        meta: {
          className: 'w-[80px]',
        },
      },
      {
        accessorKey: 'durationMs',
        header: ({ column }) => <DataTableColumnHeader column={column} title='耗时(ms)' />,
        cell: ({ row }) => <span className='text-sm'>{row.original.durationMs}</span>,
        meta: {
          className: 'w-[100px]',
        },
      },
      {
        accessorKey: 'userId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='用户' />,
        cell: ({ row }) => <span className='font-mono text-xs'>{row.original.userId || '-'}</span>,
        meta: {
          className: 'w-[120px]',
        },
      },
      {
        accessorKey: 'error',
        header: '错误',
        cell: ({ row }) => <span className='text-sm text-red-600'>{row.original.error || ''}</span>,
      },
    ],
    []
  )
}

export function useAuditLogColumns() {
  return useMemo<ColumnDef<AdminAuditLog>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='时间' />,
        cell: ({ row }) => <span className='text-sm'>{new Date(row.original.createdAt).toLocaleString()}</span>,
        meta: {
          className: 'w-[180px]',
        },
      },
      {
        accessorKey: 'success',
        header: ({ column }) => <DataTableColumnHeader column={column} title='结果' />,
        cell: ({ row }) => (
          <Badge variant={row.original.success ? 'outline' : 'destructive'}>
            {row.original.success ? '成功' : '失败'}
          </Badge>
        ),
        meta: {
          className: 'w-[100px]',
        },
      },
      {
        accessorKey: 'action',
        header: ({ column }) => <DataTableColumnHeader column={column} title='动作' />,
        cell: ({ row }) => <span className='font-mono text-xs'>{row.original.action}</span>,
        meta: {
          className: 'w-[150px]',
        },
      },
      {
        id: 'target',
        accessorFn: (row) => `${row.targetType}:${row.targetId ?? ''}`,
        header: '目标',
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{`${row.original.targetType}:${row.original.targetId ?? '-'}`}</span>
        ),
        meta: {
          className: 'w-[200px]',
        },
      },
      {
        accessorKey: 'actorUserId',
        header: '操作者',
        cell: ({ row }) => <span className='font-mono text-xs'>{row.original.actorUserId || '-'}</span>,
        meta: {
          className: 'w-[120px]',
        },
      },
      {
        accessorKey: 'message',
        header: '信息',
        cell: ({ row }) => <span className='text-sm'>{row.original.message || ''}</span>,
      },
    ],
    []
  )
}




