import { Table } from '@tanstack/react-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  return (
    <div className='flex items-center justify-between overflow-clip px-2' style={{ overflowClipMargin: 1 }}>
      <div className='text-muted-foreground hidden flex-1 text-sm sm:block'>
        {table.getFilteredSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length} 已选
      </div>
      <div className='flex items-center sm:space-x-6 lg:space-x-8'>
        <div className='flex items-center space-x-2'>
          <p className='hidden text-sm font-medium sm:block'>每页行数</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
          第 {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} 页
        </div>
        <div className='flex items-center space-x-2'>
          <button
            className='border rounded px-2 py-1 disabled:opacity-50'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一页
          </button>
          <button
            className='border rounded px-2 py-1 disabled:opacity-50'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
} 