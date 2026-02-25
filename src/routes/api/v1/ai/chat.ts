import { createFileRoute } from '@tanstack/react-router'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { z } from 'zod'
import { type AIProvider, getAIAdapter } from '~/modules/ai/shared/lib/ai-config'
import { auth } from '~/modules/auth/shared/lib/auth'

const ChatRequestSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string(),
        })
    ),
    conversationId: z.string().optional(),
    modelProvider: z
        .enum(['openai', 'gemini', 'deepseek', 'qwen', 'zhipu', 'ernie'])
        .optional(),
    temperature: z.number().optional()
})

export const Route = createFileRoute('/api/v1/ai/chat')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    // 1. Check Auth
                    const session = await auth.api.getSession({ headers: request.headers })
                    if (!session?.user) {
                        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                            status: 401,
                            headers: { 'Content-Type': 'application/json' },
                        })
                    }

                    // 2. Parse Body
                    let bodyRaw: unknown
                    try {
                        bodyRaw = await request.json()
                    } catch {
                        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' },
                        })
                    }

                    const parsed = ChatRequestSchema.safeParse(bodyRaw)
                    if (!parsed.success) {
                        return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.issues }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' },
                        })
                    }

                    const data = parsed.data

                    // 3. Obtain AI Adapter and Stream 
                    const adapter = getAIAdapter(data.modelProvider as AIProvider | undefined)
                    const stream = chat({
                        adapter: adapter(),
                        messages: data.messages as any,
                        conversationId: data.conversationId,
                        temperature: data.temperature ?? 0.7,
                    })

                    // 4. Return as Server Sent Events natively
                    return toServerSentEventsResponse(stream)
                } catch (error: any) {
                    console.error('[API ai chat error]:', error)
                    return new Response(JSON.stringify({ error: error?.message || 'Chat generation failed' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
            },
        },
    },
})
