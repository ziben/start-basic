import { showSubmittedData } from '@/lib/show-submitted-data'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { NavGroupsImportDialog } from './navgroups-import-dialog'
import { NavGroupsMutateDrawer } from './navgroups-mutate-drawer'
import { useNavGroups } from './navgroups-provider'
import { useDeleteNavgroup } from '~/hooks/useNavgroupApi'
import { useTranslation } from '~/hooks/useTranslation'
import { toast } from 'sonner'

export function NavGroupsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useNavGroups()
  const deleteMutation = useDeleteNavgroup()
  const { t } = useTranslation()
  return (
    <>
      <NavGroupsMutateDrawer
        key='navgroup-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      <NavGroupsImportDialog
        key='navgroups-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      {currentRow && (
        <>
          <NavGroupsMutateDrawer
            key={`navgroup-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key='navgroup-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            handleConfirm={async () => {
              if (!currentRow) return
              try {
                await deleteMutation.mutateAsync(currentRow.id)
                toast.success(t('admin.navgroup.toast.deleteSuccess.title'))
              } catch (err: any) {
                console.error(err)
                toast.error(t('admin.navgroup.toast.deleteError.title'))
              } finally {
                setOpen(null)
                setTimeout(() => {
                  setCurrentRow(null)
                }, 500)
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
          />
        </>
      )}
    </>
  )
}
