import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import type { RowData } from '~/shared/lib/tanstack-table'
import { type Table } from '~/shared/lib/tanstack-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type DataTableViewOptionsProps<TData extends RowData> = {
  table: Table<TData>
}

export function DataTableViewOptions<TData extends RowData>({ table }: DataTableViewOptionsProps<TData>) {
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
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map((column) => {
            const title = column.columnDef.meta?.title
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
