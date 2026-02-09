/**
 * Chat Interface Component
 * 
 * AI 聊天界面主组件
 */

import { useChat } from '~/modules/ai/shared/hooks/use-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send } from 'lucide-react'
import { useState } from 'react'

export function ChatInterface() {
    const [input, setInput] = useState("");
    const { messages, sendMessage, isLoading } = useChat()
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
                <div className="space-y-4">
                    {messages
                        .filter((m) => m.role !== 'system') // 不显示系统消息
                        .map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg px-4 py-2 ${message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                        }`}
                                >
                                    {message.parts.map((part, idx) => {
                                        if (part.type === "thinking") {
                                            return (
                                                <div
                                                    key={idx}
                                                    className="text-sm text-gray-500 italic mb-2"
                                                >
                                                    💭 Thinking: {part.content}
                                                </div>
                                            );
                                        }
                                        if (part.type === "text") {
                                            return <div key={idx}>{part.content}</div>;
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        ))}

                    {/* 加载指示器 */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-lg px-4 py-2">
                                <div className="flex items-center space-x-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">AI 正在思考...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* 输入框 */}
            <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="输入消息... (Shift+Enter 换行)"
                        className="flex-1"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            // Shift+Enter 换行，Enter 发送
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit(e as any)
                            }
                        }}
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}
