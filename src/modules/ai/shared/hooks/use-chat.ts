/**
 * useChat Hook
 * 
 * React Hook for AI chat functionality
 */

import { useChat as useAIChat, fetchServerSentEvents } from '@tanstack/ai-react'

export function useChat() {
    return useAIChat({
        connection: fetchServerSentEvents("/api/chat"),
        initialMessages: [
            {
                id: 'system',
                role: 'system' as const,
                parts: [{ type: 'text', content: '你是一个有帮助的 AI 助手，可以回答用户的问题。请用中文回复。' }],
            },
        ],
        onError: (error) => {
            console.error('Chat error:', error)
        },
    })
}
