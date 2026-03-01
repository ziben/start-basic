import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bulkDeleteMembersFn } from '~/modules/admin/features/organization/members/server-fns/member.fn'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { memberQueryKeys } from '~/shared/lib/query-keys'
import { useMembersOptimisticUpdate, createBulkDeleteUpdateFn } from '../hooks/use-members-optimistic-update'
import { MemberMutateDialog } from './member-mutate-dialog'
import { useMembers } from './members-provider'

export function MembersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useMembers()
  const { getOptimisticMutationOptions } = useMembersOptimisticUpdate()

  const deleteOneMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await bulkDeleteMembersFn({ data: { ids: [input.id] } })
    },
    ...getOptimisticMutationOptions({
      queryKey: memberQueryKeys.all,
      updateFn: (members, variables) => createBulkDeleteUpdateFn(members, [variables.id]),
    }),
  })

  useEffect(() => {
    if (!open) {
      setCurrentRow(null)
    }
  }, [open, setCurrentRow])

  return (
    <>
      <MemberMutateDialog key='member-create' open={open === 'create'} onOpenChange={() => setOpen('create')} />

      {currentRow && (
        <>
          <MemberMutateDialog
            key={`member-edit-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => setOpen('update')}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key={`member-delete-${currentRow.id}`}
            destructive
            open={open === 'delete'}
            onOpenChange={() => setOpen('delete')}
            handleConfirm={() => {
              const id = currentRow.id
              setOpen(null)

              const promise = deleteOneMutation.mutateAsync({ id })
              toast.promise(promise, {
                loading: '删除中...',
                success: () => `已移除成员 ${currentRow.username}`,
                error: String,
              })
            }}
            className='max-w-md'
            title={`移除成员: ${currentRow.username}?`}
            desc={
              <>
                确定要从组织 <strong>{currentRow.organizationName}</strong> 中移除成员{' '}
                <strong>{currentRow.username}</strong> 吗？
                <br />
                此操作无法撤销。
              </>
            }
            confirmText='移除'
          />
        </>
      )}
    </>
  )
}
