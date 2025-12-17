import { useEffect, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { priorities, statuses } from '../data/data'
import { type Task } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { tasksColumns as columns } from './tasks-columns'
import { apiClient } from '~/lib/api-client'

const route = getRouteApi('/_authenticated/demo/tasks/')

export function TasksTable() {
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

  // Local state management for table (uncomment to use local-only state, not synced with URL)
  // const [globalFilter, onGlobalFilterChange] = useState('')
  // const [columnFilters, onColumnFiltersChange] = useState<ColumnFiltersState>([])
  // const [pagination, onPaginationChange] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  // Synced with URL states (updated to match route search schema defaults)
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
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'priority', searchKey: 'priority', type: 'array' },
    ],
  })

  const tasksQueryKey = useMemo(() => {
    return [
      'demo-tasks',
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter ?? '',
      columnFilters,
      sorting,
    ]
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, columnFilters, sorting])

  const { data: pageData } = useQuery({
    queryKey: tasksQueryKey,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const statusFilter = columnFilters.find((f) => f.id === 'status')
      const priorityFilter = columnFilters.find((f) => f.id === 'priority')
      const firstSort = sorting[0]

      return await apiClient.demoTasks.list({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        filter: globalFilter ? globalFilter : undefined,
        status: Array.isArray(statusFilter?.value)
          ? statusFilter!.value.map((v) => String(v))
          : undefined,
        priority: Array.isArray(priorityFilter?.value)
          ? priorityFilter!.value.map((v) => String(v))
          : undefined,
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

    const nextQueryKey = [
      'demo-tasks',
      nextPageIndex,
      pagination.pageSize,
      globalFilter ?? '',
      columnFilters,
      sorting,
    ]

    void queryClient.prefetchQuery({
      queryKey: nextQueryKey,
      queryFn: async ({ signal }) => {
        const statusFilter = columnFilters.find((f) => f.id === 'status')
        const priorityFilter = columnFilters.find((f) => f.id === 'priority')
        const firstSort = sorting[0]

        return await apiClient.demoTasks.list({
          page: nextPageIndex + 1,
          pageSize: pagination.pageSize,
          filter: globalFilter ? globalFilter : undefined,
          status: Array.isArray(statusFilter?.value)
            ? statusFilter!.value.map((v) => String(v))
            : undefined,
          priority: Array.isArray(priorityFilter?.value)
            ? priorityFilter!.value.map((v) => String(v))
            : undefined,
          sortBy: firstSort?.id,
          sortDir: firstSort?.id
            ? firstSort.desc
              ? 'desc'
              : 'asc'
            : undefined,
          signal,
        })
      },
    })
  }, [
    pageData,
    pagination.pageIndex,
    pagination.pageSize,
    globalFilter,
    columnFilters,
    sorting,
    queryClient,
  ])

  const data: Task[] = pageData?.items ?? []
  const serverPageCount = pageData?.pageCount ?? 0

  // eslint-disable-next-line react-hooks/incompatible-library
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
      const title = String(row.getValue('title')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()

      return id.includes(searchValue) || title.includes(searchValue)
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

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16', // Add margin bottom to the table on mobile when the toolbar is visible
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter by title or ID...'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: statuses,
          },
          {
            columnId: 'priority',
            title: 'Priority',
            options: priorities,
          },
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(header.column.columnDef.meta?.className, header.column.columnDef.meta?.thClassName)}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cell.column.columnDef.meta?.className, cell.column.columnDef.meta?.tdClassName)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
      <DataTablePagination table={table} className='mt-auto' />
      <DataTableBulkActions table={table} />
    </div>
  )
}
