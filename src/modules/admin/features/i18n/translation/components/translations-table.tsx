import { useEffect, useRef, useState } from 'react'
import {
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Translation } from '~/modules/admin/features/i18n/translation/types/translation'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { DataTable, DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { useTranslationColumns } from './translations-columns'

type DataTableProps = {
  data: Translation[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function TranslationsTable({ data, search, navigate }: DataTableProps) {
  const { t } = useTranslation()
  const columns = useTranslationColumns()
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

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
      { columnId: 'key', searchKey: 'key', type: 'string' },
      { columnId: 'description', searchKey: 'description', type: 'string' },
    ],
  })

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
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const key = String(row.getValue('key')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()

      return key.includes(searchValue)
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

  const pageCount = table.getPageCount()
  useEffect(() => {
    ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange])

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
    <div className='flex min-h-0 flex-1 flex-col gap-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder={t('admin.translation.searchPlaceholder')}
        filters={[
          {
            columnId: 'locale',
            title: t('admin.translation.columns.locale'),
            options: [
              { label: '简体中文', value: 'zh' },
              { label: 'English', value: 'en' },
            ],
          },
        ]}
      />
      <DataTable
        table={table}
        columnsLength={columns.length}
        skeletonCount={pagination.pageSize}
        containerRef={tableContainerRef}
        rowVirtualizer={rowVirtualizer}
        emptyState={t('admin.common.noData')}
        containerClassName='min-h-0 flex-1'
      />
      <DataTablePagination table={table} />
      <DataTableBulkActions table={table} />
    </div>
  )
}






