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
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const hasAccessorKey = (def: any): def is { accessorKey: string } => typeof def.accessorKey === 'string'

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='ms-auto hidden h-8 lg:flex'>
          <MixerHorizontalIcon className='size-4' />
          查看
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[150px]'>
        <DropdownMenuLabel>切换列</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              (typeof column.accessorFn !== 'undefined' || hasAccessorKey(column.columnDef)) && column.getCanHide()
          )
          .map((column) => {
            const title = (column.columnDef.meta as any)?.title as string | undefined
            const isVisible = column.getIsVisible()
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className='capitalize'
                checked={isVisible}
                onCheckedChange={(checked) => column.toggleVisibility(checked)}
              >
                {title ?? column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// export const DataTableViewOptions = memo(DataTableViewOptionsInner) as typeof DataTableViewOptionsInner

