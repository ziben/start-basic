import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react'
import { useAdminUser } from '../context/admin-user-context'
import { AdminUser } from '../data/schema'

interface Props {
  row: { original: AdminUser }
}

export function DataTableRowActions({ row }: Props) {
  const { setOpen, setCurrentRow } = useAdminUser()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-8 w-8 p-0'>
          <IconDotsVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original)
            setOpen('edit')
          }}
        >
          <IconEdit size={16} className='mr-2' /> 编辑
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original)
            setOpen('delete')
          }}
        >
          <IconTrash size={16} className='mr-2 text-destructive' /> 删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 