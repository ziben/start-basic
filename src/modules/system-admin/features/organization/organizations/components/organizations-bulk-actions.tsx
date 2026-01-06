import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { bulkDeleteOrganizationsFn } from '../../../../shared/server-fns/organization.fn'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Organization } from '../data/schema'
import { ORGANIZATIONS_QUERY_KEY } from '../hooks/use-organizations-list-query'
import { useOrganizationsOptimisticUpdate, createBulkDeleteUpdateFn } from '../hooks/use-organizations-optimistic-update'
import { OrganizationsMultiDeleteDialog } from './organizations-multi-delete-dialog'

type OrganizationsBulkActionsProps<TData> = {
  table: Table<TData>
}

export function OrganizationsBulkActions<TData>({ table }: OrganizationsBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkExport = () => {
    const selectedOrgs = selectedRows.map((row) => row.original as Organization)
    toast.promise(Promise.resolve(), {
      loading: '导出中...',
      success: () => {
        table.resetRowSelection()
        return `已导出 ${selectedOrgs.length} 个组织`
      },
      error: '导出失败',
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
              aria-label='导出组织'
              title='导出组织'
            >
              <Download />
              <span className='sr-only'>导出组织</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>导出组织</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='删除选中的组织'
              title='删除选中的组织'
            >
              <Trash2 />
              <span className='sr-only'>删除选中的组织</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>删除选中的组织</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <OrganizationsMultiDeleteDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} table={table} />
    </>
  )
}
