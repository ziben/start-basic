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
              aria-label='导出'
              title='导出'
            >
              <Download />
              <span className='sr-only'>导出</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>导出</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='删除选中的导航组'
              title='删除选中的导航组'
            >
              <Trash2 />
              <span className='sr-only'>删除选中的导航组</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>删除选中的导航组</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <NavGroupsMultiDeleteDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} table={table} />
    </>
  )
}
