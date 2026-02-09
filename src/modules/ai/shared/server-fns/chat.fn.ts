/**
 * Chat Server Function
 * 
 * 处理 AI 聊天请求的服务器函数
 */

import { createServerFn } from '@tanstack/react-start'
import { getAIAdapter } from '../lib/ai-config'
import { z } from 'zod'
import { chat, toServerSentEventsResponse } from "@tanstack/ai";

const chatInputSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string(),
        })
    ),
    conversationId: z.string(),
})

export type ChatInput = z.infer<typeof chatInputSchema>

/**
 * 聊天 Server Function
 * 支持流式响应
 */
export const chatFn = createServerFn({ method: 'POST' })
    .inputValidator(chatInputSchema)
    .handler(async ({ data }) => {
        try {
            // 使用 streamText 进行流式响应
            const adapter = getAIAdapter('openai')
            const stream = chat({
                adapter: adapter(),
                messages: data.messages,
                conversationId: data.conversationId,
            });
            return toServerSentEventsResponse(stream);
        } catch (error) {
            console.error('Chat error:', error)
            throw new Error(`AI 聊天失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    })
