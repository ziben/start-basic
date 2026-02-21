import { useState, useRef, useEffect } from 'react'
import {
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/shared/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { DataTable, DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useMembersListQuery } from '../hooks/use-members-list-query'
import { useMembersColumns } from './members-columns'
import { MembersBulkActions } from './members-bulk-actions'
import { useTableColumnVisibility } from '@/shared/hooks/use-table-column-visibility'
type MembersTableProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function MembersTable({ search, navigate }: MembersTableProps) {
  const [rowSelection, setRowSelection] = useState({})

  const { globalFilter, onGlobalFilterChange, pagination, onPaginationChange, ensurePageInRange } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [],
  })

  const { columnVisibility, setColumnVisibility } = useTableColumnVisibility({ tableId: 'admin-members' })

  const columns = useMembersColumns()

  const { data, serverPageCount, isLoading, refetch, isRefetching } = useMembersListQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    filter: globalFilter ?? undefined,
    organizationId: search.organizationId as string | undefined,
    sorting: [],
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
    pageCount: serverPageCount,
    manualPagination: true,
    manualFiltering: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const username = String(row.getValue('username')).toLowerCase()
      const email = String(row.original.email).toLowerCase()
      const orgName = String(row.getValue('organizationName')).toLowerCase()
      const role = String(row.getValue('role')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()

      return (
        username.includes(searchValue) ||
        email.includes(searchValue) ||
        orgName.includes(searchValue) ||
        role.includes(searchValue)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
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
        searchPlaceholder='按用户名、邮箱、组织或角色搜索...'
        onReload={() => void refetch()}
        isReloading={isRefetching}
      />
      <DataTable
        table={table}
        columnsLength={columns.length}
        isLoading={isLoading}
        skeletonCount={pagination.pageSize}
        containerRef={tableContainerRef}
        rowVirtualizer={rowVirtualizer}
        emptyState='暂无数据'
      />
      <DataTablePagination table={table} className='mt-auto' />
      <MembersBulkActions table={table} />
    </div>
  )
}
