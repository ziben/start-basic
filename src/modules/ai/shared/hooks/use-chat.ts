/**
 * useChat Hook
 *
 * React Hook for AI chat functionality
 *
 * 【重要说明 - 请求体结构】
 * TanStack AI 内部的 ChatClient 在发送请求时：
 *   requestBody = {
 *     messages,
 *     data: mergedBody,           ← = { ...ChatClient.body, conversationId: this.uniqueId }
 *     ...fetchServerSentEvents.body  ← connection 里的 body，展开在顶层
 *   }
 *
 * ❗❗ ChatClient 会将 data.conversationId 强制覆盖为内部生成的 this.uniqueId，
 *    因此我们的数据库对话 ID 不能放在 this.body 里传递。
 *    改用 dbConversationId 作为字段名，在 fetchServerSentEvents.body 顶层传递，
 *    服务端从 topLevel.dbConversationId 读取数据库 ID。
 *
 *   - dbConversationId : fetchServerSentEvents body（静态，与对话绑定）
 *   - temperature / modelProvider : useAIChat body（动态，随 config 实时同步）
 */

import { fetchServerSentEvents, useChat as useAIChat } from '@tanstack/ai-react'
import type { UIMessage } from '@tanstack/ai'
import { useMemo } from 'react'
import { useAIConfig } from './use-ai-config'

interface UseChatOptions {
    conversationId?: string
    initialMessages?: UIMessage[]
}

export function useChat({ conversationId, initialMessages }: UseChatOptions = {}) {
    const { config } = useAIConfig()

    // connection 只包含静态信息（URL + 数据库对话 ID）
    // ❗ 用 dbConversationId 而不是 conversationId！
    //   ChatClient 源码会将 data.conversationId 强制覆盖为内部 ID：
    //   mergedBody = { ...ChatClient.body, conversationId: this.uniqueId }
    //   我们的 DB ID 传到 data 里会被覆盖，所以放在 fetchServerSentEvents.body 顶层传递。
    const connection = useMemo(
        () =>
            fetchServerSentEvents('/api/chat', {
                body: conversationId ? { dbConversationId: conversationId } : {},
            }),
        [conversationId],
    )

    // 系统 prompt 首条消息
    const systemMessage: UIMessage = useMemo(
        () => ({
            id: 'system',
            role: 'system' as const,
            parts: [{ type: 'text' as const, content: config.systemPrompt }],
        }),
        [config.systemPrompt],
    )

    return useAIChat({
        connection,
        // ↓ 这里的 body 会被 ChatClient.updateOptions({ body }) 实时同步
        // 每次 config 变化都会触发 useAIChat 内部的 useEffect 更新 ChatClient.body
        body: {
            temperature: config.temperature,
            modelProvider: config.modelProvider,
        },
        initialMessages:
            initialMessages && initialMessages.length > 0 ? initialMessages : [systemMessage],
        onError: (error) => {
            console.error('[useChat] Chat error:', error)
        },
    })
}
