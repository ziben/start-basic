/**
 * TTS API Route  GET /api/tts
 *
 * 接收 messageId，从数据库读取消息内容（含权限校验），
 * 调用阿里云 DashScope CosyVoice 合成语音（本地 MD5 缓存，相同内容只合成一次），
 * 返回可直接播放的静态音频 URL。
 *
 * 查询参数:
 *   ?messageId=xxx   AIMessage 的主键 ID
 */
import { createFileRoute } from '@tanstack/react-router'
import { auth } from '~/modules/auth/shared/lib/auth'
import { AiChatService } from '~/modules/ai/shared/services/ai-chat.service'
import { getOrGenerateTTS } from '~/modules/ai/shared/lib/tts.service'

export const Route = createFileRoute('/api/tts')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                // ── 1. 功能开关 ─────────────────────────────────────────────────
                if (process.env.ENABLE_TTS !== 'true') {
                    return new Response(
                        JSON.stringify({ error: 'TTS 功能未启用，请在 .env 中设置 ENABLE_TTS=true' }),
                        { status: 503, headers: { 'Content-Type': 'application/json' } },
                    )
                }

                // ── 2. 鉴权 ────────────────────────────────────────────────────
                const session = await auth.api.getSession({ headers: request.headers })
                if (!session?.user?.id) {
                    return new Response(
                        JSON.stringify({ error: '未授权，请先登录' }),
                        { status: 401, headers: { 'Content-Type': 'application/json' } },
                    )
                }
                const userId = session.user.id

                // ── 3. 解析参数 ─────────────────────────────────────────────────
                const url = new URL(request.url)
                const messageId = url.searchParams.get('messageId')

                if (!messageId?.trim()) {
                    return new Response(
                        JSON.stringify({ error: '缺少 messageId 参数' }),
                        { status: 400, headers: { 'Content-Type': 'application/json' } },
                    )
                }

                try {
                    // ── 4. 从数据库读取消息内容（含权限校验） ─────────────────
                    const text = await AiChatService.getMessageForTTS(messageId, userId)

                    // ── 5. 生成或复用缓存音频 ──────────────────────────────────
                    const result = await getOrGenerateTTS(text)

                    // ── 6. 返回音频 URL ────────────────────────────────────────
                    return new Response(
                        JSON.stringify({
                            success: true,
                            audioUrl: result.audioUrl,
                            cached: result.cached,
                        }),
                        {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' },
                        },
                    )
                } catch (error) {
                    const message = error instanceof Error ? error.message : '语音合成失败'
                    const isAuthError =
                        message.includes('不存在') || message.includes('无权访问')

                    console.error('[TTS API]', message)

                    return new Response(
                        JSON.stringify({ error: message }),
                        {
                            status: isAuthError ? 403 : 500,
                            headers: { 'Content-Type': 'application/json' },
                        },
                    )
                }
            },
        },
    },
})
