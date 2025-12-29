import { toast } from 'sonner'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'
import { useDeleteTranslation } from '~/modules/system-admin/shared/hooks/use-translation-api'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { TranslationsImportDialog } from './translations-import-dialog'
import { TranslationsMutateDrawer } from './translations-mutate-drawer'
import { useTranslations } from './translations-provider'

export function TranslationsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useTranslations()
  const deleteMutation = useDeleteTranslation()
  const { t } = useTranslation()
  return (
    <>
      <TranslationsMutateDrawer
        key='translations-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      <TranslationsImportDialog
        key='translations-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      {currentRow && (
        <>
          <TranslationsMutateDrawer
            key={`translation-update-${currentRow.id}`}
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
            key='translation-delete'
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
                toast.success(t('admin.translation.toast.deleteSuccess.title'))
              } catch (err: any) {
                console.error(err)
                toast.error(t('admin.translation.toast.deleteError.title'))
              } finally {
                setOpen(null)
                setTimeout(() => {
                  setCurrentRow(null)
                }, 500)
              }
            }}
            className='max-w-md'
            title={t('admin.translation.dialogs.delete.title')}
            desc={
              <>
                {t('admin.translation.dialogs.delete.desc')}
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





