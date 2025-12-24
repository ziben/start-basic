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
import { cn } from '~/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { banned, type AdminUsers } from '../data/schema'
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

// Helper function to build query key
function buildUsersQueryKey(pageIndex: number, pageSize: number, filter: string, sorting: SortingState, banned?: boolean) {
  return ['admin-users', { pageIndex, pageSize, filter, sorting, banned }]
}

// Helper function to build query params
function buildQueryParams(
  pageIndex: number,
  pageSize: number,
  filter: string | undefined,
  sorting: SortingState,
  banned?: boolean
) {
  const firstSort = sorting[0]
  return {
    page: pageIndex + 1,
    pageSize,
    filter: filter || undefined,
    banned,
    sortBy: firstSort?.id,
    sortDir: firstSort?.id ? ((firstSort.desc ? 'desc' : 'asc') as 'asc' | 'desc') : undefined,
  }
}

export function AdminUsersTable() {
  const [rowSelection, setRowSelection] = useState({})
  const search = route.useSearch() as RouteSearch
  const routeNavigate = route.useNavigate()
  const queryClient = useQueryClient()

  const initialSorting = useMemo<SortingState>(() => {
    const { sortBy, sortDir } = search
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

  const bannedFilter = useMemo<boolean | undefined>(() => {
    const raw = columnFilters.find((f) => f.id === 'banned')?.value
    if (!Array.isArray(raw)) return undefined

    const values = raw.filter((v) => typeof v === 'string') as string[]
    if (values.length !== 1) return undefined
    if (values[0] === 'true') return true
    if (values[0] === 'false') return false
    return undefined
  }, [columnFilters])

  const usersQueryKey = useMemo(
    () => buildUsersQueryKey(pagination.pageIndex, pagination.pageSize, globalFilter ?? '', sorting, bannedFilter),
    [pagination.pageIndex, pagination.pageSize, globalFilter, sorting, bannedFilter]
  )

  const queryParams = useMemo(
    () => buildQueryParams(pagination.pageIndex, pagination.pageSize, globalFilter, sorting, bannedFilter),
    [pagination.pageIndex, pagination.pageSize, globalFilter, sorting, bannedFilter]
  )

  const {
    data: pageData,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: usersQueryKey,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      return await apiClient.users.list({ ...queryParams, signal })
    },
  })

  useEffect(() => {
    if (!pageData) return
    const nextPageIndex = pagination.pageIndex + 1
    if (nextPageIndex >= pageData.pageCount) return

    const nextQueryKey = buildUsersQueryKey(nextPageIndex, pagination.pageSize, globalFilter ?? '', sorting, bannedFilter)
    const nextQueryParams = buildQueryParams(nextPageIndex, pagination.pageSize, globalFilter, sorting, bannedFilter)

    void queryClient.prefetchQuery({
      queryKey: nextQueryKey,
      queryFn: async ({ signal }) => {
        return await apiClient.users.list({ ...nextQueryParams, signal })
      },
    })
  }, [pageData, pagination.pageIndex, pagination.pageSize, globalFilter, sorting, bannedFilter, queryClient])

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

      routeNavigate({
        search: (prev: RouteSearch) => ({
          ...prev,
          page: undefined,
          sortBy: firstSort?.id ? firstSort.id : undefined,
          sortDir,
        }),
      } as never)

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
