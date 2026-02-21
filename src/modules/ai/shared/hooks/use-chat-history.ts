import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    listConversationsFn,
    getConversationMsgsFn,
    createConversationFn,
    deleteConversationFn
} from '../server-fns/ai-chat.fn'

export function useConversationsQuery() {
    return useQuery({
        queryKey: ['ai', 'conversations'],
        queryFn: () => listConversationsFn(),
    })
}

export function useConversationMessagesQuery(conversationId?: string) {
    return useQuery({
        queryKey: ['ai', 'messages', conversationId],
        queryFn: () => getConversationMsgsFn({ data: { conversationId: conversationId! } }),
        enabled: !!conversationId,
    })
}

export function useDeleteConversation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (conversationId: string) => deleteConversationFn({ data: { conversationId } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] })
        }
    })
}

export function useCreateConversation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (title?: string) => createConversationFn({ data: { title } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] })
        }
    })
}
