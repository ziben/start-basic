/**
 * AI Chat Admin Hooks
 */

import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import {
    listAIConversationsFn,
    getAIConversationFn,
    deleteAIConversationFn,
} from '../server-fns/ai-chat.fn'

// ============ 类型定义 ============

export interface AIConversationItem {
    id: string
    title: string
    userId: string
    userName: string | null
    userEmail: string | null
    createdAt: Date
    updatedAt: Date
    messageCount: number
}

export interface AIMessageItem {
    id: string
    role: string
    content: string
    inputTokens: number | null
    outputTokens: number | null
    totalTokens: number | null
    model: string | null
    createdAt: Date
}

export interface AIConversationDetail {
    id: string
    title: string
    userId: string
    userName: string | null
    userEmail: string | null
    createdAt: Date
    updatedAt: Date
    messages: AIMessageItem[]
    totalTokens: number | null
}

export interface AIConversationsListResult {
    items: AIConversationItem[]
    total: number
    page: number
    pageSize: number
    pageCount: number
}

// ============ Hooks ============

export function useAIConversations(params?: {
    page?: number
    pageSize?: number
    filter?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
}): UseQueryResult<AIConversationsListResult, Error> {
    return useQuery<AIConversationsListResult>({
        queryKey: ['ai-conversations', params],
        queryFn: async () => {
            const result = await listAIConversationsFn({ data: params })
            return result as AIConversationsListResult
        },
    })
}

export function useAIConversation(conversationId?: string): UseQueryResult<AIConversationDetail | null, Error> {
    return useQuery<AIConversationDetail | null>({
        queryKey: ['ai-conversation', conversationId],
        enabled: Boolean(conversationId),
        queryFn: async () => {
            if (!conversationId) return null
            const result = await getAIConversationFn({ data: { conversationId } })
            return result as AIConversationDetail | null
        },
    })
}

export function useDeleteAIConversation(): UseMutationResult<{ success: boolean }, Error, string> {
    return useMutation<{ success: boolean }, Error, string>({
        mutationFn: async (conversationId: string) => {
            const result = await deleteAIConversationFn({ data: { conversationId } })
            return result as { success: boolean }
        },
    })
}
