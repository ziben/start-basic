/**
 * AI Chat Admin - 会话列表表格
 */

import { useState } from 'react'
import {
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { cn } from '@/shared/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/shared/hooks/use-table-url-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useAIChatColumns } from './ai-chat-columns'
import type { AIConversationItem } from '../hooks/use-ai-chat-query'

type Props = {
    data: AIConversationItem[]
    isLoading: boolean
    search?: Record<string, unknown>
    navigate?: NavigateFn
    onView: (id: string) => void
    onDelete: (id: string) => void
}

function AIChatTableInner({ data, isLoading, search, navigate, onView, onDelete }: Props): React.ReactElement {
    const columns = useAIChatColumns({ onView, onDelete })
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const {
        globalFilter,
        onGlobalFilterChange,
        pagination,
        onPaginationChange,
        ensurePageInRange,
    } = useTableUrlState({
        search: search ?? {},
        navigate: navigate ?? (() => {}),
        pagination: { defaultPage: 1, defaultPageSize: 20 },
        globalFilter: { enabled: true, key: 'filter' },
    })

    const table = useReactTable({
        data,
        columns,
        state: {
            columnVisibility,
            globalFilter,
            pagination,
        },
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange,
        onPaginationChange,
        getCoreRowModel: getCoreRowModel(),
    })

    const pageCount = table.getPageCount()
    const rows = table.getRowModel().rows

    return (
        <div className='space-y-4'>
            <DataTableToolbar
                table={table}
                searchPlaceholder='搜索标题或用户…'
            />
            <div className='rounded-md border'>
                <Table className='table-fixed'>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        className={cn(
                                            'bg-background',
                                            header.column.columnDef.meta?.className,
                                        )}
                                        style={{ width: header.getSize() }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-24 text-center'>
                                    加载中…
                                </TableCell>
                            </TableRow>
                        ) : rows.length ? (
                            rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={cn(
                                                'bg-background',
                                                cell.column.columnDef.meta?.className,
                                            )}
                                            style={{ width: cell.column.getSize() }}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-24 text-center'>
                                    暂无数据
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    )
}

export function AIChatTable(props: Props): React.ReactElement {
    return <AIChatTableInner {...props} />
}
