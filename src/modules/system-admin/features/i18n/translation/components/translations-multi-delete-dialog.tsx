'use client'

import { type Table } from '@tanstack/react-table'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

type TranslationsMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function TranslationsMultiDeleteDialog<TData>({
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
