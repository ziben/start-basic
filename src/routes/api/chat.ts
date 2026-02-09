import { createFileRoute } from '@tanstack/react-router'
/**
 * Chat API Route
 * 
 * 处理 AI 聊天的 API 端点
 */
import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import { getAIAdapter } from '~/modules/ai/shared/lib/ai-config'

export const Route = createFileRoute('/api/chat')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const { messages, conversationId } = await request.json()

                    if (!Array.isArray(messages)) {
                        return new Response('Invalid request body', { status: 400 })
                    }

                    const adapter = getAIAdapter('gemini')
                    const stream = chat({
                        adapter: adapter(),
                        messages,
                        conversationId,
                    });
                    return toServerSentEventsResponse(stream);
                } catch (error) {
                    console.error('Chat API error:', error)
                    return new Response(
                        JSON.stringify({
                            error: error instanceof Error ? error.message : '未知错误',
                        }),
                        {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' },
                        }
                    )
                }
            },
        }
    }
})

