import { useEffect, useMemo, useState } from 'react'
import {
  type ColumnDef,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/shared/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTablePagination, DataTableToolbar, DataTable } from '@/components/data-table'
import { type AdminAuditLog, type AdminSystemLog } from '~/modules/admin/shared/hooks/use-admin-log-api'
import { auditResults, logLevels, type LogType } from '../data/schema'
import { useAdminLogsQuery } from '../hooks/use-admin-logs-query'
import { getSingleBooleanFromArrayFilter, getSingleStringFromArrayFilter } from '../utils/table-filters'
import { useAuditLogColumns, useSystemLogColumns } from './admin-log-columns'

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminLogTableProps = {
  type: LogType
  search: Record<string, unknown>
  navigate: NavigateFn
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminLogTable({ type, search, navigate }: AdminLogTableProps) {
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
        columnId: 'level',
        searchKey: 'level',
        type: 'array',
        serialize: (value) => value as string[],
        deserialize: (value) => {
          if (Array.isArray(value)) return value as string[]
          if (typeof value === 'string' && value) return [value]
          return []
        },
      },
      {
        columnId: 'success',
        searchKey: 'success',
        type: 'array',
        serialize: (value) => value as string[],
        deserialize: (value) => {
          if (Array.isArray(value)) return value as string[]
          if (typeof value === 'string' && value) return [value]
          return []
        },
      },
    ],
  })

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const systemColumns = useSystemLogColumns()
  const auditColumns = useAuditLogColumns()
  const columns = (type === 'system' ? systemColumns : auditColumns) as ColumnDef<
    AdminSystemLog | AdminAuditLog
  >[]

  const level = useMemo(
    () =>
      getSingleStringFromArrayFilter(columnFilters, 'level') as
      | 'debug'
      | 'info'
      | 'warn'
      | 'error'
      | undefined,
    [columnFilters],
  )

  const success = useMemo(() => getSingleBooleanFromArrayFilter(columnFilters, 'success'), [columnFilters])

  const { data, serverPageCount, refetch, isRefetching, isLoading } = useAdminLogsQuery({
    type,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    filter: globalFilter ?? undefined,
    sorting: [],
    level,
    success,
  })

  const table = useReactTable<AdminSystemLog | AdminAuditLog>({
    data: (data ?? []) as (AdminSystemLog | AdminAuditLog)[],
    columns,
    state: {
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination,
    },
    pageCount: serverPageCount,
    manualPagination: true,
    manualFiltering: true,
    autoResetPageIndex: false,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    ensurePageInRange(serverPageCount)
  }, [serverPageCount, ensurePageInRange])

  const rows = table.getRowModel().rows

  return (
    <div className={cn('max-sm:has-[div[role="toolbar"]]:mb-16', 'space-y-4')}>
      <DataTableToolbar
        table={table}
        searchPlaceholder='搜索…'
        onReload={() => void refetch()}
        isReloading={isRefetching}
        filters={
          type === 'system'
            ? [
              {
                columnId: 'level',
                title: '级别',
                options: logLevels.map((o) => ({ label: o.label, value: o.value })),
              },
            ]
            : [
              {
                columnId: 'success',
                title: '结果',
                options: auditResults.map((o) => ({ label: o.label, value: o.value })),
              },
            ]
        }
      />
      <DataTable
        table={table}
        columnsLength={columns.length}
        isLoading={isLoading}
        skeletonCount={pagination.pageSize}
        emptyState='暂无数据'
      />
      <DataTablePagination table={table} />
    </div>
  )
}
