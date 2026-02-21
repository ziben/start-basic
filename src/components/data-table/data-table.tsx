import React, { memo } from 'react'
import { flexRender, type Table as TanstackTable, type Row as TanstackRow } from '@tanstack/react-table'
import { type Virtualizer } from '@tanstack/react-virtual'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

export interface DataTableProps<TData> {
    table: TanstackTable<TData>
    columnsLength: number
    /**
     * If true, shows a Skeleton rows based on pageSize or skeletonCount
     */
    isLoading?: boolean
    /**
     * Determine the number of skeletons to show. Defaults to table.getState().pagination.pageSize
     */
    skeletonCount?: number
    /**
     * Optional custom empty state message
     */
    emptyState?: React.ReactNode
    /**
   * Required for row virtualization
   */
    rowVirtualizer?: Virtualizer<HTMLDivElement, Element>
    /**
     * Optional ref for the scrollable container, used for virtualization
     */
    containerRef?: React.RefObject<HTMLDivElement | null>
    containerClassName?: string
    tableClassName?: string
}

const MemoizedTableRow = memo(
    ({ row, columnsLength }: { row: TanstackRow<any>; columnsLength: number }) => {
        return (
            <TableRow data-state={row.getIsSelected() && 'selected'} className='group/row'>
                {row.getVisibleCells().map((cell) => {
                    const isAutoWidth = cell.column.id === 'actions'
                    return (
                        <TableCell
                            key={cell.id}
                            className={cn(
                                'bg-background transition-colors group-hover/row:bg-muted/50 group-data-[state=selected]/row:bg-muted/50',
                                cell.column.columnDef.meta?.className,
                                (cell.column.columnDef.meta as Record<string, unknown>)?.tdClassName as string,
                            )}
                            style={
                                isAutoWidth
                                    ? { width: 'auto' }
                                    : cell.column.columnDef.enableResizing
                                        ? { width: `var(--col-${cell.column.id}-size)` }
                                        : undefined
                            }
                        >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    )
                })}
            </TableRow>
        )
    },
    (prev, next) =>
        prev.row === next.row &&
        prev.row.getIsSelected() === next.row.getIsSelected() &&
        prev.row.getIsExpanded() === next.row.getIsExpanded()
)

export function DataTable<TData>({
    table,
    columnsLength,
    isLoading,
    skeletonCount,
    emptyState,
    rowVirtualizer,
    containerRef,
    containerClassName,
    tableClassName,
}: DataTableProps<TData>) {
    const rows = table.getRowModel().rows
    const pageSize = skeletonCount ?? table.getState().pagination.pageSize

    const virtualRows = rowVirtualizer?.getVirtualItems()
    const paddingTop = virtualRows && virtualRows.length > 0 ? virtualRows[0]!.start : 0
    const paddingBottom =
        virtualRows && virtualRows.length > 0 && rowVirtualizer
            ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end
            : 0

    return (
        <div className={cn('relative overflow-x-auto rounded-md border', containerClassName)}>
            <div ref={containerRef} className={cn('max-h-[70vh] overflow-auto', rowVirtualizer ? 'w-full' : '')}>
                <Table
                    className={tableClassName}
                    style={
                        {
                            ...Object.fromEntries(
                                table.getFlatHeaders().map((header) => [
                                    `--col-${header.column.id}-size`,
                                    `${header.column.getSize()}px`,
                                ])
                            ),
                        } as React.CSSProperties
                    }
                >
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const isAutoWidth = header.column.id === 'actions'
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={cn(
                                                'relative select-none bg-background',
                                                header.column.columnDef.meta?.className,
                                                (header.column.columnDef.meta as Record<string, unknown>)?.thClassName as string,
                                            )}
                                            style={
                                                isAutoWidth
                                                    ? { width: 'auto' }
                                                    : header.column.getCanResize()
                                                        ? { width: `var(--col-${header.column.id}-size)` }
                                                        : undefined
                                            }
                                        >
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getCanResize() ? (
                                                <button
                                                    type='button'
                                                    aria-label='调整列宽'
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    className={cn(
                                                        'absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none p-0 border-0 bg-border opacity-0 transition-opacity hover:opacity-100',
                                                        header.column.getIsResizing() && 'bg-primary opacity-100',
                                                    )}
                                                />
                                            ) : null}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: pageSize }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`}>
                                    {Array.from({ length: columnsLength }).map((_, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className='h-4 w-full' />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : rows.length > 0 ? (
                            <>
                                {paddingTop > 0 ? (
                                    <TableRow aria-hidden='true' className='border-0 hover:bg-transparent'>
                                        <TableCell colSpan={columnsLength} className='p-0' style={{ height: `${paddingTop}px` }} />
                                    </TableRow>
                                ) : null}

                                {(virtualRows ? virtualRows.map((v) => rows[v.index]!) : rows).map((row) => (
                                    <MemoizedTableRow key={row.id} row={row} columnsLength={columnsLength} />
                                ))}

                                {paddingBottom > 0 ? (
                                    <TableRow aria-hidden='true' className='border-0 hover:bg-transparent'>
                                        <TableCell colSpan={columnsLength} className='p-0' style={{ height: `${paddingBottom}px` }} />
                                    </TableRow>
                                ) : null}
                            </>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columnsLength} className='h-24 text-center text-muted-foreground'>
                                    {emptyState ?? '暂无数据'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
