import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react'
import { useAdminUsers } from '../context/admin-users-context'
import { AdminUsers } from '../data/schema'
import { useTranslation } from '~/hooks/useTranslation'

interface Props {
  readonly row: { original: AdminUsers }
}

export function DataTableRowActions({ row }: Props) {
  const { setOpen, setCurrentRow } = useAdminUsers()
  const { t } = useTranslation()
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
          <IconEdit size={16} className='mr-2' /> {t('admin.user.dialog.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original)
            setOpen('delete')
          }}
        >
          <IconTrash size={16} className='mr-2 text-destructive' /> {t('admin.user.dialog.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 