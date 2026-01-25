import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteOrganizationRoleFn } from '@/modules/admin/shared/server-fns/organization-role.fn'
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
import { rbacOrgRolesQueryKeys } from '~/shared/lib/query-keys'
import { useOrgRolesContext } from '../context/org-roles-context'

export function OrgRoleDeleteDialog() {
  const { deleteDialog, closeDeleteDialog } = useOrgRolesContext()
  const queryClient = useQueryClient()

  const role = deleteDialog.data

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrganizationRoleFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacOrgRolesQueryKeys.all })
      toast.success('删除成功')
      closeDeleteDialog()
    },
    onError: (error: Error) => {
      toast.error('删除失败', { description: error.message })
    },
  })

  const handleDelete = () => {
    if (role?.id) {
      deleteMutation.mutate(role.id)
    }
  }

  return (
    <AlertDialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除组织角色 <strong>{role?.displayName}</strong> 吗？此操作无法撤销。
            {role?._count && role._count.members > 0 && (
              <p className="mt-2 text-destructive font-semibold">
                警告：该角色下仍有 {role._count.members} 名成员，删除前请先移除成员关联。
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending || (role?._count ? role._count.members > 0 : false)}
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
