import { memo } from 'react'
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

type DataTableViewOptionsProps<TData> = {
  table: Table<TData>
  columnVisibility: Record<string, boolean>
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void
}

function DataTableViewOptionsInner<TData>({ table, columnVisibility, onColumnVisibilityChange }: DataTableViewOptionsProps<TData>) {
  const hasAccessorKey = (def: any): def is { accessorKey: string } => typeof def.accessorKey === 'string'

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='ms-auto hidden h-8 lg:flex'>
          <MixerHorizontalIcon className='size-4' />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[150px]'>
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              (typeof column.accessorFn !== 'undefined' || hasAccessorKey(column.columnDef)) &&
              column.getCanHide()
          )
          .map((column) => {
            const title = (column.columnDef.meta as any)?.title as string | undefined
            const isVisible = columnVisibility[column.id] ?? true
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className='capitalize'
                checked={isVisible}
                onCheckedChange={(checked) =>
                  onColumnVisibilityChange({ ...columnVisibility, [column.id]: Boolean(checked) })
                }
              >
                {title ?? column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const DataTableViewOptions = memo(DataTableViewOptionsInner) as typeof DataTableViewOptionsInner
