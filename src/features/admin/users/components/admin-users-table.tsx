import React, { useEffect, useMemo, useRef, useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { apiClient } from '~/lib/api-client'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { type AdminUsers } from '../data/schema'
import { useAdminUsersColumns } from './admin-users-columns'
import { DataTableBulkActions } from './data-table-bulk-actions'

const route = getRouteApi('/admin/users')

export function AdminUsersTable() {
  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const search = route.useSearch()
  const routeNavigate = route.useNavigate()
  const queryClient = useQueryClient()

  const initialSorting = useMemo<SortingState>(() => {
    const sortBy = (search as Record<string, unknown>).sortBy
    const sortDir = (search as Record<string, unknown>).sortDir
    if (typeof sortBy !== 'string' || !sortBy) return []
    return [{ id: sortBy, desc: sortDir === 'desc' }]
  }, [search])

  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const columns = useAdminUsersColumns()

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate: routeNavigate as unknown as NavigateFn,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
  })

  const usersQueryKey = useMemo(() => {
    return ['admin-users', pagination.pageIndex, pagination.pageSize, globalFilter ?? '', sorting]
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, sorting])

  const { data: pageData } = useQuery({
    queryKey: usersQueryKey,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const firstSort = sorting[0]
      return await apiClient.users.list({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        filter: globalFilter ? globalFilter : undefined,
        sortBy: firstSort?.id,
        sortDir: firstSort?.id ? (firstSort.desc ? 'desc' : 'asc') : undefined,
        signal,
      })
    },
  })

  useEffect(() => {
    if (!pageData) return
    const nextPageIndex = pagination.pageIndex + 1
    if (nextPageIndex >= pageData.pageCount) return

    const nextQueryKey = ['admin-users', nextPageIndex, pagination.pageSize, globalFilter ?? '', sorting]

    void queryClient.prefetchQuery({
      queryKey: nextQueryKey,
      queryFn: async ({ signal }) => {
        const firstSort = sorting[0]
        return await apiClient.users.list({
          page: nextPageIndex + 1,
          pageSize: pagination.pageSize,
          filter: globalFilter ? globalFilter : undefined,
          sortBy: firstSort?.id,
          sortDir: firstSort?.id ? (firstSort.desc ? 'desc' : 'asc') : undefined,
          signal,
        })
      },
    })
  }, [pageData, pagination.pageIndex, pagination.pageSize, globalFilter, sorting, queryClient])

  const data: AdminUsers[] = pageData?.items ?? []
  const serverPageCount = pageData?.pageCount ?? 0

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
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(next)

      const firstSort = next[0]
      let sortDir: 'asc' | 'desc' | undefined = undefined
      if (firstSort?.id) {
        sortDir = firstSort.desc ? 'desc' : 'asc'
      }

      ;(routeNavigate as any)({
        search: (prev: any) => ({
          ...prev,
          page: undefined,
          sortBy: firstSort?.id ? firstSort.id : undefined,
          sortDir,
        }),
      })

      onPaginationChange((prev) => ({
        ...prev,
        pageIndex: 0,
      }))
    },
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
    <div className='space-y-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar table={table} searchPlaceholder='Filter by name or ID...' filters={[]} />
      <div className='overflow-hidden rounded-md border'>
        <div ref={tableContainerRef} className='max-h-[70vh] overflow-auto'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
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
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
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
      <DataTablePagination table={table} />
      <DataTableBulkActions table={table} />
    </div>
  )
}
