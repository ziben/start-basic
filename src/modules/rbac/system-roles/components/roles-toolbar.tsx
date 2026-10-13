import { Cross2Icon } from '@radix-ui/react-icons'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import type { RowData } from '~/shared/lib/tanstack-table'
import { type Table } from '~/shared/lib/tanstack-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '@/components/data-table'

interface RolesToolbarProps<TData extends RowData> {
  table: Table<TData>
}

export function RolesToolbar<TData extends RowData>({ table }: RolesToolbarProps<TData>) {
  const { t } = useTranslation()
  const isFiltered = table.state.columnFilters.length > 0 || !!table.state.globalFilter

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder={t('admin.role.searchPlaceholder')}
          value={(table.state.globalFilter as string) ?? ''}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter('')
            }}
            className='h-8 px-2 lg:px-3'
          >
            {t('admin.common.resetFilters')}
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
