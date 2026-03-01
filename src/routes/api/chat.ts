/**
 * Chat API Route
 *
 * 处理 AI 聊天的 API 端点，支持持久化流式处理
 */
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { createFileRoute } from '@tanstack/react-router'
import { type AIProvider, getAIAdapter } from '~/modules/ai/shared/lib/ai-config'
import { initRuntimeConfig, getRuntimeConfig } from '~/shared/config/runtime-config'
import { AiChatService } from '~/modules/ai/shared/services/ai-chat.service'
import { auth } from '~/modules/auth/shared/lib/auth'

// ─── 日志工具 ────────────────────────────────────────────────────────────────

const IS_DEV = process.env.NODE_ENV !== 'production'

/** 轻量服务端日志，带 [AI] 前缀和时间戳 */
const aiLog = {
    info: (msg: string, meta?: Record<string, unknown>) => {
        const ts = new Date().toISOString()
        if (meta) {
            console.log(`[${ts}] [AI] [INFO]  ${msg}`, meta)
        } else {
            console.log(`[${ts}] [AI] [INFO]  ${msg}`)
        }
    },
    debug: (msg: string, meta?: Record<string, unknown>) => {
        if (!IS_DEV) return
        const ts = new Date().toISOString()
        if (meta) {
            console.log(`[${ts}] [AI] [DEBUG] ${msg}`, meta)
        } else {
            console.log(`[${ts}] [AI] [DEBUG] ${msg}`)
        }
    },
    warn: (msg: string, meta?: Record<string, unknown>) => {
        const ts = new Date().toISOString()
        if (meta) {
            console.warn(`[${ts}] [AI] [WARN]  ${msg}`, meta)
        } else {
            console.warn(`[${ts}] [AI] [WARN]  ${msg}`)
        }
    },
    error: (msg: string, err?: unknown, meta?: Record<string, unknown>) => {
        const ts = new Date().toISOString()
        const errStr = err instanceof Error ? err.message : String(err ?? '')
        const stack = err instanceof Error ? err.stack : undefined
        console.error(`[${ts}] [AI] [ERROR] ${msg}`, { error: errStr, stack, ...meta })
    },
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/**
 * 提取消息 content 的纯文本内容
 * content 可能是字符串、TanStack AI 的 ContentPart[] 数组或 undefined
 */
function extractTextContent(content: unknown): string {
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
        return content
            .filter((p: any) => p?.type === 'text')
            .map((p: any) => String(p?.content ?? p?.text ?? ''))
            .join('')
    }
    return ''
}

/**
 * 提取 TanStack AI UIMessage.parts 数组的纯文本内容
 * parts 格式： [{ type: 'text', content: '...' }]
 */
