import { useEffect, useState } from 'react'
import { AdminDataTable } from '@/modules/admin/shared/components/admin-data-table'
import { useTableColumnVisibility } from '@/shared/hooks/use-table-column-visibility'
import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { cn } from '@/shared/lib/utils'
import { dataTableFeatures, tableFeatures } from '~/shared/lib/tanstack-table'
import {
  flexRender,
  createFilteredRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createPaginatedRowModel,
  createSortedRowModel,
  useTable,
  type VisibilityState,
} from '~/shared/lib/tanstack-table'
import { CATEGORY_OPTIONS, VALUE_TYPE_OPTIONS, type SystemConfig } from '../data/schema'
import { useSystemConfigColumns } from './system-config-columns'

const features = tableFeatures({
  ...dataTableFeatures,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
})

type Props = {
  readonly data: SystemConfig[]
  readonly isLoading: boolean
  readonly errorState?: React.ReactNode
  readonly onReload?: () => void
  readonly isReloading?: boolean
  readonly search?: Record<string, unknown>
  readonly navigate?: NavigateFn
}

export function SystemConfigTable({
  data,
  isLoading,
  errorState,
  onReload,
  isReloading,
  search,
  navigate,
}: Props): React.ReactElement {
  const columns = useSystemConfigColumns()
  const { columnVisibility, setColumnVisibility } = useTableColumnVisibility({ tableId: 'admin-sysconfig' })
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
    navigate: navigate ?? (() => {}),
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'category', searchKey: 'category', type: 'array' },
      { columnId: 'valueType', searchKey: 'valueType', type: 'array' },
    ],
  })

  const table = useTable({
    features,
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
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })

  const pageCount = table.getPageCount()
  useEffect(() => {
    if (!isLoading && !errorState) ensurePageInRange(Math.max(1, pageCount))
  }, [isLoading, errorState, ensurePageInRange, pageCount])

  return (
    <AdminDataTable
      table={table}
      columnsLength={columns.length}
      isLoading={isLoading}
      errorState={errorState}
      onReload={onReload}
      isReloading={isReloading}
      skeletonCount={8}
      emptyState='暂无数据'
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
  )
}
