'use client'

import { type Table } from '@tanstack/react-table'
import { toast } from 'sonner'
import { sleep } from '@/shared/lib/utils'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

type TaskMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function TasksMultiDeleteDialog<TData>({ open, onOpenChange, table }: TaskMultiDeleteDialogProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = () => {
    onOpenChange(false)

    toast.promise(sleep(2000), {
      loading: 'Deleting tasks...',
      success: () => {
        table.resetRowSelection()
        return `Deleted ${selectedRows.length} ${selectedRows.length > 1 ? 'tasks' : 'task'}`
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
      itemName='task'
    />
  )
}


