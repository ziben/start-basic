/**
 * Chat Interface Component
 *
 * AI 聊天界面主组件：消息列表 + 输入框
 */
import 'highlight.js/styles/github-dark.css'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from '@tanstack/ai'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Bot, ChevronDown, Check, Copy, Loader2, Send, Sparkles, Square, User, Volume2 } from 'lucide-react'
import { useTTSPlayer } from '~/shared/hooks/use-tts-player'
import { useChat } from '~/modules/ai/shared/hooks/use-chat'
import { cn } from '~/shared/lib/utils'

// ─── 类型 ─────────────────────────────────────────────────────────────────────

interface ChatInterfaceProps {
    conversationId?: string
    initialMessages?: UIMessage[]
    onFirstMessage?: () => void // 新对话发出第一条消息后回调（用于刷新侧边栏）
}

// ─── 辅助：提取 parts 纯文本 ──────────────────────────────────────────────────

function getPlainText(parts: UIMessage['parts']): string {
    return parts
        .map((p) => (p.type === 'text' ? p.content : ''))
        .join('')
}

// ─── 子组件：思考过程折叠块 ─────────────────────────────────────────────────────

function ThinkingBlock({ parts }: { parts: UIMessage['parts'] }) {
    const [open, setOpen] = useState(false)
    const thinkingText = parts
        .map((p) => (p.type === 'thinking' ? p.content : ''))
        .join('')

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
                <button
                    className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground/70
            hover:text-muted-foreground transition-colors group"
                >
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
            bg-muted-foreground/10 group-hover:bg-muted-foreground/15 transition-colors">
                        <span>💭</span>
                        <span>思考过程</span>
                    </span>
                    <ChevronDown
                        className={cn(
                            'h-3 w-3 transition-transform duration-200',
                            open && 'rotate-180',
                        )}
                    />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="mb-3 pb-3 border-b border-border/30 text-xs text-muted-foreground
          italic leading-relaxed whitespace-pre-wrap break-words
          max-h-48 overflow-y-auto">
                    {thinkingText}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

// ─── 子组件：单条消息气泡 ─────────────────────────────────────────────────────

function MessageBubble({ message }: { message: UIMessage }) {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === 'user'
    const plainText = getPlainText(message.parts)

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(plainText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [plainText])

    // TTS 朗读：只对 assistant 消息启用
    const tts = useTTSPlayer(!isUser ? message.id : null)

    return (
        <div className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}>
            {/* 头像 */}
            <div
                className={cn(
                    'shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5',
                    isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border border-border',
                )}
            >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* 气泡 */}
            <div className={cn('relative max-w-[80%] md:max-w-[72%]', isUser ? 'items-end' : 'items-start')}>
                <div
                    className={cn(
                        'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                        isUser
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-muted text-foreground rounded-tl-sm border border-border/50',
                    )}
                >
                    {/* Thinking parts —— 可折叠 */}
                    {message.parts.some((p) => p.type === 'thinking') && (
                        <ThinkingBlock
                            parts={message.parts.filter((p) => p.type === 'thinking')}
                        />
                    )}

                    {/* Text parts */}
                    {message.parts
                        .filter((p) => p.type === 'text')
                        .map((p, i) =>
                            isUser ? (
                                <p key={i} className="whitespace-pre-wrap break-words">
                                    {p.content}
                                </p>
                            ) : (
                                <div
                                    key={i}
                                    className="prose prose-sm dark:prose-invert max-w-none break-words
                    prose-p:my-1.5 prose-pre:my-2 prose-headings:my-2
                    prose-code:text-xs prose-pre:rounded-lg"
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw, rehypeHighlight]}
                                    >
                                        {p.content}
                                    </ReactMarkdown>
                                </div>
                            ),
                        )}
                </div>

                {/* 工具栏：复制 + 朗读（仅 assistant，hover 显示） */}
                {!isUser && plainText && (
                    <div className="absolute -bottom-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* 朗读按钮 */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'h-6 w-6 rounded-full bg-background border border-border shadow-sm hover:bg-muted',
                                tts.isPlaying && 'text-primary border-primary/40',
                                tts.error && 'text-destructive border-destructive/40',
                            )}
                            onClick={() => (tts.isPlaying ? tts.stop() : tts.play())}
                            disabled={tts.isLoading}
                            title={tts.error ?? (tts.isPlaying ? '停止朗读' : '朗读消息')}
                        >
                            {tts.isLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            ) : tts.isPlaying ? (
                                <Square className="h-3 w-3" />
                            ) : (
                                <Volume2 className="h-3 w-3 text-muted-foreground" />
                            )}
                        </Button>

                        {/* 复制按钮 */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-background border border-border shadow-sm hover:bg-muted"
                            onClick={handleCopy}
                            title="复制文本"
                        >
                            {copied ? (
                                <Check className="h-3 w-3 text-green-500" />
                            ) : (
                                <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── 子组件：打字指示器 ───────────────────────────────────────────────────────

function TypingIndicator() {
    return (
        <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center mt-0.5">
                <Bot className="w-4 h-4" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm border border-border/50 px-4 py-3">
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── 子组件：空状态引导 ───────────────────────────────────────────────────────

const QUICK_HINTS = [
    '帮我写一段 TypeScript 接口',
    '解释一下 useEffect 的执行时机',
    '给这段代码做 Code Review',
    '帮我整理一份会议议程',
]

function EmptyState({ onHintClick }: { onHintClick: (hint: string) => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-5 py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
                <h3 className="font-semibold text-lg">有什么可以帮你？</h3>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
                    支持 Markdown、代码高亮，可以问我任何问题。
                </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {QUICK_HINTS.map((hint) => (
                    <button
                        key={hint}
                        onClick={() => onHintClick(hint)}
                        className="text-xs border rounded-full px-3.5 py-1.5 text-muted-foreground
              hover:border-primary/50 hover:text-primary hover:bg-primary/5
              transition-colors cursor-pointer"
                    >
                        {hint}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function ChatInterface({
    conversationId,
    initialMessages,
    onFirstMessage,
}: ChatInterfaceProps = {}) {
    const [input, setInput] = useState('')
    const { messages, sendMessage, isLoading } = useChat({ conversationId, initialMessages })
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const onFirstMessageRef = useRef(onFirstMessage)
    const hasSentFirstRef = useRef(false)

    // 保持 callback ref 最新
    onFirstMessageRef.current = onFirstMessage

    const visibleMessages = messages.filter((m) => m.role !== 'system')

    // ── 滚动到底部 ───────────────────────────────────────────────────────────────
    // 不用 scrollIntoView（作用于 window），直接操作滚动容器的 scrollTop
    const scrollToBottom = useCallback((smooth = true) => {
        const el = scrollContainerRef.current
        if (!el) return
        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
    }, [])

    // 消息变化时滚动（首次不要动画，后续 smooth）
    useLayoutEffect(() => {
        scrollToBottom(visibleMessages.length > 1)
    }, [visibleMessages.length, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

    // 发送完成后聚焦 textarea
    useEffect(() => {
        if (!isLoading) {
            textareaRef.current?.focus()
        }
    }, [isLoading])

    // ── Textarea 自动撑高 ────────────────────────────────────────────────────────
    const adjustTextareaHeight = useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 180)}px`
    }, [])

    // ── 发送 ──────────────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(
        (text?: string) => {
            const trimmed = (text ?? input).trim()
            if (!trimmed || isLoading) return

            // 新对话第一条消息后通知父组件刷新对话列表
            if (!conversationId && !hasSentFirstRef.current) {
                hasSentFirstRef.current = true
                // 延迟 1s 等服务端创建完对话后再刷新
                setTimeout(() => onFirstMessageRef.current?.(), 1000)
            }

            sendMessage(trimmed)
            setInput('')
            // 重置 textarea 高度
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        },
        [input, isLoading, conversationId, sendMessage],
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
            }
        },
        [handleSubmit],
    )

    return (
        <div className="flex flex-col h-full">
            {/* ── 消息列表 ──────────────────────────────────────────────── */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth"
            >
                {visibleMessages.length === 0 && !isLoading ? (
                    <EmptyState onHintClick={(hint) => handleSubmit(hint)} />
                ) : (
                    <div className="space-y-5 max-w-3xl mx-auto pb-2">
                        {visibleMessages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}

                        {isLoading && <TypingIndicator />}
                    </div>
                )}
            </div>

            {/* ── 输入区 ───────────────────────────────────────────────── */}
            <div className="shrink-0 border-t bg-background/95 backdrop-blur-sm px-4 py-3">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
                    className="flex gap-2 items-end max-w-3xl mx-auto"
                >
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value)
                            adjustTextareaHeight()
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="输入消息... （Enter 发送，Shift+Enter 换行）"
                        className="flex-1 min-h-[52px] resize-none text-sm py-3 px-3.5 rounded-xl
              border-muted-foreground/20 focus-visible:ring-1 shadow-sm overflow-hidden"
                        disabled={isLoading}
                        rows={1}
                        style={{ maxHeight: '180px' }}
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        size="icon"
                        className="h-[52px] w-[52px] rounded-xl shrink-0 shadow-sm"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
                <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
                    AI 可能会犯错，请核实重要信息。
                </p>
            </div>
        </div>
    )
}
