/**
 * AI Chatbot Page
 */

import { ChatInterface } from './components/chat-interface'

export function ChatbotPage() {
    return (
        <div className="container mx-auto h-[calc(100vh-4rem)] py-6">
            <div className="h-full flex flex-col">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold tracking-tight">AI 助手</h1>
                    <p className="text-muted-foreground">与 AI 对话，获取帮助和解答</p>
                </div>

                <div className="flex-1 border rounded-lg overflow-hidden bg-background shadow-sm">
                    <ChatInterface />
                </div>
            </div>
        </div>
    )
}
