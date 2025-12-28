import React, { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, MoreHorizontal, Pen, Trash } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTags, useDeleteTag } from '../../../shared/hooks/use-tags-api'
import { Tag } from '../../../shared/services/qb-api-client'
import { TagForm } from './tag-form'
import { toast } from 'sonner'

export function TagsTable() {
  const { data: tags, isLoading } = useTags()
  const deleteMutation = useDeleteTag()
  const [open, setOpen] = useState(false)
  const [currentRow, setCurrentRow] = useState<Tag | undefined>(undefined)

  const columns = [
    {
      accessorKey: 'name',
      header: '标签名称',
      cell: ({ row }: any) => {
        const tag = row.original as Tag
        return (
          <div className='flex items-center space-x-2'>
            {tag.color && (
              <div 
                className='h-3 w-3 rounded-full' 
                style={{ backgroundColor: tag.color }} 
              />
            )}
            <span className='font-medium'>{tag.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'color',
      header: '颜色代码',
      cell: ({ row }: any) => <code>{row.original.color || '-'}</code>,
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      cell: ({ row }: any) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const tag = row.original as Tag
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => {
                setCurrentRow(tag)
                setOpen(true)
              }}>
                <Pen className='mr-2 h-4 w-4' />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className='text-destructive'
                onClick={async () => {
                  if (confirm('确定要删除这个标签吗？')) {
                    try {
                      await deleteMutation.mutateAsync(tag.id)
                      toast.success('标签已删除')
                    } catch (err: any) {
                      toast.error(err.message || '删除失败')
                    }
                  }
                }}
              >
                <Trash className='mr-2 h-4 w-4' />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: tags || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='text-sm text-muted-foreground'>
          共 {tags?.length || 0} 个标签
        </div>
        <Button 
          size='sm' 
          onClick={() => {
            setCurrentRow(undefined)
            setOpen(true)
          }}
        >
          <Plus className='mr-2 h-4 w-4' />
          新建标签
        </Button>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
            ) : tags?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  暂无标签
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TagForm 
        open={open} 
        onOpenChange={setOpen} 
        initialData={currentRow} 
      />
    </div>
  )
}
