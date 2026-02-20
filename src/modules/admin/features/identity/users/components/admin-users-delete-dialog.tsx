import { type ReactElement } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/shared/lib/error-handler'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { adminUsersQueryKeys } from '~/shared/lib/query-keys'
import { bulkDeleteUsersFn } from '../../../../shared/server-fns/user.fn'
import { useUsersOptimisticUpdate, createBulkDeleteUpdateFn } from '../hooks/use-users-optimistic-update'
import { type AdminUser } from '../data/schema'

type Props = {
    row: AdminUser | null
    open: boolean
    onClose: () => void
}

export function AdminUsersDeleteDialog({ row, open, onClose }: Props): ReactElement {
    const { getOptimisticMutationOptions } = useUsersOptimisticUpdate()

    const deleteMutation = useMutation({
        mutationFn: async (input: { id: string }) => {
            return await bulkDeleteUsersFn({ data: { ids: [input.id] } })
        },
        ...getOptimisticMutationOptions({
            queryKey: adminUsersQueryKeys.all,
            updateFn: (users, variables) => createBulkDeleteUpdateFn(users, [variables.id]),
        }),
    })

    const handleConfirm = (): void => {
        if (!row) return

        const { id, name } = row

        const promise = deleteMutation.mutateAsync({ id })

        toast.promise(promise, {
            loading: '正在删除用户…',
            success: () => {
                onClose()
                return `用户 "${name || id}" 已删除`
            },
            error: (err) => getErrorMessage(err),
        })
    }

    return (
        <ConfirmDeleteDialog
            open={open}
            onOpenChange={(o) => {
                if (!o) onClose()
            }}
            onConfirm={handleConfirm}
            title={<span className='text-destructive'>确认删除用户？</span>}
            description={
                <>
                    即将永久删除用户{' '}
                    <code className='mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-sm'>
                        {row?.name || row?.id}
                    </code>
                    。
                    <br />
                    此操作不可撤销，用户的所有数据将被清除。
                </>
            }
            confirmText='删除'
            cancelText='取消'
            isLoading={deleteMutation.isPending}
            showWarningAlert
            warningTitle='危险操作'
            warningDescription='删除后用户将无法登录，且所有关联数据（登录记录、权限等）将永久丢失。'
        />
    )
}
