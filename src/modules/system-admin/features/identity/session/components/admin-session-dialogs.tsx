import { ConfirmDialog } from '@/components/confirm-dialog'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { AdminSessionInfo } from '~/modules/system-admin/shared/hooks/use-admin-session-api'
import { useTranslation } from '~/modules/system-admin/shared/hooks/use-translation'

interface AdminSessionDialogsProps {
    // Confirm dialog
    confirmOpen: boolean
    confirmMode: 'single' | 'bulk'
    selectedCount: number
    isMutating: boolean
    pendingSingleId: string | null
    onConfirmOpenChange: (open: boolean) => void
    onConfirm: () => Promise<void>

    // View dialog
    viewOpen: boolean
    viewSession: AdminSessionInfo | null
    onViewOpenChange: (open: boolean) => void
}

export function AdminSessionDialogs({
    confirmOpen,
    confirmMode,
    selectedCount,
    isMutating,
    pendingSingleId,
    onConfirmOpenChange,
    onConfirm,
    viewOpen,
    viewSession,
    onViewOpenChange,
}: AdminSessionDialogsProps) {
    const { t } = useTranslation()

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
    }

    return (
        <>
            <ConfirmDialog
                destructive
                open={confirmOpen}
                onOpenChange={onConfirmOpenChange}
                title={
                    confirmMode === 'single'
                        ? t('admin.session.confirm.single.title', { defaultMessage: '撤销会话' })
                        : t('admin.session.confirm.bulk.title', { defaultMessage: '批量撤销会话' })
                }
                desc={
                    confirmMode === 'single'
                        ? t('admin.session.confirm.single.desc', { defaultMessage: '确定要撤销该会话吗？' })
                        : t('admin.session.confirm.bulk.desc', { defaultMessage: '确定要撤销选中的会话吗？' })
                }
                confirmText={t('common.delete', { defaultMessage: '确认' })}
                cancelBtnText={t('common.buttons.cancel', { defaultMessage: '取消' })}
                handleConfirm={onConfirm}
                isLoading={isMutating}
                disabled={confirmMode === 'single' ? !pendingSingleId : selectedCount === 0}
            />

            <Dialog open={viewOpen} onOpenChange={onViewOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('admin.session.view.title', { defaultMessage: '会话详情' })}</DialogTitle>
                        <DialogDescription>
                            {t('admin.session.view.desc', { defaultMessage: '查看该会话的详细信息' })}
                        </DialogDescription>
                    </DialogHeader>

                    {viewSession ? (
                        <div className='space-y-2 text-sm'>
                            <div>
                                <span className='text-muted-foreground'>ID：</span>
                                <span className='font-mono'>{viewSession.id}</span>
                            </div>
                            <div>
                                <span className='text-muted-foreground'>UserId：</span>
                                <span className='font-mono'>{viewSession.userId}</span>
                            </div>
                            <div>
                                <span className='text-muted-foreground'>用户名：</span>
                                <span>{viewSession.username || '-'}</span>
                            </div>
                            <div>
                                <span className='text-muted-foreground'>邮箱：</span>
                                <span>{viewSession.email || '-'}</span>
                            </div>
                            <div>
                                <span className='text-muted-foreground'>状态：</span>
                                <span>{viewSession.isActive ? 'active' : 'expired'}</span>
                            </div>
                            <div>
                                <span className='text-muted-foreground'>登录时间：</span>
                                <span>{formatDate(viewSession.loginTime)}</span>
                            </div>
                            <div>
                                <span className='text-muted-foreground'>过期时间：</span>
                                <span>{formatDate(viewSession.expiresAt)}</span>
                            </div>
                            <div>
                                <span className='text-muted-foreground'>IP：</span>
                                <span>{viewSession.ipAddress || '-'}</span>
                            </div>
                            <div>
                                <span className='text-muted-foreground'>UA：</span>
                                <span className='break-words'>{viewSession.userAgent || '-'}</span>
                            </div>
                        </div>
                    ) : null}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant='outline'>{t('common.buttons.close', { defaultMessage: '关闭' })}</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
