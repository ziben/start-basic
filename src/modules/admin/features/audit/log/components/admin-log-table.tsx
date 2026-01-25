import { useEffect, useMemo, useState } from 'react'
import { type ColumnDef, type VisibilityState, flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, useReactTable } from '@tanstack/react-table'
import { cn } from '@/shared/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { type AdminAuditLog, type AdminSystemLog } from '~/modules/admin/shared/hooks/use-admin-log-api'
import { auditResults, logLevels } from '../data/schema'
import { useAdminLogsQuery } from '../hooks/use-admin-logs-query'
import { getSingleBooleanFromArrayFilter, getSingleStringFromArrayFilter } from '../utils/table-filters'
import { useAuditLogColumns, useSystemLogColumns } from './admin-log-columns'

type AdminLogTableProps = {
  type: 'system' | 'audit'
  search: Record<string, unknown>
  navigate: NavigateFn
}

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
  const columns = type === 'system' ? systemColumns : auditColumns

  const level = useMemo(() => {
    return getSingleStringFromArrayFilter(columnFilters, 'level') as
      | 'debug'
      | 'info'
      | 'warn'
      | 'error'
      | undefined
  }, [columnFilters])

  const success = useMemo(() => {
    return getSingleBooleanFromArrayFilter(columnFilters, 'success')
  }, [columnFilters])

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
    columns: columns as ColumnDef<AdminSystemLog | AdminAuditLog>[],
    state: {
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination,
    },
    pageCount: serverPageCount,
    manualPagination: true,
    manualFiltering: true,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    autoResetPageIndex: false,
  })

  useEffect(() => {
    ensurePageInRange(serverPageCount)
  }, [serverPageCount, ensurePageInRange])

  return (
    <div className='flex h-full flex-col space-y-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='搜索...'
        onReload={() => void refetch()}
        isReloading={isRefetching}
        filters={
          type === 'system'
            ? [
                {
                  columnId: 'level',
                  title: '级别',
                  options: logLevels.map((opt: { label: string; value: string }) => ({
                    label: opt.label,
                    value: opt.value,
                  })),
                },
              ]
            : [
                {
                  columnId: 'success',
                  title: '结果',
                  options: auditResults.map((opt: { label: string; value: string }) => ({
                    label: opt.label,
                    value: opt.value,
                  })),
                },
              ]
        }
      />
      <div className='min-h-0 flex-1 overflow-hidden rounded-md border'>
        <div className='h-full overflow-auto'>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    加载中...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className='group/row'>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'bg-background group-hover/row:bg-muted',
                          cell.column.columnDef.meta?.className,
                          cell.column.columnDef.meta?.tdClassName
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
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
      <DataTablePagination key={`${pagination.pageIndex}-${serverPageCount}`} table={table} className='mt-auto' />
    </div>
  )
}






