import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { cn } from '@/shared/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTablePagination, DataTableToolbar, DataTable } from '@/components/data-table'
import { banned } from '../data/schema'
import { useAdminUsersListQuery } from '../hooks/use-admin-users-list-query'
import { getSingleBooleanFromArrayFilter } from '../utils/table-filters'
import { useAdminUsersColumns } from './admin-users-columns'
import { DataTableBulkActions } from './data-table-bulk-actions'

type AdminUsersTableProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function AdminUsersTable({ search, navigate }: AdminUsersTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const { t } = useTranslation()

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
    navigate,
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

  const { data, serverPageCount, refetch, isRefetching, pageData } = useAdminUsersListQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    filter: globalFilter ?? undefined,
    sorting: [],
    banned: bannedFilter,
  })

  const isLoading = !pageData && !data.length

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      rowSelection,
      columnFilters,
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
    <div className={cn('max-sm:has-[div[role="toolbar"]]:mb-16', 'space-y-4')}>
      <DataTableToolbar
        table={table}
        searchPlaceholder={t('admin.user.table.searchPlaceholder')}
        onReload={() => void refetch()}
        isReloading={isRefetching}
        filters={[
          {
            columnId: 'banned',
            title: t('admin.user.filter.banned'),
            options: banned.map((opt) => ({
              label: t(opt.labelKey),
              value: String(opt.value),
            })),
          },
        ]}
      />
      <DataTable
        table={table}
        columnsLength={columns.length}
        isLoading={isLoading}
        skeletonCount={pagination.pageSize}
        containerRef={tableContainerRef}
        rowVirtualizer={rowVirtualizer}
        emptyState={t('common.noResults')}
      />
      <DataTablePagination table={table} />
      <DataTableBulkActions table={table} />
    </div>
  )
}
