import * as React from 'react'
import type { Virtualizer } from '@tanstack/react-virtual'
import type { RowData } from '~/shared/lib/tanstack-table'
import type { Table as TanstackTable } from '~/shared/lib/tanstack-table'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/pagination'
import { DataTableToolbar } from '@/components/data-table/toolbar'

type AdminDataTableProps<TData extends RowData> = {
  table: TanstackTable<TData>
  columnsLength: number
  isLoading?: boolean
  skeletonCount?: number
  emptyState?: React.ReactNode
  errorState?: React.ReactNode

  // Toolbar props
  searchPlaceholder?: string
  searchKey?: string
  onReload?: () => void
  isReloading?: boolean
  showViewOptions?: boolean
  filters?: {
    columnId: string
    title: string
    options: {
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }[]
  }[]

  // Virtualization
  rowVirtualizer?: Virtualizer<HTMLDivElement, Element>
  containerRef?: React.RefObject<HTMLDivElement | null>

  // Custom slots
  bulkActions?: React.ReactNode
}

export function AdminDataTable<TData extends RowData>({
  table,
  columnsLength,
  isLoading,
  skeletonCount,
  emptyState,
  errorState,
  searchPlaceholder,
  searchKey,
  onReload,
  isReloading,
  showViewOptions,
  filters,
  rowVirtualizer,
  containerRef,
  bulkActions,
}: AdminDataTableProps<TData>) {
  return (
    <div className='flex min-h-0 flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder={searchPlaceholder}
        searchKey={searchKey}
        onReload={onReload}
        isReloading={isReloading}
        showViewOptions={showViewOptions}
        filters={filters}
      />
      <DataTable
        table={table}
        columnsLength={columnsLength}
        isLoading={isLoading}
        skeletonCount={skeletonCount}
        emptyState={emptyState}
        errorState={errorState}
        rowVirtualizer={rowVirtualizer}
        containerRef={containerRef}
        containerClassName='min-h-0 flex-1'
      />
      <DataTablePagination table={table} className='mt-auto' />
      {bulkActions && <div>{bulkActions}</div>}
    </div>
  )
}
