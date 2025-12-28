import React, { useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { type VisibilityState, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useQuestions } from '../../../shared/hooks/use-questions-api'
import { columns } from './questions-columns'
import { useQbTableUrlState } from '../../../shared/hooks/use-qb-table-url-state'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { QuestionForm } from './question-form'
import { Question } from '../../../shared/services/qb-api-client'

const route = getRouteApi('/question-bank/questions' as any)

export function QuestionsTable() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [open, setOpen] = useState(false)
  const [currentRow, setCurrentRow] = useState<Question | undefined>(undefined)

  const {
    pagination,
    onPaginationChange,
    globalFilter,
    onGlobalFilterChange,
  } = useQbTableUrlState({
    search,
    navigate: navigate as any,
    pagination: { defaultPageSize: 10 },
  })

  const { data, isLoading, refetch, isRefetching } = useQuestions({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    q: globalFilter,
  })

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: {
      pagination,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    pageCount: data ? Math.ceil(data.total / pagination.pageSize) : -1,
    manualPagination: true,
    onPaginationChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onEdit: (row: Question) => {
        setCurrentRow(row)
        setOpen(true)
      },
    },
  })

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <DataTableToolbar
          table={table}
          searchPlaceholder='搜索题目内容...'
          onReload={() => void refetch()}
          isReloading={isRefetching}
        />
        <Button 
          size='sm' 
          className='ml-auto hidden h-8 lg:flex'
          onClick={() => {
            setCurrentRow(undefined)
            setOpen(true)
          }}
        >
          <Plus className='mr-2 h-4 w-4' />
          新建题目
        </Button>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  正在加载...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
      
      <QuestionForm
        open={open}
        onOpenChange={setOpen}
        initialData={currentRow}
      />
    </div>
  )
}
