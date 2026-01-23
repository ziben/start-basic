import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Organization } from '../data/schema'
import { OrganizationsMultiDeleteDialog } from './organizations-multi-delete-dialog'

type OrganizationsBulkActionsProps<TData> = {
  table: Table<TData>
}

export function OrganizationsBulkActions<TData>({ table }: OrganizationsBulkActionsProps<TData>) {
  const { t } = useTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkExport = () => {
    const selectedOrgs = selectedRows.map((row) => row.original as Organization)
    toast.promise(Promise.resolve(), {
      loading: t('admin.organization.bulk.export.loading'),
      success: () => {
        table.resetRowSelection()
        return t('admin.organization.bulk.export.success', { count: selectedOrgs.length })
      },
      error: t('admin.organization.bulk.export.error'),
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='organization'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkExport()}
              className='size-8'
              aria-label={t('admin.organization.bulk.export.label')}
              title={t('admin.organization.bulk.export.label')}
            >
              <Download />
              <span className='sr-only'>{t('admin.organization.bulk.export.label')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('admin.organization.bulk.export.label')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label={t('admin.organization.bulk.delete.label')}
              title={t('admin.organization.bulk.delete.label')}
            >
              <Trash2 />
              <span className='sr-only'>{t('admin.organization.bulk.delete.label')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('admin.organization.bulk.delete.label')}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <OrganizationsMultiDeleteDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} table={table} />
    </>
  )
}
