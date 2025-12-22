import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Translation } from '~/generated/prisma/client'
import { useTranslation } from '~/hooks/useTranslation'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { TranslationsMultiDeleteDialog } from './translations-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({ table }: DataTableBulkActionsProps<TData>) {
  const { t } = useTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: string) => {
    const selectedTranslations = selectedRows.map((row) => row.original as Translation)
    toast.promise(sleep(2000), {
      loading: t('admin.translations.toast.updatingStatus.loading'),
      success: () => {
        table.resetRowSelection()
        return t('admin.translations.toast.updatingStatus.success', {
          status,
          count: selectedTranslations.length,
        })
      },
      error: t('admin.translations.toast.updatingStatus.error'),
    })
    table.resetRowSelection()
  }

  const handleBulkPriorityChange = (priority: string) => {
    const selectedTranslations = selectedRows.map((row) => row.original as Translation)
    toast.promise(sleep(2000), {
      loading: t('admin.translations.toast.updatingPriority.loading'),
      success: () => {
        table.resetRowSelection()
        return t('admin.translations.toast.updatingPriority.success', {
          priority,
          count: selectedTranslations.length,
        })
      },
      error: t('admin.translations.toast.updatingPriority.error'),
    })
    table.resetRowSelection()
  }

  const handleBulkExport = () => {
    const selectedTranslations = selectedRows.map((row) => row.original as Translation)
    toast.promise(sleep(2000), {
      loading: t('admin.translations.toast.exporting.loading'),
      success: () => {
        table.resetRowSelection()
        return t('admin.translations.toast.exporting.success', {
          count: selectedTranslations.length,
        })
      },
      error: t('admin.translations.toast.exporting.error'),
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='translation'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkExport()}
              className='size-8'
              aria-label='Export translations'
              title='Export translations'
            >
              <Download />
              <span className='sr-only'>Export translations</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export translations</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Delete selected translations'
              title='Delete selected translations'
            >
              <Trash2 />
              <span className='sr-only'>Delete selected translations</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected translations</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <TranslationsMultiDeleteDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} table={table} />
    </>
  )
}
