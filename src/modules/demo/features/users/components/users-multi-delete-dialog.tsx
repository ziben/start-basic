'use client'

import { type Table } from '@tanstack/react-table'
import { toast } from 'sonner'
import { sleep } from '@/shared/lib/utils'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

type UserMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function UsersMultiDeleteDialog<TData>({ open, onOpenChange, table }: UserMultiDeleteDialogProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = () => {
    onOpenChange(false)

    toast.promise(sleep(2000), {
      loading: 'Deleting users...',
      success: () => {
        table.resetRowSelection()
        return `Deleted ${selectedRows.length} ${selectedRows.length > 1 ? 'users' : 'user'}`
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
      itemName='user'
    />
  )
}



