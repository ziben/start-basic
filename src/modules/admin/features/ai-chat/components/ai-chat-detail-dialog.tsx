/**
 * AI Chat Admin - 会话详情弹窗
 */

import { useState } from 'react'
import type { ReactElement } from 'react'
import ReactMarkdown from 'react-markdown'
import { Maximize2Icon, Minimize2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAIConversation, type AIConversationDetail } from '../hooks/use-ai-chat-query'

interface Props {
    conversationId: string | null
    open: boolean
    onClose: () => void
}

function formatDate(date: Date | string): string {
    const d = new Date(date)
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function MessageItem({
    message,
    isLast,
}: Readonly<{ message: AIConversationDetail['messages'][0]; isLast: boolean }>): ReactElement {
    const isUser = message.role === 'user'
    const modelLabel = message.model ?? 'unknown'
    const inputTokensLabel = message.inputTokens ?? '-'
    const outputTokensLabel = message.outputTokens ?? '-'
    const totalTokensLabel = message.totalTokens ?? '-'

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-lg p-3 ${
                    isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
            >
                <div className='mb-1 text-xs opacity-70'>
                    {isUser ? '用户' : 'AI'} · {formatDate(message.createdAt)}
                    <span className='ml-2'>
                        · model: {modelLabel} · token: {inputTokensLabel}/{outputTokensLabel}/{totalTokensLabel}
                    </span>
                </div>
                <div className='prose prose-sm dark:prose-invert max-w-none'>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {isLast && message.totalTokens !== null && (
                    <div className='mt-2 border-t pt-2 text-xs opacity-70'>
                        本次会话共消耗 {message.totalTokens} tokens
                    </div>
                )}
            </div>
        </div>
    )
}

export function AIChatDetailDialog({ conversationId, open, onClose }: Props): ReactElement {
    const [isMaximized, setIsMaximized] = useState(false)
    const { data: conversation, isLoading } = useAIConversation(conversationId ?? undefined)

    const sizeClass = isMaximized
        ? 'inset-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0'
        : 'max-w-3xl max-h-[80vh]'

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) {
                    setIsMaximized(false)
                    onClose()
                }
            }}
        >
            <DialogContent className={`${sizeClass} flex flex-col`}>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        {conversation?.title || '会话详情'}
                        {conversation && conversation.totalTokens !== null && (
                            <Badge variant='secondary' className='ml-2'>
                                总计 {conversation.totalTokens} tokens
                            </Badge>
                        )}
                    </DialogTitle>
                    {conversation && (
                        <div className='text-sm text-muted-foreground'>
                            用户: {conversation.userName || '-'} ({conversation.userEmail || '-'})
                        </div>
                    )}
                    <button
                        type='button'
                        onClick={() => setIsMaximized(!isMaximized)}
                        className='absolute top-4 right-12 rounded-xs p-1 opacity-70 transition-opacity hover:bg-muted hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden'
                        aria-label={isMaximized ? '最小化' : '最大化'}
                    >
                        {isMaximized ? <Minimize2Icon className='size-4' /> : <Maximize2Icon className='size-4' />}
                    </button>
                </DialogHeader>

                {isLoading ? (
                    <div className='flex-1 py-8 text-center text-muted-foreground'>加载中…</div>
                ) : conversation?.messages.length ? (
                    <ScrollArea className={isMaximized ? 'flex-1 min-h-0 pr-4' : 'h-[400px] pr-4'}>
                        <div className='space-y-4 py-2'>
                            {conversation.messages.map((msg, idx) => (
                                <MessageItem
                                    key={msg.id}
                                    message={msg}
                                    isLast={idx === conversation.messages.length - 1}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className='flex-1 py-8 text-center text-muted-foreground'>暂无消息</div>
                )}
            </DialogContent>
        </Dialog>
    )
}