function extractPartsContent(parts: unknown): string {
    if (!Array.isArray(parts)) return ''
    return parts
        .filter((p: any) => p?.type === 'text')
        .map((p: any) => String(p?.content ?? ''))
        .join('')
}

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/api/chat')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const reqStart = Date.now()

                try {
                    // ── 1. 鉴权 ───────────────────────────────────────────────────────
                    const session = await auth.api.getSession({ headers: request.headers })
                    if (!session?.user?.id) {
                        aiLog.warn('Unauthorized request - no valid session')
                        return new Response('Unauthorized', { status: 401 })
                    }
                    const userId = session.user.id

                    // ── 2. 初始化运行时配置（加载 system_config 表） ──────────────────
                    // getRuntimeConfig 是同步的，依赖 store.values 已被填充。
                    // 如果不先 await initRuntimeConfig()，store 可能为空，
                    // getRuntimeConfig 只能读到 .env 的默认值，忽略 system_config 表的设置。
                    await initRuntimeConfig()

                    // ── 2. 解析请求体 ─────────────────────────────────────────────────
                    // TanStack AI 发送的请求体结构：
                    // {
                    //   messages: [...],                 ← 消息数组（UIMessage 格式，parts 字段）
                    //   data: {                          ← ChatClient.body + ChatClient 内部追加
                    //     temperature, modelProvider,    ← 来自 useAIChat body 选项
                    //     conversationId: '_R_xxx_',     ← ChatClient 内部 uniqueId（不是 DB ID！）
                    //   },
                    //   dbConversationId: 'db-xxx',      ← 我们的 DB ID，在 fetchServerSentEvents.body 顶层
                    // }
                    const rawBody = await request.json()

                    aiLog.debug('Raw request body keys', {
                        keys: Object.keys(rawBody),
                        dataKeys: rawBody.data ? Object.keys(rawBody.data) : 'no data field',
                    })

                    const messages = rawBody.messages
                    // ✅ 从顶层 dbConversationId 读取（避免被 ChatClient 的 uniqueId 覆盖）
                    const conversationId: string | undefined = rawBody.dbConversationId
                    // temperature / modelProvider / systemPrompt 由 useAIChat body 传入，在 data 字段里
                    const temperature = rawBody.data?.temperature ?? rawBody.temperature
                    const systemPrompt: string | undefined = rawBody.data?.systemPrompt

                    // modelProvider 优先级：
                    //   1. 前端用户选择的值（data.modelProvider）
                    //   2. system_config 表或 AI_PROVIDER 环境变量（兜底）
                    const clientProvider = rawBody.data?.modelProvider ?? rawBody.modelProvider
                    const systemProvider = getRuntimeConfig('ai.provider')
                    const modelProvider: AIProvider = (clientProvider as AIProvider) ?? systemProvider

                    aiLog.debug('Provider resolution', {
                        clientSent: clientProvider ?? '(none)',
                        systemConfig: systemProvider,
                        resolved: modelProvider,
                    })

                    if (!Array.isArray(messages) || messages.length === 0) {
                        aiLog.warn('Invalid request: messages array is empty or missing', { userId })
                        return new Response('Invalid request body', { status: 400 })
                    }

                    const latestMessage = messages[messages.length - 1]
                    // TanStack AI 发送的消息格式是 UIMessage（parts 数组），不是 content 字符串
                    // 同时兼容普通 OpenAI 格式（content 字符串）
                    const latestText = extractTextContent(latestMessage?.content)
                        || extractPartsContent(latestMessage?.parts)
                    const resolvedTemp = temperature !== undefined ? Number(temperature) : 0.7

                    aiLog.info('Chat request received', {
                        userId,
                        provider: modelProvider,
                        temperature: resolvedTemp,
                        messageCount: messages.length,
                        conversationId: conversationId ?? '(new)',
                        latestRole: latestMessage?.role,
                        // 只记录前 80 个字，避免日志过大
                        latestContentPreview: latestText.slice(0, 80) + (latestText.length > 80 ? '…' : ''),
                    })

                    // ── 3. 确定对话 ID ────────────────────────────────────────────────
                    let activeConversationId = conversationId

                    if (!activeConversationId) {
                        const titleSnippet = latestText.slice(0, 40)
                        const conv = await AiChatService.createConversation(
                            userId,
                            titleSnippet
                                ? titleSnippet + (latestText.length > 40 ? '...' : '')
                                : '新对话',
                        )
                        activeConversationId = conv.id
                        aiLog.info('New conversation created', {
                            userId,
                            conversationId: activeConversationId,
                            title: conv.title,
                        })
                    } else {
                        aiLog.debug('Using existing conversation', {
                            userId,
                            conversationId: activeConversationId,
                        })
                    }

                    // ── 4. 用户消息入库 ───────────────────────────────────────────────
                    if (latestText) {
                        await AiChatService.saveMessage(
                            activeConversationId,
                            latestMessage.role,
                            latestText,
                        )
                        aiLog.debug('User message saved', {
                            conversationId: activeConversationId,
                            role: latestMessage.role,
                            length: latestText.length,
                        })
                    } else {
                        aiLog.warn('Latest message has no extractable text content', {
                            conversationId: activeConversationId,
                            role: latestMessage?.role,
                            contentType: Array.isArray(latestMessage?.content)
                                ? 'ContentPart[]'
                                : typeof latestMessage?.content,
                        })
                    }

                    // ── 5. 构建 AI Adapter 并发起流式请求 ────────────────────────────
                    let adapter
                    try {
                        adapter = getAIAdapter(modelProvider)
                    } catch (error_) {
                        aiLog.error('Failed to initialize AI adapter', error_, {
                            provider: modelProvider,
                            userId,
                        })
                        throw error_
                    }

                    aiLog.info('Starting AI stream', {
                        conversationId: activeConversationId,
                        provider: modelProvider,
                        temperature: resolvedTemp,
                    })

                    const streamStart = Date.now()

                    // 过滤掉客户端异常传入的 role=system 消息（防止重复注入）
                    const chatMessages = messages.filter((m: any) => m.role !== 'system')

                    // systemPrompts 是 TanStack AI chat() 的官方入口，由 adapter 内部注入为 system message
                    // 优先级：前端自定义 systemPrompt > system_config 表 / AI_SYSTEM_PROMPT 环境变量
                    const resolvedSystemPrompt =
                        systemPrompt?.trim() || getRuntimeConfig('ai.systemPrompt')

                    aiLog.info('System Prompt', { resolvedSystemPrompt })
                    const aiStream = chat({
                        adapter: adapter(),
                        messages: chatMessages,
                        systemPrompts: [resolvedSystemPrompt],
                        conversationId: activeConversationId,
                        temperature: resolvedTemp,
                    })

                    // ── 6. 拦截流，收集完整回复并入库 ───────────────────────────────
                    async function* interceptStream() {
                        let fullResponse = ''
                        let chunkCount = 0
                        let firstChunkMs: number | null = null
                        let usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | null = null
                        let modelName: string | undefined

                        try {
                            for await (const chunk of aiStream) {
                                // 记录首 chunk 延迟（TTFB）
                                if (chunkCount === 0) {
                                    firstChunkMs = Date.now() - streamStart
                                    aiLog.info('First chunk received (TTFB)', {
                                        conversationId: activeConversationId,
                                        ttfbMs: firstChunkMs,
                                        chunkType: chunk.type,
                                    })
                                }
                                chunkCount++

                                if (chunk.type === 'TEXT_MESSAGE_CONTENT') {
                                    const textDelta = (chunk as any).delta || (chunk as any).text || (chunk as any).content || ''
                                    fullResponse += textDelta
                                }

                                // 提取 usage 信息（通常在 finish chunk 中）
                                if (chunk.type === 'RUN_FINISHED') {
                                    const chunkUsage = (chunk as any).usage
                                    if (chunkUsage) {
                                        usage = {
                                            promptTokens: chunkUsage.promptTokens ?? chunkUsage.inputTokens,
                                            completionTokens: chunkUsage.completionTokens ?? chunkUsage.outputTokens,
                                            totalTokens: chunkUsage.totalTokens,
                                        }
                                        modelName = (chunk as any).model
                                        aiLog.debug('Usage data extracted from finish chunk', {
                                            conversationId: activeConversationId,
                                            usage,
                                            model: modelName,
                                        })
                                    }
                                }

                                // RUN_ERROR 事件记录错误
                                if (chunk.type === 'RUN_ERROR') {
                                    aiLog.error('AI stream returned RUN_ERROR event', undefined, {
                                        conversationId: activeConversationId,
                                        error: (chunk as any).error,
                                    })
                                }

                                yield chunk
                            }
                        } catch (streamErr) {
                            aiLog.error('AI stream threw an exception', streamErr, {
                                conversationId: activeConversationId,
                                chunksReceivedBeforeError: chunkCount,
                            })
                            throw streamErr
                        }

                        const totalMs = Date.now() - streamStart
                        aiLog.info('AI stream completed', {
                            conversationId: activeConversationId,
                            provider: modelProvider,
                            totalChunks: chunkCount,
                            responseLength: fullResponse.length,
                            ttfbMs: firstChunkMs,
                            totalMs,
                            usage: usage ?? 'N/A',
                            model: modelName ?? 'N/A',
                        })

                        // 异步存库，包含 token 统计
                        if (fullResponse) {
                            AiChatService.saveMessage(
                                activeConversationId!,
                                'assistant',
                                fullResponse,
                                usage
                                    ? {
                                          inputTokens: usage.promptTokens,
                                          outputTokens: usage.completionTokens,
                                          totalTokens: usage.totalTokens,
                                          model: modelName,
                                      }
                                    : undefined,
                            ).catch((saveErr) => {
                                aiLog.error('Failed to save assistant response to DB', saveErr, {
                                    conversationId: activeConversationId,
                                    responseLength: fullResponse.length,
                                })
                            })
                        } else {
                            aiLog.warn('Stream ended with empty response, skipping DB save', {
                                conversationId: activeConversationId,
                                totalChunks: chunkCount,
                            })
                        }
                    }

                    return toServerSentEventsResponse(interceptStream())
                } catch (error) {
                    const elapsedMs = Date.now() - reqStart
                    aiLog.error('Chat API handler threw an unhandled error', error, { elapsedMs })

                    return new Response(
                        JSON.stringify({
                            error: error instanceof Error ? error.message : '未知错误',
                        }),
                        {
                            status: 500,
                            headers: { 'Content-Type': 'application/json' },
                        },
                    )
                }
            },
        },
    },
})
