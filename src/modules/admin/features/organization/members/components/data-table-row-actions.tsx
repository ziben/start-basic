import { type Row } from '@tanstack/react-table'
import { MoreHorizontal, Pen, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Member } from '../data/schema'
import { useMembers } from './members-provider'

type DataTableRowActionsProps = {
  row: Row<Member>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useMembers()
  const member = row.original

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setCurrentRow(member)
          setOpen('update')
        }}
      >
        <Pen className="h-4 w-4 text-muted-foreground" />
        <span className="sr-only">编辑角色</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setCurrentRow(member)
          setOpen('delete')
        }}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
        <span className="sr-only">移除</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">打开菜单</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {/* Add future secondary actions here */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
