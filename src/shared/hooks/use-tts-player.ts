/**
 * useTTSPlayer Hook
 *
 * 通用的 AI 消息朗读 Hook，适用于 Web 端和微信小程序 H5 端。
 *
 * 功能：
 * - 通过 messageId 向 /api/tts 发请求获取音频 URL
 * - 管理播放/暂停/停止状态
 * - AI 回复流结束后支持「提前预加载」，用户点击时实现近似秒播
 * - 自动清理 Audio 实例，防止内存泄漏
 *
 * 用法：
 * ```tsx
 * const { isLoading, isPlaying, play, stop } = useTTSPlayer(messageId)
 *
 * <Button onClick={isPlaying ? stop : play}>
 *   {isLoading ? '生成中...' : isPlaying ? '停止' : '朗读'}
 * </Button>
 * ```
 */
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

interface TTSApiResponse {
    success: boolean
    audioUrl: string
    cached: boolean
    error?: string
}

type PlayState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface UseTTSPlayerReturn {
    /** 当前播放状态 */
    state: PlayState
    /** 是否正在加载（请求接口中） */
    isLoading: boolean
    /** 是否正在播放 */
    isPlaying: boolean
    /** 错误信息 */
    error: string | null
    /** 开始播放（若已有缓存则直接播） */
    play: () => Promise<void>
    /** 停止播放并重置进度 */
    stop: () => void
    /** 暂停播放 */
    pause: () => void
    /**
     * 提前预加载音频（建议在 AI 回复流结束时调用）
     * 用户点击播放时可实现近似秒播
     */
    preload: () => Promise<void>
}

// ─── Hook 实现 ────────────────────────────────────────────────────────────────

/**
 * @param messageId AI 消息的数据库 ID，为 null/undefined 时 Hook 处于未激活状态
 */
export function useTTSPlayer(messageId: string | null | undefined): UseTTSPlayerReturn {
    const [state, setState] = useState<PlayState>('idle')
    const [error, setError] = useState<string | null>(null)

    // 已解析的音频 URL（缓存用，避免重复请求接口）
    const resolvedUrlRef = useRef<string | null>(null)
    // 进行中的 URL 请求（用于 preload/play 之间去重）
    const pendingUrlRef = useRef<Promise<string> | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    // Native Audio 实例
    const audioRef = useRef<HTMLAudioElement | null>(null)
    // 组件卸载标志，防止异步回调操作已卸载的组件
    const unmountedRef = useRef(false)

    const clearPendingRequest = useCallback(() => {
        abortControllerRef.current?.abort()
        abortControllerRef.current = null
        pendingUrlRef.current = null
    }, [])

    // ── 清理 Audio 实例 ──────────────────────────────────────────────────────
    const destroyAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ''
            audioRef.current.onended = null
            audioRef.current.onerror = null
            audioRef.current = null
        }
    }, [])

    const resetPlayer = useCallback(() => {
        clearPendingRequest()
        destroyAudio()
        resolvedUrlRef.current = null
        setState('idle')
        setError(null)
    }, [clearPendingRequest, destroyAudio])

    const isAbortError = useCallback((err: unknown) => {
        return err instanceof DOMException && err.name === 'AbortError'
    }, [])

    // ── 组件 unmount 时清理 ──────────────────────────────────────────────────
    useEffect(() => {
        unmountedRef.current = false
        return () => {
            unmountedRef.current = true
            clearPendingRequest()
            destroyAudio()
        }
    }, [clearPendingRequest, destroyAudio])

    // ── messageId 变化时重置状态（切换到不同消息） ───────────────────────────
    useEffect(() => {
        resetPlayer()
    }, [messageId, resetPlayer])

    // ── 获取音频 URL（含接口请求和缓存） ────────────────────────────────────
    const getAudioUrl = useCallback(async (): Promise<string> => {
        // 已有缓存 URL，直接复用
        if (resolvedUrlRef.current) return resolvedUrlRef.current
        if (pendingUrlRef.current) return pendingUrlRef.current

        if (!messageId) throw new Error('messageId 不能为空')

        const controller = new AbortController()
        abortControllerRef.current = controller

        const request = (async () => {
            const res = await fetch(`/api/tts?messageId=${encodeURIComponent(messageId)}`, {
                signal: controller.signal,
            })
            const data: TTSApiResponse = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.error ?? '获取音频失败')
            }

            resolvedUrlRef.current = data.audioUrl
            return data.audioUrl
        })()

        pendingUrlRef.current = request

        try {
            return await request
        } finally {
            if (pendingUrlRef.current === request) {
                pendingUrlRef.current = null
            }
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null
            }
        }
    }, [messageId])

    // ── 创建并配置 Audio 实例 ────────────────────────────────────────────────
    const createAudio = useCallback((url: string): HTMLAudioElement => {
        destroyAudio()
        const audio = new Audio(url)

        audio.onended = () => {
            if (!unmountedRef.current) setState('idle')
        }

        audio.onerror = () => {
            if (!unmountedRef.current) {
                setState('error')
                setError('音频播放失败，请重试')
            }
        }

        audioRef.current = audio
        return audio
    }, [destroyAudio])

    const ensureAudio = useCallback((url: string, { preload = false }: { preload?: boolean } = {}) => {
        const currentAudio = audioRef.current
        if (currentAudio && currentAudio.src === url) {
            if (preload) currentAudio.preload = 'auto'
            return currentAudio
        }

        const audio = createAudio(url)
        if (preload) audio.preload = 'auto'
        return audio
    }, [createAudio])

    // ── play ─────────────────────────────────────────────────────────────────
    const play = useCallback(async () => {
        if (!messageId) return

        try {
            setError(null)
            setState('loading')

            const url = await getAudioUrl()
            if (unmountedRef.current) return

            const audio = ensureAudio(url)
            await audio.play()

            if (!unmountedRef.current) setState('playing')
        } catch (err) {
            if (!unmountedRef.current && !isAbortError(err)) {
                const msg = err instanceof Error ? err.message : '播放失败'
                setError(msg)
                setState('error')
            }
        }
    }, [messageId, getAudioUrl, ensureAudio, isAbortError])

    // ── stop ─────────────────────────────────────────────────────────────────
    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
        setState('idle')
    }, [])

    // ── pause ────────────────────────────────────────────────────────────────
    const pause = useCallback(() => {
        if (audioRef.current && state === 'playing') {
            audioRef.current.pause()
            setState('paused')
        }
    }, [state])

    // ── preload（提前预热，建议在 AI 回复流结束时调用） ──────────────────────
    const preload = useCallback(async () => {
        if (!messageId || resolvedUrlRef.current) return
        try {
            const url = await getAudioUrl()
            if (unmountedRef.current) return
            ensureAudio(url, { preload: true })
        } catch (err) {
            if (isAbortError(err)) return
            // preload 失败静默处理，不影响主流程
        }
    }, [messageId, getAudioUrl, ensureAudio, isAbortError])

    return {
        state,
        isLoading: state === 'loading',
        isPlaying: state === 'playing',
        error,
        play,
        stop,
        pause,
        preload,
    }
}
