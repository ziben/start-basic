import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRoleFn } from '@/modules/admin/shared/server-fns/rbac.fn'
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
    <AlertDialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.role.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.role.delete.desc', { name: deleteDialog.role?.displayName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.buttons.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
            {t('common.buttons.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
