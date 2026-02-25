import { createFileRoute } from '@tanstack/react-router'
/**
 * Chat API Route
 *
 * 处理 AI 聊天的 API 端点，支持持久化流式处理
 */
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { type AIProvider, getAIAdapter } from '~/modules/ai/shared/lib/ai-config'
import { auth } from '~/modules/auth/shared/lib/auth'
import { AiChatService } from '~/modules/ai/shared/services/ai-chat.service'

export const Route = createFileRoute('/api/chat')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    // 1. 获取当前用户
                    const session = await auth.api.getSession({ headers: request.headers })
                    if (!session?.user?.id) {
                        return new Response('Unauthorized', { status: 401 })
                    }
                    const userId = session.user.id

                    const { messages, conversationId, temperature, modelProvider } = await request.json()

                    if (!Array.isArray(messages) || messages.length === 0) {
                        return new Response('Invalid request body', { status: 400 })
                    }

                    // 2. 确定或创建数据库中的 Conversation
                    let activeConversationId = conversationId
                    const latestMessage = messages[messages.length - 1]

                    if (!activeConversationId) {
                        // 如果没有提供 ID，说明是全新对话，基于第一条用户消息截断作为标题
                        const titleSnippet = latestMessage.content.slice(0, 40)
                        const conv = await AiChatService.createConversation(
                            userId,
                            titleSnippet + (latestMessage.content.length > 40 ? '...' : '')
                        )
                        activeConversationId = conv.id
                    }

                    // 3. 将用户的提问入库
                    await AiChatService.saveMessage(activeConversationId, latestMessage.role, latestMessage.content)

                    // 4. 调用底层大模型获取流
                    const adapter = getAIAdapter(modelProvider as AIProvider | undefined)
                    const aiStream = chat({
                        adapter: adapter(),
                        messages,
                        conversationId: activeConversationId,
                        temperature: temperature !== undefined ? Number(temperature) : 0.7,
                    });

                    // 5. 拦截和拼接 AI 的流式响应
                    async function* interceptStream() {
                        let fullResponse = ''

                        for await (const chunk of aiStream) {
                            // TanStack AI 中返回的文本块
                            if (chunk.type === 'TEXT_MESSAGE_CONTENT' && 'text' in chunk) {
                                fullResponse += chunk.text
                            }
                            yield chunk
                        }

                        // 流结束，将拼凑出的完整回答异步存入数据库
                        if (fullResponse) {
                            AiChatService.saveMessage(activeConversationId, 'assistant', fullResponse).catch(err => {
                                console.error('Failed to save AI response:', err)
                            })
                        }
                    }

                    return toServerSentEventsResponse(interceptStream());
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
