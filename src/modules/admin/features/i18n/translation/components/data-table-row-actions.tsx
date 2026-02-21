import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Trash2, Pen } from 'lucide-react'
import type { Translation } from '~/modules/admin/shared/types/translation'
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
import { useTranslations } from './translations-provider'

type DataTableRowActionsProps<TData> = {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const translation = row.original as Translation

  const { setOpen, setCurrentRow } = useTranslations()
  const { t } = useTranslation()

  return (
    <div className='flex items-center justify-end gap-2'>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8'
        onClick={() => {
          setCurrentRow(translation)
          setOpen('update')
        }}
      >
        <Pen className='h-4 w-4 text-muted-foreground' />
        <span className='sr-only'>{t('common.edit')}</span>
      </Button>

      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8'
        onClick={() => {
          setCurrentRow(translation)
          setOpen('delete')
        }}
      >
        <Trash2 className='h-4 w-4 text-destructive' />
        <span className='sr-only'>{t('common.delete')}</span>
      </Button>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuItem disabled>{t('common.makeCopy')}</DropdownMenuItem>
          <DropdownMenuItem disabled>{t('common.favorite')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}





