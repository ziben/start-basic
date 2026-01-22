import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bulkDeleteOrganizationsFn } from '../../../../shared/server-fns/organization.fn'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { organizationQueryKeys } from '~/shared/lib/query-keys'
import { useOrganizationsOptimisticUpdate, createBulkDeleteUpdateFn } from '../hooks/use-organizations-optimistic-update'
import { OrganizationMutateDialog } from './organization-mutate-dialog'
import { useOrganizations } from './organizations-provider'

export function OrganizationsDialogs() {
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
                loading: '删除中...',
                success: () => `已删除组织 ${currentRow.name}`,
                error: String,
              })
            }}
            className='max-w-md'
            title={`删除组织: ${currentRow.name}?`}
            desc={
              <>
                确定要删除组织 <strong>{currentRow.name}</strong> 吗？
                <br />
                此操作无法撤销，该组织下的所有数据将被永久删除。
              </>
            }
            confirmText='删除'
          />
        </>
      )}
    </>
  )
}
