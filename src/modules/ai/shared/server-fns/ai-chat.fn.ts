import { z } from 'zod'
import { fetchServerSentEvents } from '@tanstack/ai-react'
import { createServerFn } from '@tanstack/react-start'
import { requireUser } from '~/modules/auth/shared/lib/require-auth'
import { AiChatService } from '../services/ai-chat.service'

/**
 * 通用的权限校验辅助函数
 */
const requireUserId = async () => {
  return (await requireUser()).id
}

export const listConversationsFn = createServerFn({ method: 'GET' })
  .validator(z.object({ page: z.number().int().positive().max(100000).default(1) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    return AiChatService.listConversations(userId, data.page)
  })

export const getConversationMsgsFn = createServerFn({ method: 'GET' })
  .validator(z.object({ conversationId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    return AiChatService.getMessages(data.conversationId, userId)
  })

export const createConversationFn = createServerFn({ method: 'POST' })
  .validator(z.object({ title: z.string().optional() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    return AiChatService.createConversation(userId, data.title)
  })

export const deleteConversationFn = createServerFn({ method: 'POST' })
  .validator(z.object({ conversationId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    await AiChatService.deleteConversation(data.conversationId, userId)
    return { success: true }
  })
