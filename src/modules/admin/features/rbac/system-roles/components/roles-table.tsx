import { useEffect, useRef, useState } from "react"
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { AdminDataTable } from '@/modules/admin/shared/components/admin-data-table'
import { useRolesContext } from "../context/roles-context"
import { useRolesQuery } from "../hooks/use-roles-query"
import { useRolesColumns } from "./roles-columns"
import { useTableColumnVisibility } from "@/shared/hooks/use-table-column-visibility"

export function RolesTable() {
  const { t } = useTranslation()
  const [rowSelection, setRowSelection] = useState({})
  const { columnVisibility, setColumnVisibility } = useTableColumnVisibility({ tableId: 'admin-roles' })
  const { tableUrl } = useRolesContext()
  const columns = useRolesColumns()

  const { data, isLoading, refetch, isRefetching } = useRolesQuery({
    page: tableUrl.pagination.pageIndex + 1,
    pageSize: tableUrl.pagination.pageSize,
    filter: tableUrl.globalFilter,
  })

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: {
      columnVisibility,
      rowSelection,
      columnFilters: tableUrl.columnFilters,
      globalFilter: tableUrl.globalFilter,
      pagination: tableUrl.pagination,
    },
    pageCount: data?.pageCount ?? 0,
    manualPagination: true,
    manualFiltering: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange: tableUrl.onPaginationChange,
    onGlobalFilterChange: tableUrl.onGlobalFilterChange,
    onColumnFiltersChange: tableUrl.onColumnFiltersChange,
  })

  useEffect(() => {
    tableUrl.ensurePageInRange(data?.pageCount ?? 0)
  }, [data?.pageCount, tableUrl])

  const rows = table.getRowModel().rows
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 44,
    overscan: 10,
  })

  return (
    <AdminDataTable
      table={table}
      columnsLength={columns.length}
      isLoading={isLoading}
      skeletonCount={tableUrl.pagination.pageSize}
      containerRef={tableContainerRef}
      rowVirtualizer={rowVirtualizer}
      emptyState={t('admin.common.noData')}
      searchPlaceholder={t('admin.role.searchPlaceholder')}
      onReload={() => void refetch()}
      isReloading={isRefetching}
    />
  )
}