/**
 * useChat Hook
 * 
 * React Hook for AI chat functionality
 */

import { useChat as useAIChat, fetchServerSentEvents } from '@tanstack/ai-react'
import type { UIMessage } from '@tanstack/ai'
import { useAIConfig } from './use-ai-config'

interface UseChatOptions {
    conversationId?: string;
    initialMessages?: UIMessage[];
}

export function useChat({ conversationId, initialMessages }: UseChatOptions = {}) {
    const { config } = useAIConfig()

    return useAIChat({
        connection: fetchServerSentEvents("/api/chat", {
            body: conversationId ? { conversationId, temperature: config.temperature, modelProvider: config.modelProvider } : { temperature: config.temperature, modelProvider: config.modelProvider }
        }),
        initialMessages: initialMessages?.length ? initialMessages : [
            {
                id: 'system',
                role: 'system' as const,
                parts: [{ type: 'text', content: config.systemPrompt }],
            },
        ],
        conversationId,
        onError: (error) => {
            console.error('Chat error:', error)
        },
    })
}
