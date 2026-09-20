import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CACHE_TIME } from '~/shared/lib/query-client'
import {
  listConversationsFn,
  getConversationMsgsFn,
  createConversationFn,
  deleteConversationFn,
} from '../server-fns/ai-chat.fn'

export function useConversationsQuery() {
  return useInfiniteQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: ({ pageParam }) => listConversationsFn({ data: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage.length === 30 ? pages.length + 1 : undefined),
    staleTime: CACHE_TIME.SHORT,
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
    onSuccess: (_, conversationId) => {
      queryClient.removeQueries({ queryKey: ['ai', 'messages', conversationId], exact: true })
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] })
    },
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title?: string) => createConversationFn({ data: { title } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] })
    },
  })
}
