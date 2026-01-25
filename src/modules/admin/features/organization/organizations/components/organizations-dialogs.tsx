import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bulkDeleteOrganizationsFn } from '../../../../shared/server-fns/organization.fn'
import { useTranslation } from '~/modules/admin/shared/hooks/use-translation'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { organizationQueryKeys } from '~/shared/lib/query-keys'
import { useOrganizationsOptimisticUpdate, createBulkDeleteUpdateFn } from '../hooks/use-organizations-optimistic-update'
import { OrganizationMutateDialog } from './organization-mutate-dialog'
import { useOrganizations } from './organizations-provider'

export function OrganizationsDialogs() {
  const { t } = useTranslation()
  const { open, setOpen, currentRow, setCurrentRow } = useOrganizations()
  const { getOptimisticMutationOptions } = useOrganizationsOptimisticUpdate()

  const deleteOneMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await bulkDeleteOrganizationsFn({ data: { ids: [input.id] } })
    },
    ...getOptimisticMutationOptions({
      queryKey: organizationQueryKeys.all,
      updateFn: (organizations, variables) => createBulkDeleteUpdateFn(organizations, [variables.id]),
    }),
  })

  useEffect(() => {
    if (!open) {
      setCurrentRow(null)
    }
  }, [open, setCurrentRow])

  return (
    <>
      <OrganizationMutateDialog
        key='organization-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      {currentRow && (
        <>
          <OrganizationMutateDialog
            key={`organization-edit-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => setOpen('update')}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key={`organization-delete-${currentRow.id}`}
            destructive
            open={open === 'delete'}
            onOpenChange={() => setOpen('delete')}
            handleConfirm={() => {
              const id = currentRow.id
              setOpen(null)

              const promise = deleteOneMutation.mutateAsync({ id })
              toast.promise(promise, {
                loading: t('admin.organization.toast.delete.loading'),
                success: () => t('admin.organization.toast.delete.success', { name: currentRow.name }),
                error: String,
              })
            }}
            className='max-w-md'
            title={t('admin.organization.delete.title', { name: currentRow.name })}
            desc={
              <>
                {t('admin.organization.delete.desc', { name: currentRow.name })}
              </>
            }
            confirmText={t('common.buttons.delete')}
          />
        </>
      )}
    </>
  )
}
