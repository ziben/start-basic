import type { Translation } from '~/modules/admin/features/i18n/translation/types/translation'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { type ColumnDef } from '~/shared/lib/tanstack-table'
import { DataTableRowActions } from './data-table-row-actions'

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

export function useTranslationColumns(): ColumnDef<Translation>[] {
  const { t } = useTranslation()

  return [
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
