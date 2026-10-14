import { getErrorMessage } from '@/shared/lib/error-handler'
import { toast } from 'sonner'
import { useDeleteTranslation } from '~/modules/admin/features/i18n/translation/hooks/use-translation-api'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { TranslationsMutateDrawer } from './translations-mutate-drawer'
import { useTranslations } from './translations-provider'

export function TranslationsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useTranslations()
  const deleteMutation = useDeleteTranslation()
  const { t } = useTranslation()
  const close = () => {
    if (deleteMutation.isPending) return
    setOpen(null)
    setCurrentRow(null)
  }
  return (
    <>
      <TranslationsMutateDrawer
        key='translations-create'
        open={open === 'create'}
        onOpenChange={(next) => {
          if (!next) close()
        }}
      />

      {currentRow && (
        <>
          <TranslationsMutateDrawer
            key={`translation-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              close()
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key='translation-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              close()
            }}
            handleConfirm={async () => {
              if (!currentRow || deleteMutation.isPending) return
              try {
                await deleteMutation.mutateAsync(currentRow.id)
                toast.success(t('admin.translation.toast.deleteSuccess.title'))
                setOpen(null)
                setCurrentRow(null)
              } catch (err) {
                toast.error(t('admin.translation.toast.deleteError.title'), { description: getErrorMessage(err) })
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
            cancelBtnText={t('common.buttons.cancel')}
            isLoading={deleteMutation.isPending}
          />
        </>
      )}
    </>
  )
}
