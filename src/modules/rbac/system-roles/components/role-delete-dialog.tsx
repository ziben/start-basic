import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRoleFn } from '../../server-fns/rbac.fn'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { toast } from 'sonner'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { roleQueryKeys } from '~/shared/lib/query-keys'
import { useRolesContext } from '../context/roles-context'

export function RoleDeleteDialog() {
  const { t } = useTranslation()
  const { deleteDialog, closeDeleteDialog } = useRolesContext()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteRoleFn({ data: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
      toast.success(t('admin.role.toast.deleteSuccess'))
      closeDeleteDialog()
    },
    onError: (error: Error) => {
      toast.error(t('admin.role.toast.deleteError'), { description: error.message })
    },
  })

  const handleDelete = () => {
    if (deleteDialog.role) {
      deleteMutation.mutate(deleteDialog.role.id)
    }
  }

  return (
    <ConfirmDeleteDialog
      open={deleteDialog.isOpen}
      onOpenChange={(open) => {
        if (!open) closeDeleteDialog()
      }}
      onConfirm={handleDelete}
      title={t('admin.role.delete.title')}
      description={t('admin.role.delete.desc', { name: deleteDialog.role?.displayName })}
      confirmWord={deleteDialog.role?.name || deleteDialog.role?.displayName}
      confirmText={t('common.buttons.delete')}
      cancelText={t('common.buttons.cancel')}
      isLoading={deleteMutation.isPending}
      showWarningAlert
      warningTitle='危险操作'
      warningDescription='删除后，拥有该角色的用户将失去相关权限。此操作无法还原。'
      itemName='角色'
    />
  )
}
