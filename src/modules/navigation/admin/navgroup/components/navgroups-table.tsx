import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  type NavigateFn,
  type SearchRecord,
  toTableNavigate,
  useTableUrlState,
} from '@/shared/hooks/use-table-url-state'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { type AdminNavgroup } from '~/modules/navigation/shared/navgroup/data/schema'
import { dataTableFeatures, tableFeatures } from '~/shared/lib/tanstack-table'
import {
  type VisibilityState,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  useTable,
} from '~/shared/lib/tanstack-table'
import { DataTable, DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useNavGroupColumns } from './navgroups-columns'

const features = tableFeatures({
  ...dataTableFeatures,
  paginatedRowModel: createPaginatedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
})

const route = getRouteApi('/_authenticated/admin/navigation')

type DataTableProps = {
  data: AdminNavgroup[]
  search?: SearchRecord
  navigate?: NavigateFn
  onReload?: () => void
  isReloading?: boolean
  isLoading?: boolean
  errorState?: ReactNode
}

function NavGroupsTableInner({ data, search, navigate, onReload, isReloading, isLoading, errorState }: DataTableProps) {
  const { t } = useTranslation()
  const routeSearch = route.useSearch()
  const routeNavigate = route.useNavigate()
  const columns = useNavGroupColumns()
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
    search: search ?? (routeSearch as SearchRecord),
    navigate: navigate ?? toTableNavigate(routeNavigate),
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'title', searchKey: 'title', type: 'string' },
      { columnId: 'description', searchKey: 'description', type: 'string' },
    ],
  })

  const table = useTable({
    features,
    data,
    columns,
    state: {
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: false,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const id = String(row.getValue('id')).toLowerCase()
      const title = String(row.getValue('title')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()

      return id.includes(searchValue) || title.includes(searchValue)
    },

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
    <div className='flex min-h-0 flex-1 flex-col gap-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder={t('admin.navgroup.table.searchPlaceholder')}
        onReload={onReload}
        isReloading={isReloading}
        filters={[
          {
            columnId: 'scope',
            title: '范围',
            options: [
              { label: 'APP', value: 'APP' },
              { label: 'ADMIN', value: 'ADMIN' },
            ],
          },
        ]}
      />
      <DataTable
        table={table}
        columnsLength={columns.length}
        isLoading={isLoading}
        errorState={errorState}
        emptyState={t('admin.common.noData')}
        containerClassName='min-h-0 flex-1'
      />
      <DataTablePagination table={table} />
    </div>
  )
}

export function NavGroupsTable({
  data,
  search,
  navigate,
  onReload,
  isReloading,
  isLoading,
  errorState,
}: DataTableProps) {
  const resolvedSearch = search ?? route.useSearch()
  const resolvedNavigate = navigate ?? toTableNavigate(route.useNavigate())

  return (
    <NavGroupsTableInner
      data={data}
      search={resolvedSearch}
      navigate={resolvedNavigate}
      onReload={onReload}
      isReloading={isReloading}
      isLoading={isLoading}
      errorState={errorState}
    />
  )
}
