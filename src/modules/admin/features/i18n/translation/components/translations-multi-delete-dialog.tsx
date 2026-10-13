'use client'

import { sleep } from '@/shared/lib/utils'
import { toast } from 'sonner'
import type { RowData } from '~/shared/lib/tanstack-table'
import { type Table } from '~/shared/lib/tanstack-table'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

type TranslationsMultiDeleteDialogProps<TData extends RowData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function TranslationsMultiDeleteDialog<TData extends RowData>({
  open,
  onOpenChange,
  table,
}: TranslationsMultiDeleteDialogProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = () => {
    onOpenChange(false)

    toast.promise(sleep(2000), {
      loading: 'Deleting translations...',
      success: () => {
        table.resetRowSelection()
        return `Deleted ${selectedRows.length} ${selectedRows.length > 1 ? 'translations' : 'translation'}`
      },
      error: 'Error',
    })
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      confirmWord='DELETE'
      itemCount={selectedRows.length}
      itemName='translation'
    />
  )
}
