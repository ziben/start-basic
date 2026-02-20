import { useEffect, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import { cn } from '@/shared/lib/utils'
import { DataTablePagination, DataTableToolbar, DataTable } from '@/components/data-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { CATEGORY_OPTIONS, VALUE_TYPE_OPTIONS, type SystemConfig } from '../data/schema'
import { useSystemConfigColumns } from './system-config-columns'

type Props = {
  readonly data: SystemConfig[]
  readonly isLoading: boolean
  readonly search?: Record<string, unknown>
  readonly navigate?: NavigateFn
}

export function SystemConfigTable({ data, isLoading, search, navigate }: Props): React.ReactElement {
  const columns = useSystemConfigColumns()
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({})

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: search ?? {},
    navigate: navigate ?? (() => { }),
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'category', searchKey: 'category', type: 'array' },
      { columnId: 'valueType', searchKey: 'valueType', type: 'array' },
    ],
  })

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange',
    state: {
      columnVisibility,
      rowSelection: {},
      columnFilters,
      globalFilter,
      pagination,
      columnSizing,
    },
    enableRowSelection: false,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    globalFilterFn: (row, _columnId, filterValue) => {
      const key = String(row.getValue('key')).toLowerCase()
      const category = String(row.getValue('category')).toLowerCase()
      const q = String(filterValue).toLowerCase()
      return key.includes(q) || category.includes(q)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table.getPageCount(), ensurePageInRange])

  const rows = table.getRowModel().rows
  return (
    <div className='space-y-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='搜索 key / 分类…'
        filters={[
          {
            columnId: 'category',
            title: '分类',
            options: [...CATEGORY_OPTIONS],
          },
          {
            columnId: 'valueType',
            title: '类型',
            options: [...VALUE_TYPE_OPTIONS],
          },
        ]}
      />
      <DataTable
        table={table}
        columnsLength={columns.length}
        isLoading={isLoading}
        skeletonCount={8}
        emptyState='暂无数据'
      />
      <DataTablePagination table={table} />
    </div>
  )
}
