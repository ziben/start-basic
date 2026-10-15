import { getErrorMessage } from '@/shared/lib/error-handler'
import { toast } from 'sonner'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { useDeleteNavgroup } from '~/modules/navigation/shared/navgroup/hooks/use-navgroup-api'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { NavGroupsMutateDrawer } from './navgroups-mutate-drawer'
import { useNavGroups } from './navgroups-provider'

export function NavGroupsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useNavGroups()
  const deleteMutation = useDeleteNavgroup()
  const { t } = useTranslation()
  const close = () => {
    if (deleteMutation.isPending) return
    setOpen(null)
    setCurrentRow(null)
  }
  return (
    <>
      <NavGroupsMutateDrawer
        key='navgroup-create'
        open={open === 'create'}
        onOpenChange={(next) => {
          if (!next) close()
        }}
      />

      {currentRow && (
        <>
          <NavGroupsMutateDrawer
            key={`navgroup-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              close()
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key='navgroup-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              close()
            }}
            handleConfirm={async () => {
              if (!currentRow || deleteMutation.isPending) return
              try {
                await deleteMutation.mutateAsync(currentRow.id)
                toast.success(t('admin.navgroup.toast.deleteSuccess.title'))
                setOpen(null)
                setCurrentRow(null)
              } catch (err) {
                toast.error(t('admin.navgroup.toast.deleteError.title'), { description: getErrorMessage(err) })
              }
            }}
            className='max-w-md'
            title={t('admin.navgroup.dialogs.delete.title')}
            desc={
              <>
                {t('admin.navgroup.dialogs.delete.desc')}
                <br />
                <strong>{currentRow.id}</strong>
              </>
            }
            confirmText={t('common.delete')}
            cancelBtnText={t('common.buttons.cancel')}
            isLoading={deleteMutation.isPending}
          />
        </>
      )}
    </>
  )
}
