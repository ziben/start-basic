import * as React from 'react'
import type { Table as TanstackTable } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableToolbar } from '@/components/data-table/toolbar'
import { DataTablePagination } from '@/components/data-table/pagination'

type AdminDataTableProps<TData> = {
    table: TanstackTable<TData>
    columnsLength: number
    isLoading?: boolean
    skeletonCount?: number
    emptyState?: React.ReactNode

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

export function AdminDataTable<TData>({
    table,
    columnsLength,
    isLoading,
    skeletonCount,
    emptyState,
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
                rowVirtualizer={rowVirtualizer}
                containerRef={containerRef}
                containerClassName='min-h-0 flex-1'
            />
            <DataTablePagination table={table} className='mt-auto' />
            {bulkActions && <div>{bulkActions}</div>}
        </div>
    )
}
