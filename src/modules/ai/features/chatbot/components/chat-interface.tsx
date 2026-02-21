/**
 * Chat Interface Component
 * 
 * AI 聊天界面主组件
 */

import { useChat } from '~/modules/ai/shared/hooks/use-chat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, Copy, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

// Markdown imports
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css' // Highlight theme
import type { UIMessage } from '@tanstack/ai'

export function ChatInterface({
    conversationId,
    initialMessages
}: {
    conversationId?: string;
    initialMessages?: UIMessage[]
} = {}) {
    const [input, setInput] = useState("");
    const { messages, sendMessage, isLoading } = useChat({ conversationId, initialMessages })
    const bottomRef = useRef<HTMLDivElement>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Auto scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            sendMessage(input);
            setInput("");
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* 消息列表 */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {messages
                        .filter((m) => m.role !== 'system') // 不显示系统消息
                        .map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                            >
                                <div
                                    className={`relative max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 ${message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                        }`}
                                >
                                    {/* Copy Action for Assistant */}
                                    {message.role !== 'user' && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                onClick={() => handleCopy(message.id, message.parts.map(p => p.type === 'text' ? p.content : '').join(''))}
                                                title="复制文本"
                                            >
                                                {copiedId === message.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    )}

                                    {message.parts.map((part, idx) => {
                                        if (part.type === "thinking") {
                                            return (
                                                <div
                                                    key={idx}
                                                    className="text-sm text-muted-foreground italic mb-3 border-l-2 pl-3 border-gray-400"
                                                >
                                                    💭 深度思考: {part.content}
                                                </div>
                                            );
                                        }
                                        if (part.type === "text") {
                                            return (
                                                <div key={idx} className={`prose prose-sm dark:prose-invert max-w-none break-words ${message.role !== 'user' ? 'pt-2' : ''}`}>
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        rehypePlugins={[rehypeRaw, rehypeHighlight]}
                                                    >
                                                        {part.content}
                                                    </ReactMarkdown>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        ))}

                    {/* 加载指示器 */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-2xl px-5 py-4">
                                <div className="flex items-center space-x-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">AI 正在思考...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 滚动锚点 */}
                    <div ref={bottomRef} className="h-4" />
                </div>
            </ScrollArea>

            {/* 输入框 */}
            <div className="border-t p-4 bg-background">
                <form onSubmit={handleSubmit} className="flex space-x-2 items-end max-w-4xl mx-auto">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="输入消息... (Shift+Enter 换行)"
                        className="flex-1 min-h-[60px] max-h-[200px] resize-none p-3 shadow-sm border-muted-foreground/20 focus-visible:ring-1"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            // Shift+Enter 换行，Enter 发送
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit(e as any)
                            }
                        }}
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        size="icon"
                        className="h-[60px] w-[60px] rounded-xl shrink-0"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}
