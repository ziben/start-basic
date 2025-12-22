import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '~/hooks/useTranslation'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type AdminNavgroup } from '../data/schema'
import { NavGroupsMultiDeleteDialog } from './navgroups-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({ table }: DataTableBulkActionsProps<TData>) {
  const { t } = useTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: string) => {
    const selectedNavGroups = selectedRows.map((row) => row.original as AdminNavgroup)
    toast.promise(sleep(2000), {
      loading: t('admin.navgroup.toast.updatingStatus.loading'),
      success: () => {
        table.resetRowSelection()
        return t('admin.navgroup.toast.updatingStatus.success', {
          status,
          count: selectedNavGroups.length,
        })
      },
      error: t('admin.navgroup.toast.updatingStatus.error'),
    })
    table.resetRowSelection()
  }

  const handleBulkPriorityChange = (priority: string) => {
    const selectedNavGroups = selectedRows.map((row) => row.original as AdminNavgroup)
    toast.promise(sleep(2000), {
      loading: t('admin.navgroup.toast.updatingPriority.loading'),
      success: () => {
        table.resetRowSelection()
        return t('admin.navgroup.toast.updatingPriority.success', {
          priority,
          count: selectedNavGroups.length,
        })
      },
      error: t('admin.navgroup.toast.updatingPriority.error'),
    })
    table.resetRowSelection()
  }

  const handleBulkExport = () => {
    const selectedNavGroups = selectedRows.map((row) => row.original as AdminNavgroup)
    toast.promise(sleep(2000), {
      loading: t('admin.navgroup.toast.exporting.loading'),
      success: () => {
        table.resetRowSelection()
        return t('admin.navgroup.toast.exporting.success', {
          count: selectedNavGroups.length,
        })
      },
      error: t('admin.navgroup.toast.exporting.error'),
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='navgroup'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkExport()}
              className='size-8'
              aria-label='Export tasks'
              title='Export tasks'
            >
              <Download />
              <span className='sr-only'>Export tasks</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export tasks</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Delete selected tasks'
              title='Delete selected tasks'
            >
              <Trash2 />
              <span className='sr-only'>Delete selected tasks</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected tasks</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <NavGroupsMultiDeleteDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} table={table} />
    </>
  )
}
