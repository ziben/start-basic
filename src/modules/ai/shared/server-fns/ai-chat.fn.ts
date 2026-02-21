import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AiChatService } from '../services/ai-chat.service'
import { fetchServerSentEvents } from '@tanstack/ai-react'

/**
 * 通用的权限校验辅助函数
 */
const requireUserId = async () => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { auth } = await import('~/modules/auth/shared/lib/auth')
    const request = getRequest()
    if (!request) throw new Error('Unauthorized')

    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) throw new Error('Unauthorized')
    return session.user.id
}

export const listConversationsFn = createServerFn({ method: 'GET' })
    .handler(async () => {
        const userId = await requireUserId()
        return AiChatService.listConversations(userId)
    })

export const getConversationMsgsFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ conversationId: z.string().min(1) }))
    .handler(async ({ data }) => {
        const userId = await requireUserId()
        return AiChatService.getMessages(data.conversationId, userId)
    })

export const createConversationFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ title: z.string().optional() }))
    .handler(async ({ data }) => {
        const userId = await requireUserId()
        return AiChatService.createConversation(userId, data.title)
    })

export const deleteConversationFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ conversationId: z.string().min(1) }))
    .handler(async ({ data }) => {
        const userId = await requireUserId()
        await AiChatService.deleteConversation(data.conversationId, userId)
        return { success: true }
    })
