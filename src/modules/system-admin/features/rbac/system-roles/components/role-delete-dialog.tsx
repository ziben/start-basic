import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRoleFn } from '@/modules/system-admin/shared/server-fns/rbac.fn'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useRolesContext } from '../context/roles-context'

export function RoleDeleteDialog() {
  const { deleteDialog, closeDeleteDialog } = useRolesContext()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteRoleFn({ data: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] })
      toast.success('删除成功')
      closeDeleteDialog()
    },
    onError: (error: Error) => {
      toast.error('删除失败', { description: error.message })
    },
  })

  const handleDelete = () => {
    if (deleteDialog.role) {
      deleteMutation.mutate(deleteDialog.role.id)
    }
  }

  return (
    <AlertDialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除角色 <strong>{deleteDialog.role?.displayName}</strong> 吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
