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
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { DataTable, DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useOrganizationsListQuery } from '../hooks/use-organizations-list-query'
import { useOrganizationsColumns } from './organizations-columns'
import { OrganizationsBulkActions } from './organizations-bulk-actions'
import { useTableColumnVisibility } from '@/shared/hooks/use-table-column-visibility'

type OrganizationsTableProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function OrganizationsTable({ search, navigate }: OrganizationsTableProps) {
  const { t } = useTranslation()
  const [rowSelection, setRowSelection] = useState({})

  const { globalFilter, onGlobalFilterChange, pagination, onPaginationChange, ensurePageInRange } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [],
  })

  const { columnVisibility, setColumnVisibility } = useTableColumnVisibility({ tableId: 'admin-organizations' })

  const columns = useOrganizationsColumns()

  const { data, serverPageCount, isLoading, refetch, isRefetching } = useOrganizationsListQuery({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    filter: globalFilter ?? undefined,
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
      const id = String(row.getValue('id')).toLowerCase()
      const name = String(row.getValue('name')).toLowerCase()
      const slug = String(row.getValue('slug') ?? '').toLowerCase()
      const searchValue = String(filterValue).toLowerCase()

      return id.includes(searchValue) || name.includes(searchValue) || slug.includes(searchValue)
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
        searchPlaceholder={t('admin.organization.table.searchPlaceholder')}
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
        emptyState={t('admin.common.noData')}
      />
      <DataTablePagination table={table} className='mt-auto' />
      <OrganizationsBulkActions table={table} />
    </div>
  )
}
