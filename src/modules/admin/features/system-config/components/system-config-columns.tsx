import { type ColumnDef } from '@tanstack/react-table'
import { History, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTableColumnHeader } from '@/components/data-table'
import type { SystemConfig } from '../data/schema'
import { maskConfigValue } from '../utils/value-parser'
import { useSystemConfigContext } from './system-config-provider'

// ─── Row Actions ──────────────────────────────────────────────────────────────

function RowActions({ row }: { row: { original: SystemConfig } }): React.ReactElement {
  const { setOpen, setCurrentRow } = useSystemConfigContext()

  const openEdit = (): void => {
    setCurrentRow(row.original)
    setOpen('edit')
  }

  const openHistory = (): void => {
    setCurrentRow(row.original)
    setOpen('history')
  }

  const openDelete = (): void => {
    setCurrentRow(row.original)
    setOpen('delete')
  }

  return (
    <div className='flex items-center justify-end gap-1'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='ghost' size='icon' className='h-8 w-8' onClick={openEdit}>
            <Pencil className='h-4 w-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent>编辑</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='ghost' size='icon' className='h-8 w-8' onClick={openHistory}>
            <History className='h-4 w-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent>变更历史</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive'
            onClick={openDelete}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent>删除</TooltipContent>
      </Tooltip>
    </div>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export function useSystemConfigColumns(): ColumnDef<SystemConfig>[] {
  return [
    {
      accessorKey: 'key',
      size: 280,
      minSize: 160,
      enableResizing: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title='Key' />,
      cell: ({ row }) => {
        const value = row.getValue<string>('key')
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='block w-full cursor-default truncate font-mono text-xs'>{value}</span>
            </TooltipTrigger>
            <TooltipContent side='bottom' className='max-w-[480px] break-all font-mono text-xs'>
              {value}
            </TooltipContent>
          </Tooltip>
        )
      },
      enableHiding: false,
      meta: { title: 'Key' },
    },
    {
      accessorKey: 'category',
      size: 120,
      header: ({ column }) => <DataTableColumnHeader column={column} title='分类' />,
      cell: ({ row }) => (
        <span className='whitespace-nowrap capitalize'>{row.getValue('category')}</span>
      ),
      filterFn: (row, _id, filterValues: string[]) =>
        filterValues.includes((row.getValue<string>('category') ?? '').toLowerCase()),
      meta: { title: '分类' },
    },
    {
      accessorKey: 'valueType',
      size: 120,
      header: ({ column }) => <DataTableColumnHeader column={column} title='类型' />,
      cell: ({ row }) => (
        <Badge variant='outline' className='whitespace-nowrap font-mono text-xs'>
          {row.getValue('valueType')}
        </Badge>
      ),
      filterFn: (row, _id, filterValues: string[]) =>
        filterValues.includes(row.getValue('valueType')),
      meta: { title: '类型' },
    },
    {
      accessorKey: 'value',
      size: 320,
      minSize: 120,
      maxSize: 480,
      enableResizing: true,
      header: '值',
      cell: ({ row }) => {
        const { isSecret, value } = row.original
        const display = maskConfigValue(isSecret, value)
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`block w-full cursor-default truncate font-mono text-xs ${isSecret ? 'text-muted-foreground tracking-widest' : ''}`}>
                {display}
              </span>
            </TooltipTrigger>
            {!isSecret ? (
              <TooltipContent side='bottom' className='max-w-[560px] break-all font-mono text-xs'>
                {display}
              </TooltipContent>
            ) : null}
          </Tooltip>
        )
      },
      enableSorting: false,
      meta: { title: '值' },
    },
    {
      id: 'status',
      size: 148,
      header: '状态',
      cell: ({ row }) => (
        <div className='flex gap-1 whitespace-nowrap'>
          <Badge variant={row.original.isEnabled ? 'default' : 'outline'}>
            {row.original.isEnabled ? '启用' : '停用'}
          </Badge>
          <Badge variant={row.original.isPublic ? 'secondary' : 'outline'}>
            {row.original.isPublic ? '公开' : '私有'}
          </Badge>
        </div>
      ),
      enableSorting: false,
      meta: { title: '状态' },
    },
    {
      accessorKey: 'version',
      size: 64,
      header: ({ column }) => <DataTableColumnHeader column={column} title='版本' />,
      cell: ({ row }) => <span className='font-mono text-xs'>v{row.getValue('version')}</span>,
      meta: { title: '版本', className: 'text-center' },
    },
    {
      id: 'actions',
      cell: ({ row }) => <RowActions row={row} />,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      meta: { className: 'sticky right-0 bg-background text-right shadow-[-1px_0_0_0_hsl(var(--border))]' },
    },
  ]
}
