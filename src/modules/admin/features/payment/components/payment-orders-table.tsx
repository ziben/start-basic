/**
 * Payment Orders Table - 订单列表表格组件
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { cn } from '@/shared/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { usePaymentOrdersQuery } from '../hooks/use-payment-orders'
import { paymentStatuses, paymentMethods } from '../data/schema'
import { usePaymentOrdersColumns } from './payment-orders-columns'

type PaymentOrdersTableProps = {
    search: Record<string, unknown>
    navigate: NavigateFn
}

export function PaymentOrdersTable({ search, navigate }: PaymentOrdersTableProps) {
    const { t } = useTranslation()

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
                columnId: 'status',
                searchKey: 'status',
                type: 'array',
                serialize: (value) => value,
                deserialize: (value) => {
                    if (Array.isArray(value)) return value
                    if (typeof value === 'string' && value) return [value]
                    return []
                },
            },
            {
                columnId: 'paymentMethod',
                searchKey: 'paymentMethod',
                type: 'array',
                serialize: (value) => value,
                deserialize: (value) => {
                    if (Array.isArray(value)) return value
                    if (typeof value === 'string' && value) return [value]
                    return []
                },
            },
        ],
    })

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const columns = usePaymentOrdersColumns()

    // 提取筛选条件
    const statusFilter = useMemo(() => {
        const filter = columnFilters.find((f) => f.id === 'status')
        if (!filter || !Array.isArray(filter.value) || filter.value.length === 0) {
            return undefined
        }
        return filter.value[0] as any
    }, [columnFilters])

    const paymentMethodFilter = useMemo(() => {
        const filter = columnFilters.find((f) => f.id === 'paymentMethod')
        if (!filter || !Array.isArray(filter.value) || filter.value.length === 0) {
            return undefined
        }
        return filter.value[0] as any
    }, [columnFilters])

    // 查询订单列表
    const { data: pageData, refetch, isRefetching } = usePaymentOrdersQuery({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        filter: globalFilter ?? undefined,
        status: statusFilter,
        paymentMethod: paymentMethodFilter,
    })

    const data = pageData?.items ?? []
    const serverPageCount = pageData?.pageCount ?? 0

    const table = useReactTable({
        data,
        columns,
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
        getCoreRowModel: getCoreRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        onPaginationChange,
        onGlobalFilterChange,
        onColumnFiltersChange,
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
                searchPlaceholder="搜索订单号、用户邮箱..."
                onReload={() => void refetch()}
                isReloading={isRefetching}
                filters={[
                    {
                        columnId: 'status',
                        title: '订单状态',
                        options: paymentStatuses.map((opt) => ({
                            label: opt.labelKey.split('.').pop() || opt.value,
                            value: opt.value,
                        })),
                    },
                    {
                        columnId: 'paymentMethod',
                        title: '支付方式',
                        options: paymentMethods.map((opt) => ({
                            label: opt.labelKey.split('.').pop() || opt.value,
                            value: opt.value,
                        })),
                    },
                ]}
            />
            <div className="relative overflow-hidden rounded-md border">
                <div ref={tableContainerRef} className="max-h-[70vh] overflow-auto">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="group/row">
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                className={cn(
                                                    'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                                                    header.column.columnDef.meta?.className
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
                            {rows?.length ? (
                                <>
                                    {paddingTop > 0 ? (
                                        <TableRow aria-hidden="true" className="border-0 hover:bg-transparent">
                                            <TableCell colSpan={columns.length} className="p-0" style={{ height: `${paddingTop}px` }} />
                                        </TableRow>
                                    ) : null}

                                    {virtualRows.map((virtualRow) => {
                                        const row = rows[virtualRow.index]!
                                        return (
                                            <TableRow key={row.id} className="group/row">
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={cn(
                                                            'bg-background group-hover/row:bg-muted',
                                                            cell.column.columnDef.meta?.className
                                                        )}
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        )
                                    })}

                                    {paddingBottom > 0 ? (
                                        <TableRow aria-hidden="true" className="border-0 hover:bg-transparent">
                                            <TableCell colSpan={columns.length} className="p-0" style={{ height: `${paddingBottom}px` }} />
                                        </TableRow>
                                    ) : null}
                                </>
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        {t('common.noResults')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <DataTablePagination table={table} className="mt-auto" />
        </div>
    )
}
