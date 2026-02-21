import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Trash2, Pen } from 'lucide-react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { adminNavgroupSchema } from '../data/schema'
import { useNavGroups } from './navgroups-provider'
import { logger } from '~/shared/utils/logger'

type DataTableRowActionsProps<TData> = {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const navgroup = adminNavgroupSchema.parse(row.original)

  const { setOpen, setCurrentRow } = useNavGroups()
  const { t } = useTranslation()

  return (
    <div className='flex items-center justify-end gap-2'>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8'
        onClick={() => {
          setCurrentRow(navgroup)
          setOpen('update')
        }}
      >
        <Pen className='h-4 w-4 text-muted-foreground' />
        <span className='sr-only'>{t('admin.navgroup.actions.edit')}</span>
      </Button>

      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8'
        onClick={() => {
          setCurrentRow(navgroup)
          setOpen('delete')
        }}
      >
        <Trash2 className='h-4 w-4 text-destructive' />
        <span className='sr-only'>{t('admin.navgroup.actions.delete')}</span>
      </Button>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuItem disabled>{t('admin.navgroup.actions.makeCopy')}</DropdownMenuItem>
          <DropdownMenuItem disabled>{t('admin.navgroup.actions.favorite')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}





