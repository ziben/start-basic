import { type ReactElement } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/shared/lib/error-handler'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import type { SystemConfig } from '../data/schema'
import { useDeleteSystemConfig } from '../hooks/use-system-config-query'

type Props = {
    row: SystemConfig | null
    open: boolean
    onClose: () => void
}

export function SystemConfigDeleteDialog({ row, open, onClose }: Props): ReactElement {
    const deleteMutation = useDeleteSystemConfig()

    const handleConfirm = (): void => {
        if (!row) return

        const promise = deleteMutation.mutateAsync({ id: row.id })

        toast.promise(promise, {
            loading: '正在删除…',
            success: () => {
                onClose()
                return `配置 "${row.key}" 已删除`
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
            title={
                <span className='text-destructive'>
                    确认删除配置？
                </span>
            }
            description={
                <>
                    即将删除配置项 <code className='mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-sm'>{row?.key}</code>
                    。<br />
                    此操作不可撤销，删除后该配置将永久丢失。
                </>
            }
            confirmText='删除'
            cancelText='取消'
            confirmWord={row?.key}
            isLoading={deleteMutation.isPending}
            showWarningAlert
            warningTitle='危险操作'
            warningDescription='系统配置与业务逻辑强相关，删除可能导致功能异常。请确认该配置已不再被系统引用。'
        />
    )
}
