import { useState } from 'react'
import { type Table, type Row } from '@tanstack/react-table'
import { useMutation } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { bulkDeleteMembersFn } from '~/modules/admin/features/organization/members/server-fns/member.fn'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { type Member } from '../data/schema'
import { memberQueryKeys } from '~/shared/lib/query-keys'
import { useMembersOptimisticUpdate, createBulkDeleteUpdateFn } from '../hooks/use-members-optimistic-update'

type MembersMultiDeleteDialogProps = {
  table: Table<Member>
  selectedRows: Row<Member>[]
}

export function MembersMultiDeleteDialog({ table, selectedRows }: MembersMultiDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const { getOptimisticMutationOptions } = useMembersOptimisticUpdate()

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await bulkDeleteMembersFn({ data: { ids } })
    },
    ...getOptimisticMutationOptions({
      queryKey: memberQueryKeys.all,
      updateFn: (members, ids) => createBulkDeleteUpdateFn(members, ids),
    }),
  })

  const handleDelete = () => {
    const ids = selectedRows.map((row) => row.original.id)
    setOpen(false)

    const promise = deleteMutation.mutateAsync(ids).then(() => {
      table.toggleAllRowsSelected(false)
    })

    toast.promise(promise, {
      loading: '删除中...',
      success: `已移除 ${ids.length} 个成员`,
      error: (err) => err.message || '删除失败',
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant='destructive' size='sm'>
          <Trash2 className='mr-2 h-4 w-4' />
          删除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认批量移除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要移除选中的 <strong>{selectedRows.length}</strong> 个成员吗？
            <br />
            此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className='bg-destructive hover:bg-destructive/90'>
            确认移除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
