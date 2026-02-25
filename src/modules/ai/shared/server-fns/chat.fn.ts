/**
 * Chat Server Function
 *
 * 处理 AI 聊天请求的服务器函数
 * 支持 gemini、openai 以及国产大模型（deepseek、qwen、zhipu、ernie）
 * （注：当前应用推荐使用 /api/chat 路由进行完整的持久化流式处理，若直接需要流处理 Server Function 可以使用此方法）
 */

import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { type AIProvider, getAIAdapter } from '../lib/ai-config'

const chatInputSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string(),
        }),
    ),
    conversationId: z.string().optional(),
    modelProvider: z
        .enum(['openai', 'gemini', 'deepseek', 'qwen', 'zhipu', 'ernie'])
        .optional(),
    temperature: z.number().optional(),
})

export type ChatInput = z.infer<typeof chatInputSchema>

/**
 * 聊天 Server Function
 * 提供基本的请求流式响应
 */
export const chatFn = createServerFn({ method: 'POST' })
    .inputValidator(chatInputSchema)
    .handler(async ({ data }) => {
        try {
            // 使用配置的大模型适配器，带有健壮的安全检查
            const adapter = getAIAdapter(data.modelProvider as AIProvider | undefined)
            const stream = chat({
                adapter: adapter(),
                messages: data.messages as any,
                conversationId: data.conversationId,
                temperature: data.temperature ?? 0.7,
            })
            return toServerSentEventsResponse(stream)
        } catch (error) {
            console.error('Chat error:', error)
            throw new Error(`AI 聊天失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    })

