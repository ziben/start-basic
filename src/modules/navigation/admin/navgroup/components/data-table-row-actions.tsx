import { Trash2, Pen } from 'lucide-react'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { adminNavgroupSchema } from '~/modules/navigation/shared/navgroup/data/schema'
import type { RowData } from '~/shared/lib/tanstack-table'
import { type Row } from '~/shared/lib/tanstack-table'
import { Button } from '@/components/ui/button'
import { useNavGroups } from './navgroups-provider'

type DataTableRowActionsProps<TData extends RowData> = {
  row: Row<TData>
}

export function DataTableRowActions<TData extends RowData>({ row }: DataTableRowActionsProps<TData>) {
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
    </div>
  )
}
