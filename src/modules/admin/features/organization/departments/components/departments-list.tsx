import { useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ExpandedState,
} from '@tanstack/react-table'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useDepartmentsColumns } from './departments-columns'
import { type Department } from '../data/schema'
import { useState } from 'react'

type DepartmentsListProps = {
  departments: Department[]
}

export function DepartmentsList({ departments }: DepartmentsListProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({})
  
  const columns = useDepartmentsColumns()

  // 构建树形数据
  const treeData = useMemo(() => {
    type DepartmentWithSubRows = Department & { subRows?: DepartmentWithSubRows[] }
    
    const buildTree = (items: Department[], parentId: string | null = null): DepartmentWithSubRows[] => {
      return items
        .filter((item) => item.parentId === parentId)
        .map((item) => ({
          ...item,
          subRows: buildTree(items, item.id),
        }))
    }
    return buildTree(departments)
  }, [departments])

  const table = useReactTable({
    data: treeData,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getSubRows: (row: any) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <div className='overflow-hidden rounded-md border'>
      <div className='max-h-[70vh] overflow-auto'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(header.column.columnDef.meta?.className)}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cell.column.columnDef.meta?.className)}
                    >
                      {index === 0 && row.subRows?.length > 0 ? (
                        <div className='flex items-center gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 w-6 p-0'
                            onClick={() => row.toggleExpanded()}
                          >
                            {row.getIsExpanded() ? (
                              <ChevronDown className='h-4 w-4' />
                            ) : (
                              <ChevronRight className='h-4 w-4' />
                            )}
                          </Button>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ) : (
                        <div style={{ paddingLeft: index === 0 && row.depth > 0 ? `${row.depth * 24}px` : undefined }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      )}
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
    </div>
  )
}
