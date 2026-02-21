import { DataTable, DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { getRouteApi } from '@tanstack/react-router'
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
import { useEffect, useState } from 'react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { type AdminNavgroup } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { useNavGroupColumns } from './navgroups-columns'

const route = getRouteApi('/_authenticated/admin/navigation')

type DataTableProps = {
  data: AdminNavgroup[]
  search?: Record<string, unknown>
  navigate?: NavigateFn
  onReload?: () => void
  isReloading?: boolean
}

function NavGroupsTableInner({ data, search, navigate, onReload, isReloading }: DataTableProps) {
  const { t } = useTranslation()
  const columns = useNavGroupColumns()
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
    search: search as any,
    navigate: navigate as any,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'title', searchKey: 'title', type: 'string' },
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
      const id = String(row.getValue('id')).toLowerCase()
      const title = String(row.getValue('title')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()

      return id.includes(searchValue) || title.includes(searchValue)
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
    ensurePageInRange?.(pageCount)
  }, [pageCount, ensurePageInRange])

  const rows = table.getRowModel().rows

  return (
    <div className='space-y-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder={t('admin.navgroup.table.searchPlaceholder')}
        onReload={onReload}
        isReloading={isReloading}
        filters={[
          {
            columnId: 'scope',
            title: '范围',
            options: [{ label: 'APP', value: 'APP' }, { label: 'ADMIN', value: 'ADMIN' }],
          },
        ]}
      />
      <DataTable
        table={table}
        columnsLength={columns.length}
        emptyState={t('admin.common.noData')}
      />
      <DataTablePagination table={table} />
      <DataTableBulkActions table={table} />
    </div>
  )
}

export function NavGroupsTable({ data, search, navigate, onReload, isReloading }: DataTableProps) {
  const resolvedSearch = search ?? route.useSearch()
  const resolvedNavigate = navigate ?? route.useNavigate()

  return (
    <NavGroupsTableInner
      data={data}
      search={resolvedSearch}
      navigate={resolvedNavigate}
      onReload={onReload}
      isReloading={isReloading}
    />
  )
}






