import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type SystemLog, type AuditLog } from '../data/schema'

// ─── Level Badge ──────────────────────────────────────────────────────────────

const LEVEL_VARIANTS = {
  error: 'destructive',
  warn: 'secondary',
  info: 'outline',
  debug: 'outline',
} as const

function LevelBadge({ level }: { level: SystemLog['level'] }) {
  return (
    <Badge variant={LEVEL_VARIANTS[level] ?? 'outline'} className={cn(level === 'debug' && 'opacity-60')}>
      {level}
    </Badge>
  )
}

// ─── System Log Columns ───────────────────────────────────────────────────────

export function useSystemLogColumns(): ColumnDef<SystemLog>[] {
  return useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='时间' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs text-muted-foreground'>
            {new Date(row.original.createdAt).toLocaleString('zh-CN')}
          </span>
        ),
        meta: { className: 'w-44' },
      },
      {
        accessorKey: 'level',
        header: ({ column }) => <DataTableColumnHeader column={column} title='级别' />,
        cell: ({ row }) => <LevelBadge level={row.original.level} />,
        meta: { className: 'w-20' },
      },
      {
        id: 'req',
        accessorFn: (row) => `${row.method} ${row.path}`,
        header: '请求',
        cell: ({ row }) => (
          <div className='space-y-0.5'>
            <div className='font-mono text-xs text-muted-foreground'>{row.original.requestId || '-'}</div>
            <div className='font-medium text-sm'>
              <span className='mr-1.5 rounded bg-muted px-1 py-0.5 font-mono text-xs'>{row.original.method}</span>
              {row.original.path}
            </div>
            {row.original.query && (
              <div className='font-mono text-xs text-muted-foreground truncate max-w-xs'>{row.original.query}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='状态' />,
        cell: ({ row }) => {
          const s = row.original.status
          return (
            <span
              className={cn(
                'font-mono text-sm font-medium',
                s >= 500 && 'text-destructive',
                s >= 400 && s < 500 && 'text-amber-600',
                s >= 200 && s < 300 && 'text-green-600',
              )}
            >
              {s}
            </span>
          )
        },
        meta: { className: 'w-16' },
      },
      {
        accessorKey: 'durationMs',
        header: ({ column }) => <DataTableColumnHeader column={column} title='耗时(ms)' />,
        cell: ({ row }) => {
          const ms = row.original.durationMs
          return (
            <span className={cn('font-mono text-sm', ms > 1000 && 'text-amber-600 font-medium', ms > 5000 && 'text-destructive font-medium')}>
              {ms}
            </span>
          )
        },
        meta: { className: 'w-24' },
      },
      {
        accessorKey: 'userId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='用户' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs text-muted-foreground'>{row.original.userId || '-'}</span>
        ),
        meta: { className: 'w-28' },
      },
      {
        accessorKey: 'error',
        header: '错误',
        cell: ({ row }) =>
          row.original.error ? (
            <span className='text-xs text-destructive line-clamp-2'>{row.original.error}</span>
          ) : (
            <span className='text-muted-foreground'>-</span>
          ),
      },
    ],
    [],
  )
}

// ─── Audit Log Columns ────────────────────────────────────────────────────────

export function useAuditLogColumns(): ColumnDef<AuditLog>[] {
  return useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='时间' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs text-muted-foreground'>
            {new Date(row.original.createdAt).toLocaleString('zh-CN')}
          </span>
        ),
        meta: { className: 'w-44' },
      },
      {
        accessorKey: 'success',
        header: ({ column }) => <DataTableColumnHeader column={column} title='结果' />,
        cell: ({ row }) => (
          <Badge variant={row.original.success ? 'outline' : 'destructive'}>
            {row.original.success ? '成功' : '失败'}
          </Badge>
        ),
        meta: { className: 'w-20' },
      },
      {
        accessorKey: 'action',
        header: ({ column }) => <DataTableColumnHeader column={column} title='动作' />,
        cell: ({ row }) => (
          <span className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs'>{row.original.action}</span>
        ),
        meta: { className: 'w-40' },
      },
      {
        id: 'target',
        accessorFn: (row) => `${row.targetType}:${row.targetId ?? ''}`,
        header: '目标',
        cell: ({ row }) => (
          <div className='font-mono text-xs text-muted-foreground'>
            <span className='text-foreground'>{row.original.targetType}</span>
            {row.original.targetId && <span className='opacity-60'>:{row.original.targetId}</span>}
          </div>
        ),
        meta: { className: 'w-52' },
      },
      {
        accessorKey: 'actorUserId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='操作者' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs text-muted-foreground'>{row.original.actorUserId || '-'}</span>
        ),
        meta: { className: 'w-28' },
      },
      {
        accessorKey: 'message',
        header: '信息',
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground line-clamp-2'>{row.original.message || '-'}</span>
        ),
      },
    ],
    [],
  )
}
