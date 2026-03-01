/**
 * AI Chat Admin Server Functions
 * [迁移自 admin/shared/server-fns/ai-chat.fn.ts]
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from '~/modules/admin/shared/server-fns/auth'
import { AiChatService } from '~/modules/ai/shared/services/ai-chat.service'

const ListConversationsSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    filter: z.string().optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
})

export const listAIConversationsFn = createServerFn({ method: 'GET' })
    .inputValidator((data?: z.infer<typeof ListConversationsSchema>) => (data ? ListConversationsSchema.parse(data) : {}))
    .handler(async ({ data }: { data: z.infer<typeof ListConversationsSchema> }) => {
        await requireAdmin('ListAIConversations')
        return AiChatService.adminListConversations(data ?? {})
    })

export const getAIConversationFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { conversationId: string }) => {
        if (!data?.conversationId) throw new Error('conversationId 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { conversationId: string } }) => {
        await requireAdmin('GetAIConversation')
        return AiChatService.adminGetConversation(data.conversationId)
    })

export const deleteAIConversationFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { conversationId: string }) => {
        if (!data?.conversationId) throw new Error('conversationId 不能为空')
        return data
    })
    .handler(async ({ data }: { data: { conversationId: string } }) => {
        await requireAdmin('DeleteAIConversation')
        return AiChatService.adminDeleteConversation(data.conversationId)
    })
