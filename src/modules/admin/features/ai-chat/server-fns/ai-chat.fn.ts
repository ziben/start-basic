/**
 * AI Chat Admin Server Functions
 * [迁移自 admin/shared/server-fns/ai-chat.fn.ts]
 */
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
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
  .validator(ListConversationsSchema.optional().default({}))
  .handler(async ({ data }: { data: z.infer<typeof ListConversationsSchema> }) => {
    await requireAdmin('ListAIConversations')
    return AiChatService.adminListConversations(data ?? {})
  })

export const getAIConversationFn = createServerFn({ method: 'GET' })
  .validator(z.object({ conversationId: z.string().min(1) }))
  .handler(async ({ data }: { data: { conversationId: string } }) => {
    await requireAdmin('GetAIConversation')
    return AiChatService.adminGetConversation(data.conversationId)
  })

export const deleteAIConversationFn = createServerFn({ method: 'POST' })
  .validator(z.object({ conversationId: z.string().min(1) }))
  .handler(async ({ data }: { data: { conversationId: string } }) => {
    await requireAdmin('DeleteAIConversation')
    return AiChatService.adminDeleteConversation(data.conversationId)
  })
