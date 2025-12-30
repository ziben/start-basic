import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeleteRole } from '~/modules/system-admin/shared/hooks/use-role-api'
import { useRolesContext } from '../context/roles-context'

export function AdminRolesDeleteDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useRolesContext()
  const deleteRole = useDeleteRole()

  const handleConfirm = async () => {
    if (!currentRow) return
    try {
      await deleteRole.mutateAsync(currentRow.id)
      toast.success('角色已删除')
      setOpen(null)
      setCurrentRow(null)
    } catch (error) {
      toast.error('删除失败', {
        description: error instanceof Error ? error.message : '未知错误',
      })
    }
  }

  return (
    <ConfirmDialog
      destructive
      open={open === 'delete'}
      onOpenChange={(v) => {
        if (!v) {
          setOpen(null)
          setCurrentRow(null)
        }
      }}
      title='删除角色'
      desc={`确定要删除角色 "${currentRow?.label}" 吗？此操作不可撤销，且会影响关联的用户。`}
      confirmText='确认删除'
      isLoading={deleteRole.isPending}
      handleConfirm={handleConfirm}
    />
  )
}
