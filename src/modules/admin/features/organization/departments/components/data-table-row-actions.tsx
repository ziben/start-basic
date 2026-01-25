import { type Row } from '@tanstack/react-table'
import { MoreHorizontal, Pen, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Department } from '../data/schema'
import { useDepartments } from './departments-provider'

type DataTableRowActionsProps = {
  row: Row<Department>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useDepartments()
  const department = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
          <MoreHorizontal className='h-4 w-4' />
          <span className='sr-only'>打开菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(department)
            setOpen('update')
          }}
        >
          <Pen className='mr-2 h-4 w-4' />
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            // 设置当前行作为父部门，然后打开创建对话框
            setCurrentRow({ ...department, _isParentForNew: true } as any)
            setOpen('create')
          }}
        >
          <Plus className='mr-2 h-4 w-4' />
          添加子部门
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(department)
            setOpen('delete')
          }}
          className='text-destructive focus:text-destructive'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
