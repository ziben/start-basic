import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/shared/lib/utils'
import { type NavigateFn } from '@/shared/hooks/use-table-url-state'
import { useUrlSyncedSorting } from '@/shared/hooks/use-url-synced-sorting'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { banned } from '../data/schema'
import { useAdminUsersListQuery } from '../hooks/use-admin-users-list-query'
import { getSingleBooleanFromArrayFilter } from '../utils/table-filters'
import { useAdminUsersColumns } from './admin-users-columns'
import { DataTableBulkActions } from './data-table-bulk-actions'

const route = getRouteApi('/admin/users')

type RouteSearch = {
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
  filter?: string
  banned?: string[]
}

export function AdminUsersTable() {
  const [rowSelection, setRowSelection] = useState({})
  const search = route.useSearch() as RouteSearch
  const routeNavigate = route.useNavigate()

  const {
    sorting,
    onSortingChange,
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useUrlSyncedSorting({
    search,
    navigate: routeNavigate as unknown as NavigateFn,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      {
        columnId: 'banned',
        searchKey: 'banned',
        type: 'array',
        serialize: (value) => value,
        deserialize: (value) => {
          if (Array.isArray(value)) return value
          if (typeof value === 'string' && value) return [value]
          return []
        },
      },
    ],
  })

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const columns = useAdminUsersColumns()

  const bannedFilter = useMemo(() => {
    return getSingleBooleanFromArrayFilter(columnFilters, 'banned')
  }, [columnFilters])

  const { data, serverPageCount, refetch, isRefetching } = useAdminUsersListQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    filter: globalFilter ?? undefined,
    sorting,
    banned: bannedFilter,
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    pageCount: serverPageCount,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const id = String(row.getValue('id')).toLowerCase()
      const name = String(row.getValue('name')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()

      return id.includes(searchValue) || name.includes(searchValue)
    },
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })
  useEffect(() => {
    ensurePageInRange(serverPageCount)
  }, [serverPageCount, ensurePageInRange])

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
    <div className={cn('max-sm:has-[div[role="toolbar"]]:mb-16', 'flex flex-1 flex-col gap-4')}>
      <DataTableToolbar
        table={table}
        searchPlaceholder='根据名称或ID过滤...'
        onReload={() => void refetch()}
        isReloading={isRefetching}
        filters={[
          {
            columnId: 'banned',
            title: '封禁',
            options: banned.map((opt) => ({
              label: opt.label,
              value: String(opt.value),
            })),
          },
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <div ref={tableContainerRef} className='max-h-[70vh] overflow-auto'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className='group/row'>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                          header.column.columnDef.meta?.className,
                          header.column.columnDef.meta?.thClassName
                        )}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows?.length ? (
                <>
                  {paddingTop > 0 ? (
                    <TableRow aria-hidden='true' className='border-0 hover:bg-transparent'>
                      <TableCell colSpan={columns.length} className='p-0' style={{ height: `${paddingTop}px` }} />
                    </TableRow>
                  ) : null}

                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index]!
                    return (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className='group/row'>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                              cell.column.columnDef.meta?.className,
                              cell.column.columnDef.meta?.tdClassName
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}

                  {paddingBottom > 0 ? (
                    <TableRow aria-hidden='true' className='border-0 hover:bg-transparent'>
                      <TableCell colSpan={columns.length} className='p-0' style={{ height: `${paddingBottom}px` }} />
                    </TableRow>
                  ) : null}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
      <DataTableBulkActions table={table} />
    </div>
  )
}





