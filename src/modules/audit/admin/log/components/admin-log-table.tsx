import { useEffect, useMemo, useRef } from 'react'
import {
  type ColumnDef,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { useTableColumnVisibility } from '@/shared/hooks/use-table-column-visibility'
import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { cn } from '@/shared/lib/utils'
import { useVirtualizer } from '@tanstack/react-virtual'
import { auditResults, logLevels, type LogType } from '~/modules/audit/shared/data/schema'
import { type AdminAuditLog, type AdminSystemLog } from '~/modules/audit/shared/hooks/use-admin-log-api'
import { DataTablePagination, DataTableToolbar, DataTable } from '@/components/data-table'
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

  const { columnVisibility, setColumnVisibility } = useTableColumnVisibility({ tableId: `admin-logs-${type}` })

  const systemColumns = useSystemLogColumns()
  const auditColumns = useAuditLogColumns()
  const columns = (type === 'system' ? systemColumns : auditColumns) as ColumnDef<AdminSystemLog | AdminAuditLog>[]

  const level = useMemo(
    () => getSingleStringFromArrayFilter(columnFilters, 'level') as 'debug' | 'info' | 'warn' | 'error' | undefined,
    [columnFilters]
  )

  const success = useMemo(() => getSingleBooleanFromArrayFilter(columnFilters, 'success'), [columnFilters])

  const { data, serverPageCount, refetch, isRefetching, isLoading, error } = useAdminLogsQuery({
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

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 44,
    overscan: 10,
  })

  return (
    <div className={cn('max-sm:has-[div[role="toolbar"]]:mb-16', 'flex h-full flex-col space-y-4')}>
      <div className='flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/25 px-3 py-2 text-xs text-muted-foreground'>
        <span>
          当前视图：
          <span className='ml-1 font-medium text-foreground'>{type === 'system' ? '系统日志' : '操作审计'}</span>
        </span>
        <span>
          已加载 {data?.length ?? 0} 条，分页 {serverPageCount || 1} 页{isRefetching ? '，正在刷新' : ''}
        </span>
      </div>
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
        errorState={error ? String(error) : undefined}
        containerRef={tableContainerRef}
        rowVirtualizer={rowVirtualizer}
        containerClassName='min-h-0 flex-1'
      />
      <DataTablePagination table={table} />
    </div>
  )
}
