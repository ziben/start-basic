import { useState } from 'react'
import { ChatInterface } from './components/chat-interface'
import { ChatSettings } from './components/chat-settings'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, MessageSquare, Trash2, Menu, X } from 'lucide-react'
import { useConversationsQuery, useDeleteConversation, useCreateConversation, useConversationMessagesQuery } from '~/modules/ai/shared/hooks/use-chat-history'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function ChatbotPage() {
    const [activeConversationId, setActiveConversationId] = useState<string | undefined>()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const { data: conversations, isLoading: isLoadingConversations } = useConversationsQuery()
    const { data: messages, isLoading: isLoadingMessages } = useConversationMessagesQuery(activeConversationId)
    const { mutate: deleteConversation } = useDeleteConversation()
    const { mutateAsync: createConversation, isPending: isCreating } = useCreateConversation()

    const handleNewChat = async () => {
        setActiveConversationId(undefined)
        if (window.innerWidth < 768) setIsSidebarOpen(false)
    }

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (confirm('确定要删除这条对话记录吗？')) {
            deleteConversation(id)
            if (activeConversationId === id) {
                setActiveConversationId(undefined)
            }
        }
    }

    // Convert API messages to UIMessages
    const initialMessages = messages?.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        parts: [{ type: 'text' as const, content: m.content }]
    }))

    return (
        <div className="container mx-auto h-[calc(100vh-4rem)] py-6 px-4 md:px-6">
            <div className="flex h-full border rounded-lg overflow-hidden bg-background shadow-sm relative">

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={`
                    absolute md:relative z-50 flex flex-col w-72 h-full border-r bg-muted/30 transition-transform duration-300
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    <div className="p-4 border-b flex justify-between items-center bg-background/50 backdrop-blur-sm">
                        <span className="font-semibold text-sm">对话历史</span>
                        <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={handleNewChat} title="新建对话">
                                <Plus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {isLoadingConversations ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">加载中...</div>
                            ) : conversations?.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">空空如也</div>
                            ) : (
                                conversations?.map(conv => (
                                    <div
                                        key={conv.id}
                                        onClick={() => {
                                            setActiveConversationId(conv.id)
                                            if (window.innerWidth < 768) setIsSidebarOpen(false)
                                        }}
                                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${activeConversationId === conv.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="truncate text-sm">
                                                <div className="truncate font-medium">{conv.title}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {format(new Date(conv.updatedAt), 'MM-dd HH:mm', { locale: zhCN })}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => handleDelete(e, conv.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    <div className="p-4 border-b flex items-center justify-between shadow-sm z-10">
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setIsSidebarOpen(true)}>
                                <Menu className="h-5 w-5" />
                            </Button>
                            <h1 className="font-semibold">{activeConversationId ? conversations?.find(c => c.id === activeConversationId)?.title || '对话' : '新对话'}</h1>
                        </div>
                        <ChatSettings />
                    </div>
                    <div className="flex-1 relative">
                        {/* We use a key to completely remount ChatInterface when conversationId or initialMessages change */}
                        {isLoadingMessages ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">读取记录中...</div>
                        ) : (
                            <ChatInterface
                                key={activeConversationId || 'new'}
                                conversationId={activeConversationId}
                                initialMessages={initialMessages}
                            />
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
