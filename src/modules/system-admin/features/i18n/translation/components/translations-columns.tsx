import { type ColumnDef } from '@tanstack/react-table'
import type { Translation } from '~/modules/system-admin/shared/types/translation'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableRowActions } from './data-table-row-actions'

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

export function useTranslationColumns(): ColumnDef<Translation>[] {
  const { t } = useTranslation()

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('admin.table.selectAll')}
          className='translate-y-[2px]'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t('admin.table.selectRow')}
          className='translate-y-[2px]'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'locale',
      header: () => t('admin.translation.columns.locale'),
      cell: ({ row }) => t(row.getValue<string>('locale')),
      meta: { className: 'w-40' },
    },
    {
      accessorKey: 'key',
      header: () => t('admin.translation.columns.key'),
      cell: ({ row }) => row.getValue('key'),
      meta: { className: 'w-20' },
    },
    {
      accessorKey: 'value',
      header: () => t('admin.translation.columns.value'),
      cell: ({ row }) => t(row.getValue<string>('value')),
      meta: { className: 'w-40' },
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ]
}





