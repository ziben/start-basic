import { useEffect, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/shared/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useRoles } from '~/modules/system-admin/shared/hooks/use-role-api'
import { useRolesContext } from '../context/roles-context'
import { useAdminRolesColumns } from './admin-roles-columns'

export function AdminRolesTable() {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const { tableUrl } = useRolesContext()
  const columns = useAdminRolesColumns()

  const { data, isLoading, refetch, isRefetching } = useRoles({
    page: tableUrl.pagination.pageIndex + 1,
    pageSize: tableUrl.pagination.pageSize,
    filter: tableUrl.globalFilter,
  })

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: {
      sorting: tableUrl.sorting,
      columnVisibility,
      rowSelection,
      columnFilters: tableUrl.columnFilters,
      globalFilter: tableUrl.globalFilter,
      pagination: tableUrl.pagination,
    },
    pageCount: data?.pageCount ?? 0,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: tableUrl.onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange: tableUrl.onPaginationChange,
    onGlobalFilterChange: tableUrl.onGlobalFilterChange,
    onColumnFiltersChange: tableUrl.onColumnFiltersChange,
  })

  useEffect(() => {
    tableUrl.ensurePageInRange(data?.pageCount ?? 0)
  }, [data?.pageCount, tableUrl])

  const rows = table.getRowModel().rows
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 44,
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0
  const paddingBottom =
    virtualRows.length > 0 ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end : 0

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='搜索角色名称或编码...'
        onReload={() => void refetch()}
        isReloading={isRefetching}
      />
      <div className='overflow-hidden rounded-md border'>
        <div ref={tableContainerRef} className='max-h-[70vh] overflow-auto'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className='group/row'>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        header.column.columnDef.meta?.className
                      )}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    加载中...
                  </TableCell>
                </TableRow>
              ) : rows?.length ? (
                <>
                  {paddingTop > 0 && (
                    <TableRow className='border-0 hover:bg-transparent'>
                      <TableCell colSpan={columns.length} style={{ height: `${paddingTop}px` }} />
                    </TableRow>
                  )}
                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index]!
                    return (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className='group/row'>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                              cell.column.columnDef.meta?.className
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                  {paddingBottom > 0 && (
                    <TableRow className='border-0 hover:bg-transparent'>
                      <TableCell colSpan={columns.length} style={{ height: `${paddingBottom}px` }} />
                    </TableRow>
                  )}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}
