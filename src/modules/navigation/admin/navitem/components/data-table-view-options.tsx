import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import type { RowData } from '~/shared/lib/tanstack-table'
import { Table } from '~/shared/lib/tanstack-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DataTableViewOptionsProps<TData extends RowData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData extends RowData>({ table }: DataTableViewOptionsProps<TData>) {
  const { t } = useTranslation()

  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      name: t('admin.navitem.table.name'),
      path: t('admin.navitem.table.path'),
      navgroupId: t('admin.navitem.table.navgroup'),
      icon: t('admin.navitem.table.icon'),
      order: t('admin.navitem.table.order'),
      isVisible: t('admin.navitem.table.status'),
      external: t('admin.navitem.table.external'),
      target: t('admin.navitem.table.target'),
      createdAt: t('admin.navitem.table.createdAt'),
      updatedAt: t('admin.navitem.table.updatedAt'),
      description: t('admin.navitem.table.description'),
    }

    return labels[columnId] || columnId
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='ml-auto h-8 lg:flex'>
          <MixerHorizontalIcon className='mr-2 h-4 w-4' />
          {t('admin.common.viewOptions')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[150px]'>
        <DropdownMenuLabel>{t('admin.common.toggleColumns', { defaultMessage: '切换列显示' })}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className='capitalize'
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {getColumnLabel(column.id)}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
