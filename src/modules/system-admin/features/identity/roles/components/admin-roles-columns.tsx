import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Shield, Settings2, Trash2, LayoutGrid } from 'lucide-react'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { cn, formatDate } from '@/shared/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTableColumnHeader } from '@/components/data-table'
import { type SystemRole } from '../data/schema'
import { useRolesContext } from '../context/roles-context'

export function useAdminRolesColumns(): ColumnDef<SystemRole>[] {
  const { t } = useTranslation()
  const { setOpen, setCurrentRow } = useRolesContext()

  return useMemo(
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
      },
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='角色编码' />,
        cell: ({ row }) => <div className='font-mono'>{row.getValue('name')}</div>,
      },
      {
        accessorKey: 'label',
        header: ({ column }) => <DataTableColumnHeader column={column} title='显示名称' />,
        cell: ({ row }) => {
          const isSystem = row.original.isSystem
          return (
            <div className='flex items-center gap-2'>
              <span className='font-medium'>{row.getValue('label')}</span>
              {isSystem && (
                <Badge variant='secondary' className='h-5 px-1.5 text-[10px] uppercase'>
                  系统
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'description',
        header: ({ column }) => <DataTableColumnHeader column={column} title='描述' />,
        cell: ({ row }) => <div className='max-w-[300px] truncate text-muted-foreground'>{row.getValue('description') || '-'}</div>,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='创建时间' />,
        cell: ({ row }) => <div className='text-muted-foreground'>{formatDate(row.getValue('createdAt'))}</div>,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const role = row.original
          return (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-40'>
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setCurrentRow(role)
                    setOpen('update')
                  }}
                >
                  <Settings2 className='mr-2 h-4 w-4' />
                  编辑角色
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setCurrentRow(role)
                    setOpen('assign')
                  }}
                >
                  <LayoutGrid className='mr-2 h-4 w-4' />
                  分配导航
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={role.isSystem}
                  className='text-destructive focus:bg-destructive/10 focus:text-destructive'
                  onClick={() => {
                    setCurrentRow(role)
                    setOpen('delete')
                  }}
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  删除角色
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [t, setOpen, setCurrentRow]
  )
}
