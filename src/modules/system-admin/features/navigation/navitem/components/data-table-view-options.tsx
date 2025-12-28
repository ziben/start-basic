import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
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




