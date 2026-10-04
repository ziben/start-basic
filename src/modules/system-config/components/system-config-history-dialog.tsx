import { type ReactElement } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, UserIcon, FileTextIcon, HistoryIcon, ArrowDownIcon } from 'lucide-react'
import type { SystemConfig } from '../data/schema'
import { useSystemConfigHistory } from '../hooks/use-system-config-query'
import { Skeleton } from '@/components/ui/skeleton'

export type HistoryDialogProps = {
    row: SystemConfig
    open: boolean
    onClose: () => void
}

export function SystemConfigHistoryDialog({ row, open, onClose }: HistoryDialogProps): ReactElement {
    const { data: history, isLoading } = useSystemConfigHistory(row.id, {
        enabled: open,
    })

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className='max-w-3xl max-h-[85vh] flex flex-col'>
                <DialogHeader>
                    <DialogTitle>变更历史</DialogTitle>
                    <DialogDescription className='font-mono text-xs'>
                        {row.key} (V{row.version})
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className='flex-1 pr-4 -mr-4 min-h-[300px]'>
                    {isLoading ? (
                        <div className='space-y-6 pt-2'>
                            <Skeleton className='h-32 w-full' />
                            <Skeleton className='h-32 w-full' />
                            <Skeleton className='h-32 w-full' />
                        </div>
                    ) : !history?.length ? (
                        <div className='flex h-[200px] items-center justify-center text-muted-foreground'>
                            暂无变更记录
                        </div>
                    ) : (
                        <div className='relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:border-l-2 before:border-dashed before:border-muted/50 pb-6 pt-2 pl-2'>
                            {history.map((record) => (
                                <div key={record.id} className='relative pl-12 sm:pl-16'>
                                    <span className='absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full bg-background border shadow-sm ring-4 ring-background'>
                                        {record.changeType === 'CREATE' ? (
                                            <HistoryIcon className='h-4 w-4 text-emerald-500' />
                                        ) : record.changeType === 'DELETE' ? (
                                            <HistoryIcon className='h-4 w-4 text-destructive' />
                                        ) : (
                                            <HistoryIcon className='h-4 w-4 text-blue-500' />
                                        )}
                                    </span>
                                    <div className='flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm relative'>
                                        <div className='flex items-center justify-between border-b pb-2 sm:pb-3'>
                                            <div className='flex items-center gap-2'>
                                                <Badge
                                                    variant={
                                                        record.changeType === 'CREATE'
                                                            ? 'default'
                                                            : record.changeType === 'DELETE'
                                                                ? 'destructive'
                                                                : 'outline'
                                                    }
                                                    className='font-mono'
                                                >
                                                    {record.changeType}
                                                </Badge>
                                                <span className='text-xs text-muted-foreground flex items-center gap-1'>
                                                    <UserIcon className='h-3 w-3' />
                                                    {record.operatorName || 'System'}
                                                </span>
                                            </div>
                                            <time className='text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap'>
                                                <CalendarIcon className='h-3 w-3' />
                                                {new Date(record.createdAt).toLocaleString()}
                                            </time>
                                        </div>

                                        {record.note && (
                                            <div className='flex items-start gap-1.5 text-sm text-foreground my-1 bg-muted/30 p-2 rounded'>
                                                <FileTextIcon className='mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground' />
                                                <span className='leading-tight'>{record.note}</span>
                                            </div>
                                        )}

                                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2'>
                                            {record.oldValue !== null && record.oldValue !== record.newValue && (
                                                <div className='flex flex-col gap-1.5'>
                                                    <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                                                        变更前
                                                    </span>
                                                    <div className='relative rounded-md border border-orange-200 bg-orange-50/50 p-2 text-xs font-mono text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-200 break-words'>
                                                        {row.isSecret ? '******' : record.oldValue || '—'}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Only show 'After' if it's different from 'Before' or if it's a creation */}
                                            <div className='flex flex-col gap-1.5'>
                                                <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                                                    变更后
                                                </span>
                                                <div
                                                    className={`relative rounded-md border p-2 text-xs font-mono break-words ${record.changeType === 'DELETE'
                                                        ? 'border-red-200 bg-red-50/50 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200'
                                                        : record.changeType === 'CREATE'
                                                            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200'
                                                            : 'border-blue-200 bg-blue-50/50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200'
                                                        }`}
                                                >
                                                    {row.isSecret ? '******' : (record.newValue === null && record.changeType === 'DELETE' ? '— (已删除)' : record.newValue || '—')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowDownIcon className='h-4 w-4 text-muted/40 absolute -bottom-5 left-[22px] bg-background sm:-bottom-7 sm:left-[30px]' />
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
